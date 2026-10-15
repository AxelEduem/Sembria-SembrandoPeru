<?php

namespace App\Services\Asistencia;

use App\Models\Asistencia;
use App\Models\AsistenciaConfiguracion;
use App\Models\NotificacionAsistencia;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class AttendanceReminderService
{
    private const TIMEZONE = 'America/Lima';

    public function __construct(private readonly PeruHolidayService $holidays) {}

    public function generateAll(): int
    {
        $count = 0;
        User::query()->whereHas('cuentaAcceso', fn ($query) => $query->where('activo', true))
            ->eachById(function (User $user) use (&$count): void {
                $count += $this->generateForUser($user);
            });

        return $count;
    }

    public function generateForUser(User $user): int
    {
        $now = CarbonImmutable::now(self::TIMEZONE);
        if ($this->holidays->isNonWorkingDay($now)) {
            return 0;
        }
        $settings = AsistenciaConfiguracion::current();
        $context = DB::table('cuentas_acceso as account')
            ->join('integrantes as member', 'member.persona_id', '=', 'account.persona_id')
            ->join('integrantes_historial as history', 'history.integrante_id', '=', 'member.id')
            ->where('account.user_id', $user->id)
            ->where('account.activo', true)
            ->where('member.estado', 'Activo')
            ->where('history.estado', 'Activo')
            ->where('history.requiere_asistencia', true)
            ->where('history.tipo_integrante', '!=', 'gerente')
            ->where(fn ($query) => $query->whereNull('history.fecha_inicio')->orWhereDate('history.fecha_inicio', '<=', $now->toDateString()))
            ->where(fn ($query) => $query->whereNull('history.fecha_fin')->orWhereDate('history.fecha_fin', '>=', $now->toDateString()))
            ->latest('history.id')
            ->first(['member.id as integrante_id', 'history.id as historial_id']);

        if ($context === null) {
            return 0;
        }

        $created = 0;
        $open = Asistencia::query()
            ->where('integrante_id', $context->integrante_id)
            ->where('estado', 'en_jornada')
            ->whereNull('hora_salida')
            ->latest('fecha')
            ->first();

        if ($open !== null) {
            $end = CarbonImmutable::parse($open->fecha->format('Y-m-d').' '.$open->hora_fin_programada, self::TIMEZONE);
            if ($now->gte($end)) {
                $created += $this->notify($user, $open, 'jornada_sin_cerrar', 'Jornada pendiente de cierre', 'Tu horario ya terminó. Registra la salida y describe lo realizado.');
            } elseif ($now->betweenIncluded($end->subMinutes($settings->recordatorio_salida), $end)) {
                $created += $this->notify($user, $open, 'salida_proxima', 'Tu jornada está por terminar', 'Faltan pocos minutos para el fin de tu bloque.');
            }
        }

        $schedules = DB::table('integrante_horarios')
            ->where('historial_id', $context->historial_id)
            ->where('dia_semana', $now->isoWeekday())
            ->get();

        foreach ($schedules as $schedule) {
            $attendance = Asistencia::query()
                ->where('integrante_id', $context->integrante_id)
                ->whereDate('fecha', $now->toDateString())
                ->where('horario_id', $schedule->id)
                ->first();
            if ($attendance !== null) {
                continue;
            }

            $start = CarbonImmutable::parse($now->toDateString().' '.$schedule->hora_inicio, self::TIMEZONE);
            $end = CarbonImmutable::parse($now->toDateString().' '.$schedule->hora_fin, self::TIMEZONE);
            $advance = (int) $settings->recordatorio_inicio;
            if ($now->betweenIncluded($start->subMinutes($advance), $start)) {
                $created += $this->notify($user, null, 'inicio_proximo', 'Tu jornada está por iniciar', 'Ya puedes registrar tu entrada.', "horario-{$schedule->id}");
            } elseif ($now->gt($start) && $now->lt($end)) {
                $created += $this->notify($user, null, 'entrada_pendiente', 'Entrada pendiente', 'Tu bloque ya inició y todavía no registras la entrada.', "horario-{$schedule->id}");
            }
        }

        return $created;
    }

    private function notify(User $user, ?Asistencia $attendance, string $type, string $title, string $message, ?string $context = null): int
    {
        $date = CarbonImmutable::now(self::TIMEZONE)->toDateString();
        $key = implode('-', [$type, $user->id, $attendance?->id ?? $date, $context]);

        return NotificacionAsistencia::query()->firstOrCreate(
            ['clave' => $key],
            [
                'user_id' => $user->id,
                'asistencia_id' => $attendance?->id,
                'tipo' => $type,
                'titulo' => $title,
                'mensaje' => $message,
            ],
        )->wasRecentlyCreated ? 1 : 0;
    }
}
