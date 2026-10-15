<?php

namespace App\Services\Asistencia;

use App\Models\Asistencia;
use App\Models\AsistenciaAmonestacion;
use App\Models\AsistenciaJustificacion;
use App\Models\NotificacionAsistencia;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceTrackingService
{
    public function __construct(
        private readonly InstitutionalAuthorizationService $authorization,
        private readonly PeruHolidayService $holidays,
    ) {}

    public function list(User $user, CarbonImmutable $date): Collection
    {
        $scope = $this->authorization->scope($user, ['asistencia.ver']);
        $date = $date->setTimezone('America/Lima')->startOfDay();
        $isNonWorkingDay = $this->holidays->isNonWorkingDay($date);
        $dateString = $date->toDateString();
        $day = $date->isoWeekday();

        $rows = DB::table('integrantes as member')
            ->join('personas as person', 'person.id', '=', 'member.persona_id')
            ->join('cuentas_acceso as account', function ($join): void {
                $join->on('account.persona_id', '=', 'person.id')
                    ->where('account.activo', true);
            })
            ->join('integrantes_historial as history', function ($join) use ($dateString): void {
                $join->on('history.integrante_id', '=', 'member.id')
                    ->where('history.estado', 'Activo')
                    ->where(fn ($query) => $query
                        ->whereNull('history.fecha_inicio')
                        ->orWhereDate('history.fecha_inicio', '<=', $dateString))
                    ->where(fn ($query) => $query
                        ->whereNull('history.fecha_fin')
                        ->orWhereDate('history.fecha_fin', '>=', $dateString));
            })
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->leftJoin('areas as area', 'area.id', '=', 'position.area_id')
            ->leftJoin('integrante_horarios as schedule', function ($join) use ($day): void {
                $join->on('schedule.historial_id', '=', 'history.id')
                    ->where('schedule.dia_semana', $day);
            })
            ->leftJoin('asistencias as attendance', function ($join) use ($dateString): void {
                $join->on('attendance.integrante_id', '=', 'member.id')
                    ->on('attendance.horario_id', '=', 'schedule.id')
                    ->whereDate('attendance.fecha', $dateString);
            })
            ->where('member.estado', 'Activo')
            ->where('history.requiere_asistencia', true)
            ->where('history.tipo_integrante', '!=', 'gerente')
            ->when(! $scope->global, fn ($query) => $query->where('position.area_id', $scope->areaId))
            ->orderBy('area.nombre')
            ->orderBy('person.apellidos')
            ->orderBy('person.nombres')
            ->orderBy('schedule.hora_inicio')
            ->get([
                'member.id as integrante_id',
                'member.avatar_path',
                'person.nombres',
                'person.apellidos',
                'person.correo',
                'position.id as cargo_id',
                'position.nombre as cargo',
                'area.nombre as area',
                'schedule.id as horario_id',
                'schedule.hora_inicio as hora_inicio_programada',
                'schedule.hora_fin as hora_fin_programada',
                'attendance.id as asistencia_id',
                'attendance.estado',
                'attendance.hora_entrada',
                'attendance.hora_salida',
                'attendance.minutos_realizados',
                'attendance.minutos_tardanza',
                'attendance.minutos_salida_anticipada',
                'attendance.minutos_incumplidos',
                'attendance.descripcion_jornada',
                'attendance.evidencia_path',
            ]);

        $attendanceIds = $rows->pluck('asistencia_id')->filter()->values();
        $incidents = DB::table('asistencia_incidencias')
            ->whereIn('asistencia_id', $attendanceIds)
            ->orderBy('id')
            ->get(['id', 'asistencia_id', 'tipo', 'minutos', 'descripcion'])
            ->groupBy('asistencia_id');
        $justifications = DB::table('asistencia_justificaciones')
            ->whereIn('asistencia_id', $attendanceIds)
            ->latest('fecha_registro')
            ->get(['id', 'asistencia_id', 'tipo', 'estado', 'motivo', 'observacion'])
            ->groupBy('asistencia_id');
        $warningCounts = $this->warningCounts($attendanceIds);

        return $rows
            ->when($isNonWorkingDay, fn (Collection $items): Collection => $items->whereNotNull('asistencia_id'))
            ->map(function ($row) use ($dateString, $incidents, $justifications, $warningCounts) {
                $row->integrante = trim("{$row->nombres} {$row->apellidos}") ?: 'Integrante';
                $row->fecha = $dateString;
                $row->minutos_realizados = (int) ($row->minutos_realizados ?? 0);
                $row->minutos_tardanza = (int) ($row->minutos_tardanza ?? 0);
                $row->minutos_salida_anticipada = (int) ($row->minutos_salida_anticipada ?? 0);
                $row->minutos_incumplidos = (int) ($row->minutos_incumplidos ?? 0);
                $row->incidencias = $incidents->get($row->asistencia_id, collect())->values();
                $justification = $justifications->get($row->asistencia_id, collect())->first();
                $row->justificacion_id = $justification?->id;
                $row->justificacion_tipo = $justification?->tipo;
                $row->justificacion_estado = $justification?->estado;
                $row->justificacion_motivo = $justification?->motivo;
                $row->justificacion_observacion = $justification?->observacion;
                $row->amonestaciones = (int) $warningCounts->get($row->asistencia_id, 0);
                unset($row->nombres, $row->apellidos);

                return $row;
            });
    }

    public function metrics(User $user, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $scope = $this->authorization->scope($user, ['asistencia.ver_metricas']);

        $rows = DB::table('asistencias as attendance')
            ->join('integrantes_historial as history', 'history.id', '=', 'attendance.historial_id')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->leftJoin('areas as area', 'area.id', '=', 'position.area_id')
            ->whereBetween('attendance.fecha', [$from->toDateString(), $to->toDateString()])
            ->where('attendance.estado', '!=', 'anulada')
            ->when(! $scope->global, fn ($query) => $query->where('position.area_id', $scope->areaId))
            ->get([
                'attendance.integrante_id',
                'attendance.estado',
                'attendance.minutos_programados',
                'attendance.minutos_realizados',
                'attendance.minutos_tardanza',
                'attendance.minutos_salida_anticipada',
                'area.nombre as area',
            ]);

        $scheduled = (int) $rows->sum('minutos_programados');
        $realized = (int) $rows->sum('minutos_realizados');
        $byArea = $rows->groupBy(fn ($row) => $row->area ?: 'Sin área')
            ->map(fn (Collection $items, string $area): array => [
                'area' => $area,
                'jornadas' => $items->count(),
                'completadas' => $items->where('estado', 'completada')->count(),
                'faltas' => $items->where('estado', 'falta')->count(),
                'justificadas' => $items->where('estado', 'justificada')->count(),
            ])->values();

        $recoveries = DB::table('asistencia_recuperaciones as recovery')
            ->join('asistencia_permisos as leave', 'leave.id', '=', 'recovery.permiso_id')
            ->join('integrantes_historial as history', function ($join): void {
                $join->on('history.integrante_id', '=', 'leave.integrante_id')->where('history.estado', 'Activo');
            })
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->where('leave.estado', 'aprobada')
            ->whereBetween('recovery.fecha', [$from->toDateString(), $to->toDateString()])
            ->when(! $scope->global, fn ($query) => $query->where('position.area_id', $scope->areaId))
            ->get(['recovery.estado', 'recovery.minutos_realizados']);
        $incidentRecoveries = DB::table('asistencia_recuperaciones as recovery')
            ->join('asistencia_justificaciones as justification', 'justification.id', '=', 'recovery.justificacion_id')
            ->join('asistencias as attendance', 'attendance.id', '=', 'justification.asistencia_id')
            ->join('integrantes_historial as history', 'history.id', '=', 'attendance.historial_id')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->where('justification.estado', 'aprobada')
            ->whereBetween('recovery.fecha', [$from->toDateString(), $to->toDateString()])
            ->when(! $scope->global, fn ($query) => $query->where('position.area_id', $scope->areaId))
            ->get(['recovery.estado', 'recovery.minutos_realizados']);
        $recoveries = $recoveries->concat($incidentRecoveries);

        return [
            'desde' => $from->toDateString(),
            'hasta' => $to->toDateString(),
            'integrantes' => $rows->pluck('integrante_id')->unique()->count(),
            'jornadas' => $rows->count(),
            'completadas' => $rows->where('estado', 'completada')->count(),
            'en_jornada' => $rows->where('estado', 'en_jornada')->count(),
            'faltas' => $rows->where('estado', 'falta')->count(),
            'justificadas' => $rows->where('estado', 'justificada')->count(),
            'permisos' => $rows->where('estado', 'permiso')->count(),
            'tardanzas' => $rows->where('minutos_tardanza', '>', 0)->count(),
            'salidas_anticipadas' => $rows->where('minutos_salida_anticipada', '>', 0)->count(),
            'minutos_programados' => $scheduled,
            'minutos_realizados' => $realized,
            'cumplimiento' => $scheduled > 0 ? round(($realized / $scheduled) * 100, 1) : 0,
            'minutos_recuperados' => (int) $recoveries->sum('minutos_realizados'),
            'recuperaciones_pendientes' => $recoveries->whereIn('estado', ['programada', 'en_curso'])->count(),
            'por_area' => $byArea,
        ];
    }

    public function warnings(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['asistencia.gestionar_amonestaciones']);
        $currentHistories = DB::table('integrantes_historial')
            ->selectRaw('integrante_id, MAX(id) as historial_id')
            ->where('estado', 'Activo')
            ->groupBy('integrante_id');

        return DB::table('integrantes as member')
            ->join('personas as person', 'person.id', '=', 'member.persona_id')
            ->join('cuentas_acceso as account', function ($join): void {
                $join->on('account.persona_id', '=', 'person.id')
                    ->where('account.activo', true);
            })
            ->joinSub($currentHistories, 'current_history', fn ($join) => $join
                ->on('current_history.integrante_id', '=', 'member.id'))
            ->join('integrantes_historial as history', 'history.id', '=', 'current_history.historial_id')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->leftJoin('areas as area', 'area.id', '=', 'position.area_id')
            ->leftJoin('asistencia_amonestaciones as warning', function ($join): void {
                $join->on('warning.integrante_id', '=', 'member.id')
                    ->where('warning.estado', 'activa');
            })
            ->where('member.estado', 'Activo')
            ->when(! $scope->global, fn ($query) => $query->where('position.area_id', $scope->areaId))
            ->groupBy(
                'member.id',
                'member.avatar_path',
                'person.nombres',
                'person.apellidos',
                'person.correo',
                'position.nombre',
                'area.nombre',
            )
            ->orderByDesc('amonestaciones_graves')
            ->orderByDesc('amonestaciones_medias')
            ->orderByDesc('amonestaciones_bajas')
            ->orderBy('person.apellidos')
            ->orderBy('person.nombres')
            ->get([
                'member.id as integrante_id',
                'member.avatar_path',
                'person.nombres',
                'person.apellidos',
                'person.correo',
                'position.nombre as cargo',
                'area.nombre as area',
                DB::raw('COUNT(DISTINCT warning.id) as amonestaciones_total'),
                DB::raw("COUNT(DISTINCT CASE WHEN warning.gravedad = 'baja' THEN warning.id END) as amonestaciones_bajas"),
                DB::raw("COUNT(DISTINCT CASE WHEN warning.gravedad = 'media' THEN warning.id END) as amonestaciones_medias"),
                DB::raw("COUNT(DISTINCT CASE WHEN warning.gravedad = 'grave' THEN warning.id END) as amonestaciones_graves"),
            ])
            ->map(function ($row) {
                $row->integrante = trim("{$row->nombres} {$row->apellidos}") ?: 'Integrante';
                $row->amonestaciones_total = (int) $row->amonestaciones_total;
                $row->amonestaciones_bajas = (int) $row->amonestaciones_bajas;
                $row->amonestaciones_medias = (int) $row->amonestaciones_medias;
                $row->amonestaciones_graves = (int) $row->amonestaciones_graves;
                unset($row->nombres, $row->apellidos);

                return $row;
            });
    }

    public function audit(User $user, Asistencia $attendance): Collection
    {
        $this->authorizeAttendance($user, $attendance, ['asistencia.ver']);

        return DB::table('asistencia_auditoria as audit')
            ->leftJoin('cuentas_acceso as account', 'account.id', '=', 'audit.actor_id')
            ->leftJoin('personas as person', 'person.id', '=', 'account.persona_id')
            ->where('audit.asistencia_id', $attendance->id)
            ->orderByDesc('audit.created_at')
            ->orderByDesc('audit.id')
            ->get([
                'audit.id',
                'audit.accion',
                'audit.datos_anteriores',
                'audit.datos_nuevos',
                'audit.motivo',
                'audit.created_at',
                'person.nombres',
                'person.apellidos',
            ])
            ->map(function ($row) {
                $row->actor = trim("{$row->nombres} {$row->apellidos}") ?: 'Proceso automático';
                $row->datos_anteriores = $this->decodeAuditData($row->datos_anteriores);
                $row->datos_nuevos = $this->decodeAuditData($row->datos_nuevos);
                unset($row->nombres, $row->apellidos);

                return $row;
            });
    }

    public function resolveJustification(
        User $user,
        AsistenciaJustificacion $justification,
        string $state,
        ?string $observation,
        ?string $warningSeverity,
    ): Asistencia {
        $scope = $this->authorization->scope($user, ['asistencia.gestionar_solicitudes']);
        $attendance = $justification->asistencia()->firstOrFail();
        $areaId = DB::table('integrantes_historial as history')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->where('history.id', $attendance->historial_id)
            ->value('position.area_id');

        if (! $scope->global && (int) $areaId !== (int) $scope->areaId) {
            throw new AuthorizationException('No puedes resolver solicitudes fuera de tu área.');
        }

        return DB::transaction(function () use ($justification, $state, $observation, $warningSeverity, $scope): Asistencia {
            $locked = AsistenciaJustificacion::query()->lockForUpdate()->findOrFail($justification->id);

            if ($locked->estado !== 'pendiente') {
                throw ValidationException::withMessages([
                    'justificacion' => 'Esta justificación ya fue resuelta o no es válida.',
                ]);
            }

            $attendance = Asistencia::query()->lockForUpdate()->findOrFail($locked->asistencia_id);
            $locked->update([
                'estado' => $state,
                'validado_por' => $scope->accountId,
                'fecha_validacion' => CarbonImmutable::now(),
                'observacion' => $observation,
            ]);
            if ($state === 'rechazada') {
                $locked->recuperaciones()->update(['estado' => 'cancelada']);
            }

            $requestType = match ($locked->tipo) {
                'tardanza' => 'tardanza',
                'salida_anticipada' => 'salida anticipada',
                default => 'justificación de falta',
            };
            $notificationPrefix = match ($locked->tipo) {
                'tardanza' => 'tardanza_',
                'salida_anticipada' => 'salida_',
                default => 'falta_',
            };

            if ($state === 'rechazada') {
                AsistenciaAmonestacion::query()->create([
                    'asistencia_id' => $attendance->id,
                    'justificacion_id' => $locked->id,
                    'integrante_id' => $attendance->integrante_id,
                    'motivo' => $observation ?: "Solicitud de {$requestType} rechazada.",
                    'gravedad' => $warningSeverity,
                    'registrado_por' => $scope->accountId,
                ]);
            }

            if (! in_array($locked->tipo, ['tardanza', 'salida_anticipada'], true) && $state === 'aprobada' && $attendance->estado === 'falta') {
                $attendance->update([
                    'estado' => 'justificada',
                    'observacion' => $locked->motivo,
                ]);
            }

            $userId = DB::table('asistencias as attendance')
                ->join('integrantes as member', 'member.id', '=', 'attendance.integrante_id')
                ->join('cuentas_acceso as account', 'account.persona_id', '=', 'member.persona_id')
                ->where('attendance.id', $attendance->id)
                ->where('account.activo', true)
                ->value('account.user_id');

            if ($userId !== null) {
                $approved = $state === 'aprobada';
                $subject = $requestType;
                $decision = $approved ? 'aprobada' : 'rechazada';
                $notificationMessage = "Tu solicitud de {$subject} fue {$decision}.";
                if ($observation) {
                    $notificationMessage .= " Motivo: {$observation}";
                }
                NotificacionAsistencia::query()->create([
                    'user_id' => $userId,
                    'asistencia_id' => $attendance->id,
                    'tipo' => $notificationPrefix.($approved ? 'aprobada' : 'rechazada'),
                    'titulo' => ucfirst($subject)." {$decision}",
                    'mensaje' => $notificationMessage,
                    'clave' => "justificacion-{$locked->id}-{$state}",
                ]);
            }

            DB::table('asistencia_auditoria')->insert([
                'asistencia_id' => $attendance->id,
                'accion' => 'justificacion_'.($state === 'aprobada' ? 'aprobada' : 'rechazada'),
                'actor_id' => $scope->accountId,
                'datos_anteriores' => null,
                'datos_nuevos' => json_encode($locked->fresh()->toArray(), JSON_THROW_ON_ERROR),
                'motivo' => $observation,
                'created_at' => CarbonImmutable::now(),
                'updated_at' => CarbonImmutable::now(),
            ]);

            return $attendance->fresh(['incidencias', 'justificaciones', 'amonestaciones']);
        });
    }

    private function enrichRows(Collection $rows): Collection
    {
        $attendanceIds = $rows->pluck('asistencia_id')->filter()->values();
        $incidents = DB::table('asistencia_incidencias')
            ->whereIn('asistencia_id', $attendanceIds)
            ->orderBy('id')
            ->get(['id', 'asistencia_id', 'tipo', 'minutos', 'descripcion'])
            ->groupBy('asistencia_id');
        $justifications = DB::table('asistencia_justificaciones')
            ->whereIn('asistencia_id', $attendanceIds)
            ->latest('fecha_registro')
            ->get(['id', 'asistencia_id', 'tipo', 'estado', 'motivo', 'observacion'])
            ->groupBy('asistencia_id');
        $warningCounts = $this->warningCounts($attendanceIds);

        return $rows->map(function ($row) use ($incidents, $justifications, $warningCounts) {
            $justification = $justifications->get($row->asistencia_id, collect())->first();
            $row->integrante = trim("{$row->nombres} {$row->apellidos}") ?: 'Integrante';
            $row->fecha = CarbonImmutable::parse($row->fecha)->toDateString();
            $row->minutos_realizados = (int) ($row->minutos_realizados ?? 0);
            $row->minutos_tardanza = (int) ($row->minutos_tardanza ?? 0);
            $row->minutos_salida_anticipada = (int) ($row->minutos_salida_anticipada ?? 0);
            $row->minutos_incumplidos = (int) ($row->minutos_incumplidos ?? 0);
            $row->incidencias = $incidents->get($row->asistencia_id, collect())->values();
            $row->justificacion_estado = $justification?->estado;
            $row->justificacion_motivo = $justification?->motivo;
            $row->justificacion_id = $justification?->id;
            $row->justificacion_tipo = $justification?->tipo;
            $row->justificacion_observacion = $justification?->observacion;
            $row->amonestaciones = (int) $warningCounts->get($row->asistencia_id, 0);
            unset($row->nombres, $row->apellidos);

            return $row;
        });
    }

    private function warningCounts(Collection $attendanceIds): Collection
    {
        if ($attendanceIds->isEmpty()) {
            return collect();
        }

        return DB::table('asistencia_amonestaciones')
            ->whereIn('asistencia_id', $attendanceIds)
            ->selectRaw('asistencia_id, COUNT(*) as total')
            ->groupBy('asistencia_id')
            ->pluck('total', 'asistencia_id');
    }

    private function authorizeAttendance(User $user, Asistencia $attendance, array $permissions)
    {
        $scope = $this->authorization->scope($user, $permissions);
        $areaId = DB::table('integrantes_historial as history')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->where('history.id', $attendance->historial_id)
            ->value('position.area_id');

        if (! $scope->global && (int) $areaId !== (int) $scope->areaId) {
            throw new AuthorizationException('No puedes gestionar asistencias fuera de tu área.');
        }

        return $scope;
    }

    private function decodeAuditData(mixed $value): mixed
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        return json_decode($value, true) ?? $value;
    }
}
