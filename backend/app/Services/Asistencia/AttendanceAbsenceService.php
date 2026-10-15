<?php

namespace App\Services\Asistencia;

use App\Models\Asistencia;
use App\Models\AsistenciaConfiguracion;
use App\Models\AsistenciaIncidencia;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class AttendanceAbsenceService
{
    private const TIMEZONE = 'America/Lima';

    public function __construct(private readonly PeruHolidayService $holidays) {}

    public function processExpired(
        CarbonImmutable $date,
        ?int $integranteId = null,
        ?int $areaId = null,
    ): int {
        $target = $date->setTimezone(self::TIMEZONE)->startOfDay();
        $now = CarbonImmutable::now(self::TIMEZONE);

        if ($this->holidays->isNonWorkingDay($target)) {
            return 0;
        }

        if ($target->isAfter($now->startOfDay())) {
            return 0;
        }

        $query = DB::table('integrante_horarios as schedule')
            ->join('integrantes_historial as history', 'history.id', '=', 'schedule.historial_id')
            ->join('integrantes as member', 'member.id', '=', 'history.integrante_id')
            ->where('member.estado', 'Activo')
            ->where('history.estado', 'Activo')
            ->where('history.requiere_asistencia', true)
            ->where('history.tipo_integrante', '!=', 'gerente')
            ->where('schedule.dia_semana', $target->isoWeekday())
            ->where(fn ($builder) => $builder
                ->whereNull('history.fecha_inicio')
                ->orWhereDate('history.fecha_inicio', '<=', $target->toDateString()))
            ->where(fn ($builder) => $builder
                ->whereNull('history.fecha_fin')
                ->orWhereDate('history.fecha_fin', '>=', $target->toDateString()))
            ->when($integranteId !== null, fn ($builder) => $builder->where('member.id', $integranteId))
            ->when($areaId !== null, fn ($builder) => $builder
                ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
                ->where('position.area_id', $areaId));

        if ($target->isSameDay($now)) {
            $cutoff = $now->subMinutes(AsistenciaConfiguracion::current()->minutos_gracia_falta);
            $query->where('schedule.hora_fin', '<=', $cutoff->format('H:i:s'));
        }

        $candidates = $query->get([
            'member.id as integrante_id',
            'history.id as historial_id',
            'schedule.id as horario_id',
            'schedule.hora_inicio',
            'schedule.hora_fin',
        ]);
        $processed = 0;

        foreach ($candidates as $candidate) {
            if (DB::table('asistencia_permisos')
                ->where('integrante_id', $candidate->integrante_id)
                ->where('estado', 'aprobada')
                ->whereDate('fecha_inicio', '<=', $target->toDateString())
                ->whereDate('fecha_fin', '>=', $target->toDateString())
                ->exists()) {
                continue;
            }

            $created = DB::transaction(function () use ($candidate, $target): bool {
                $scheduledMinutes = $this->scheduledMinutes(
                    $candidate->hora_inicio,
                    $candidate->hora_fin,
                );
                $attendance = Asistencia::query()->firstOrCreate(
                    [
                        'integrante_id' => $candidate->integrante_id,
                        'fecha' => $target->toDateString(),
                        'horario_id' => $candidate->horario_id,
                    ],
                    [
                        'historial_id' => $candidate->historial_id,
                        'hora_inicio_programada' => $candidate->hora_inicio,
                        'hora_fin_programada' => $candidate->hora_fin,
                        'minutos_programados' => $scheduledMinutes,
                        'minutos_realizados' => 0,
                        'minutos_tardanza' => 0,
                        'minutos_salida_anticipada' => 0,
                        'minutos_incumplidos' => $scheduledMinutes,
                        'estado' => 'falta',
                        'observacion' => 'Bloque vencido sin registro de entrada.',
                    ]
                );

                if (! $attendance->wasRecentlyCreated) {
                    return false;
                }

                AsistenciaIncidencia::query()->create([
                    'asistencia_id' => $attendance->id,
                    'tipo' => 'inasistencia',
                    'minutos' => $scheduledMinutes,
                    'descripcion' => 'No se registró el inicio del bloque antes de su hora de fin.',
                    'registrado_por' => null,
                ]);

                DB::table('asistencia_auditoria')->insert([
                    'asistencia_id' => $attendance->id,
                    'accion' => 'actualizada',
                    'actor_id' => null,
                    'datos_anteriores' => null,
                    'datos_nuevos' => json_encode($attendance->toArray(), JSON_THROW_ON_ERROR),
                    'motivo' => 'Falta generada automáticamente por bloque vencido.',
                    'created_at' => CarbonImmutable::now(),
                    'updated_at' => CarbonImmutable::now(),
                ]);

                return true;
            });

            if ($created) {
                $processed++;
            }
        }

        return $processed;
    }

    private function scheduledMinutes(string $start, string $end): int
    {
        $startTime = CarbonImmutable::parse($start);
        $endTime = CarbonImmutable::parse($end);

        return (int) (($endTime->getTimestamp() - $startTime->getTimestamp()) / 60);
    }
}
