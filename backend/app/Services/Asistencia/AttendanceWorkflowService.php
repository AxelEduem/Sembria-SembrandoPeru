<?php

namespace App\Services\Asistencia;

use App\Models\Asistencia;
use App\Models\AsistenciaAmonestacion;
use App\Models\AsistenciaApelacion;
use App\Models\AsistenciaConfiguracion;
use App\Models\AsistenciaJustificacion;
use App\Models\AsistenciaPermiso;
use App\Models\AsistenciaRecuperacion;
use App\Models\NotificacionAsistencia;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AttendanceWorkflowService
{
    private const TIMEZONE = 'America/Lima';

    public function __construct(
        private readonly InstitutionalAuthorizationService $authorization,
        private readonly PeruHolidayService $holidays,
    ) {}

    public function personalData(User $user): array
    {
        [$member] = $this->participant($user);

        return [
            'permisos' => AsistenciaPermiso::query()->with(['recuperaciones', 'fechas'])->where('integrante_id', $member->id)->latest()->get(),
            'justificaciones' => AsistenciaJustificacion::query()
                ->with(['recuperaciones', 'asistencia:id,integrante_id,fecha,hora_inicio_programada,hora_fin_programada'])
                ->whereHas('asistencia', fn ($query) => $query->where('integrante_id', $member->id))
                ->latest('fecha_registro')
                ->get(),
        ];
    }

    public function estimateLeave(User $user, array $dates): int
    {
        [, $history] = $this->participant($user);

        return $this->scheduledMinutesForDates($history->id, $dates);
    }

    public function suggestLeaveRecovery(User $user, array $dates, int $days): array
    {
        [$member, $history] = $this->participant($user);
        $leaveEnd = CarbonImmutable::parse(max($dates), self::TIMEZONE);
        $recoveryBoundary = $leaveEnd->max(CarbonImmutable::now(self::TIMEZONE)->startOfDay());
        $required = $this->scheduledMinutesForDates($history->id, $dates);

        if ($required === 0) {
            return ['minutos' => 0, 'recuperaciones' => []];
        }
        if ($days > $required) {
            throw ValidationException::withMessages([
                'dias' => 'La cantidad de días supera los minutos que debes recuperar.',
            ]);
        }

        $candidates = [];
        $selected = [];
        for ($date = $recoveryBoundary->addDay(), $limit = $recoveryBoundary->addDays(180); $date->lte($limit); $date = $date->addDay()) {
            $intervals = $this->availableRecoveryIntervals($member->id, $history->id, $date);
            if ($intervals === []) {
                continue;
            }

            usort($intervals, fn (array $left, array $right): int => ($right[1] - $right[0]) <=> ($left[1] - $left[0]));
            [$start, $end] = $intervals[0];
            $candidates[] = ['fecha' => $date->toDateString(), 'inicio' => $start, 'capacidad' => $end - $start];
            $selected = collect($candidates)->sortByDesc('capacidad')->take($days)->values()->all();

            if (count($selected) === $days && array_sum(array_column($selected, 'capacidad')) >= $required) {
                break;
            }
        }

        if (count($selected) !== $days || array_sum(array_column($selected, 'capacidad')) < $required) {
            throw ValidationException::withMessages([
                'dias' => 'No hay suficiente disponibilidad en la jornada institucional durante los próximos 180 días. Prueba con más días.',
            ]);
        }

        usort($selected, fn (array $left, array $right): int => $left['fecha'] <=> $right['fecha']);
        $remaining = $required;
        $recoveries = [];
        foreach ($selected as $index => $candidate) {
            $futureCapacity = array_sum(array_column(array_slice($selected, $index + 1), 'capacidad'));
            $remainingDays = count($selected) - $index;
            $minimumNow = max(1, $remaining - $futureCapacity);
            $balanced = (int) ceil($remaining / $remainingDays);
            $minutes = min($candidate['capacidad'], max($minimumNow, $balanced));
            $recoveries[] = [
                'fecha' => $candidate['fecha'],
                'hora_inicio' => $this->minutesToTime($candidate['inicio']),
                'hora_fin' => $this->minutesToTime($candidate['inicio'] + $minutes),
            ];
            $remaining -= $minutes;
        }

        return [
            'minutos' => $required,
            'recuperaciones' => $recoveries,
            'jornada' => $this->organizationSchedule(),
        ];
    }

    public function suggestIncidentRecovery(User $user, int $required, string $from, int $days): array
    {
        [$member, $history] = $this->participant($user);
        $after = CarbonImmutable::parse($from, self::TIMEZONE);
        $recoveryBoundary = $after->max(CarbonImmutable::now(self::TIMEZONE)->startOfDay());

        if ($days > $required) {
            throw ValidationException::withMessages([
                'dias' => 'La cantidad de días supera los minutos que debes recuperar.',
            ]);
        }

        $candidates = [];
        $selected = [];
        for ($date = $recoveryBoundary->addDay(), $limit = $recoveryBoundary->addDays(180); $date->lte($limit); $date = $date->addDay()) {
            $intervals = $this->availableRecoveryIntervals($member->id, $history->id, $date);
            if ($intervals === []) {
                continue;
            }
            usort($intervals, fn (array $left, array $right): int => ($right[1] - $right[0]) <=> ($left[1] - $left[0]));
            [$start, $end] = $intervals[0];
            $candidates[] = ['fecha' => $date->toDateString(), 'inicio' => $start, 'capacidad' => $end - $start];
            $selected = collect($candidates)->sortByDesc('capacidad')->take($days)->values()->all();
            if (count($selected) === $days && array_sum(array_column($selected, 'capacidad')) >= $required) {
                break;
            }
        }

        if (count($selected) !== $days || array_sum(array_column($selected, 'capacidad')) < $required) {
            throw ValidationException::withMessages([
                'dias' => 'No hay suficiente disponibilidad en los próximos 180 días. Prueba con más días.',
            ]);
        }

        usort($selected, fn (array $left, array $right): int => $left['fecha'] <=> $right['fecha']);
        $remaining = $required;
        $recoveries = [];
        foreach ($selected as $index => $candidate) {
            $futureCapacity = array_sum(array_column(array_slice($selected, $index + 1), 'capacidad'));
            $minimumNow = max(1, $remaining - $futureCapacity);
            $balanced = (int) ceil($remaining / (count($selected) - $index));
            $minutes = min($candidate['capacidad'], max($minimumNow, $balanced));
            $recoveries[] = [
                'fecha' => $candidate['fecha'],
                'hora_inicio' => $this->minutesToTime($candidate['inicio']),
                'hora_fin' => $this->minutesToTime($candidate['inicio'] + $minutes),
            ];
            $remaining -= $minutes;
        }

        return ['minutos' => $required, 'recuperaciones' => $recoveries, 'jornada' => $this->organizationSchedule()];
    }

    public function createJustificationRecoveries(
        User $user,
        AsistenciaJustificacion $justification,
        int $required,
        string $after,
        array $rows,
    ): void {
        [$member, $history] = $this->participant($user);
        if ($rows === []) {
            $rows = $this->suggestIncidentRecovery($user, $required, $after, 1)['recuperaciones'];
        }
        $recoveries = $this->validateRecoveryPlan($member->id, $history->id, $required, $after, $rows);

        foreach ($recoveries as $row) {
            $justification->recuperaciones()->create([
                'fecha' => $row['fecha'],
                'hora_inicio' => $row['hora_inicio'],
                'hora_fin' => $row['hora_fin'],
                'minutos' => $row['minutos'],
            ]);
        }
    }

    private function validateRecoveryPlan(
        int $memberId,
        int $historyId,
        int $required,
        string $after,
        array $rows,
    ): Collection {
        $recoveries = collect($rows)->map(function (array $row): array {
            $start = CarbonImmutable::parse($row['fecha'].' '.$row['hora_inicio'], self::TIMEZONE);
            $end = CarbonImmutable::parse($row['fecha'].' '.$row['hora_fin'], self::TIMEZONE);

            return $row + ['minutos' => $start->diffInMinutes($end)];
        });

        if ((int) $recoveries->sum('minutos') !== $required) {
            throw ValidationException::withMessages([
                'recuperaciones' => "Debes programar exactamente {$required} minutos de recuperación.",
            ]);
        }
        $recoveryBoundary = CarbonImmutable::parse($after, self::TIMEZONE)
            ->max(CarbonImmutable::now(self::TIMEZONE)->startOfDay());
        if ($recoveries->contains(fn (array $row): bool => CarbonImmutable::parse($row['fecha'], self::TIMEZONE)->lte($recoveryBoundary))) {
            throw ValidationException::withMessages([
                'recuperaciones' => 'Las recuperaciones deben programarse después del día de hoy y de la incidencia.',
            ]);
        }
        foreach ($recoveries->groupBy('fecha') as $dateRows) {
            $ordered = $dateRows->sortBy('hora_inicio')->values();
            for ($index = 1; $index < $ordered->count(); $index++) {
                if ($ordered[$index]['hora_inicio'] < $ordered[$index - 1]['hora_fin']) {
                    throw ValidationException::withMessages(['recuperaciones' => 'Los horarios de recuperación no pueden superponerse.']);
                }
            }
        }
        $this->validateRecoveryAvailability($memberId, $historyId, $recoveries);

        return $recoveries;
    }

    public function createLeave(User $user, array $data, ?UploadedFile $attachment): AsistenciaPermiso
    {
        [$member, $history, $accountId] = $this->participant($user);
        $dates = collect($data['fechas'])->unique()->sort()->values();
        $dateStrings = $dates->all();
        $from = CarbonImmutable::parse($dates->first(), self::TIMEZONE);
        $to = CarbonImmutable::parse($dates->last(), self::TIMEZONE);
        $required = $this->scheduledMinutesForDates($history->id, $dateStrings);
        if ($data['tipo'] === 'medico' && ! $attachment) {
            throw ValidationException::withMessages([
                'adjunto' => 'Debes adjuntar el certificado médico para solicitar un permiso médico.',
            ]);
        }
        if (AsistenciaPermiso::query()->where('integrante_id', $member->id)->whereIn('estado', ['pendiente', 'aprobada'])
            ->where(function ($query) use ($dateStrings) {
                $query->whereHas('fechas', fn ($datesQuery) => $datesQuery->whereIn('fecha', $dateStrings))
                    ->orWhere(function ($legacyQuery) use ($dateStrings) {
                        $legacyQuery->whereDoesntHave('fechas')
                            ->where(function ($dateQuery) use ($dateStrings) {
                                foreach ($dateStrings as $date) {
                                    $dateQuery->orWhere(function ($overlapQuery) use ($date) {
                                        $overlapQuery->whereDate('fecha_inicio', '<=', $date)
                                            ->whereDate('fecha_fin', '>=', $date);
                                    });
                                }
                            });
                    });
            })->exists()) {
            throw ValidationException::withMessages(['fechas' => 'Ya existe un permiso que se cruza con una de esas fechas.']);
        }
        $recoveries = collect($data['recuperaciones'] ?? [])->map(function (array $row): array {
            $start = CarbonImmutable::parse($row['fecha'].' '.$row['hora_inicio'], self::TIMEZONE);
            $end = CarbonImmutable::parse($row['fecha'].' '.$row['hora_fin'], self::TIMEZONE);

            return $row + ['minutos' => $start->diffInMinutes($end)];
        });
        $recoveryBoundary = $to->max(CarbonImmutable::now(self::TIMEZONE)->startOfDay());

        if ((int) $recoveries->sum('minutos') !== $required) {
            throw ValidationException::withMessages([
                'recuperaciones' => "Debes programar exactamente {$required} minutos de recuperación.",
            ]);
        }
        if ($recoveries->contains(fn (array $row): bool => CarbonImmutable::parse($row['fecha'], self::TIMEZONE)->lte($recoveryBoundary))) {
            throw ValidationException::withMessages([
                'recuperaciones' => 'Las recuperaciones deben programarse después del día de hoy y de la última fecha del permiso.',
            ]);
        }
        foreach ($recoveries->groupBy('fecha') as $rows) {
            $ordered = $rows->sortBy('hora_inicio')->values();
            for ($index = 1; $index < $ordered->count(); $index++) {
                if ($ordered[$index]['hora_inicio'] < $ordered[$index - 1]['hora_fin']) {
                    throw ValidationException::withMessages(['recuperaciones' => 'Los horarios de recuperación no pueden superponerse.']);
                }
            }
        }
        $this->validateRecoveryAvailability($member->id, $history->id, $recoveries);

        $path = $attachment?->store('attendance-documents/permissions', $this->disk());
        try {
            return DB::transaction(function () use ($data, $dateStrings, $from, $to, $member, $accountId, $required, $recoveries, $path): AsistenciaPermiso {
                $leave = AsistenciaPermiso::query()->create([
                    'integrante_id' => $member->id,
                    'tipo' => $data['tipo'],
                    'fecha_inicio' => $from->toDateString(),
                    'fecha_fin' => $to->toDateString(),
                    'motivo' => $data['motivo'],
                    'minutos_a_recuperar' => $required,
                    'estado' => 'pendiente',
                    'solicitado_por' => $accountId,
                    'adjunto_path' => $path,
                ]);
                $leave->fechas()->createMany(array_map(
                    fn (string $date): array => ['fecha' => $date],
                    $dateStrings,
                ));
                foreach ($recoveries as $row) {
                    $leave->recuperaciones()->create([
                        'fecha' => $row['fecha'], 'hora_inicio' => $row['hora_inicio'],
                        'hora_fin' => $row['hora_fin'], 'minutos' => $row['minutos'],
                    ]);
                }

                return $leave->load(['recuperaciones', 'fechas']);
            });
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk($this->disk())->delete($path);
            }
            throw $exception;
        }
    }

    public function createAppeal(User $user, AsistenciaAmonestacion $warning, array $data, ?UploadedFile $attachment): AsistenciaApelacion
    {
        [$member, , $accountId] = $this->participant($user);
        if ((int) $warning->integrante_id !== (int) $member->id || $warning->estado !== 'activa') {
            throw new AuthorizationException('No puedes apelar esta amonestación.');
        }
        if (AsistenciaApelacion::query()->where('amonestacion_id', $warning->id)->where('estado', 'pendiente')->exists()) {
            throw ValidationException::withMessages(['amonestacion' => 'Ya existe una apelación pendiente.']);
        }
        $path = $attachment?->store('attendance-documents/appeals', $this->disk());

        try {
            return AsistenciaApelacion::query()->create([
                'amonestacion_id' => $warning->id, 'integrante_id' => $member->id,
                'tipo' => $data['tipo'], 'motivo' => $data['motivo'], 'adjunto_path' => $path,
                'solicitado_por' => $accountId,
            ]);
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk($this->disk())->delete($path);
            }

            throw $exception;
        }
    }

    public function recoveryOwnerAndState(AsistenciaRecuperacion $recovery): array
    {
        if ($recovery->permiso_id !== null) {
            $leave = AsistenciaPermiso::query()->findOrFail($recovery->permiso_id);

            return [(int) $leave->integrante_id, $leave->estado];
        }

        $justification = AsistenciaJustificacion::query()
            ->with('asistencia:id,integrante_id')
            ->findOrFail($recovery->justificacion_id);

        return [(int) $justification->asistencia->integrante_id, $justification->estado];
    }

    public function adminData(User $user, string $section): array
    {
        $permission = match ($section) {
            'configuracion' => 'asistencia.gestionar_configuracion',
            'historial' => 'asistencia.ver_historial_solicitudes',
            default => 'asistencia.gestionar_solicitudes',
        };
        $scope = $this->authorization->scope($user, [$permission]);

        if ($section === 'configuracion') {
            $this->ensureGlobalConfigurationScope($scope->global);
            $this->holidays->syncCurrentAndNextYear();

            return [
                'permisos' => collect(),
                'apelaciones' => collect(),
                'justificaciones' => collect(),
                'configuracion' => AsistenciaConfiguracion::current(),
                'dias_no_laborables' => DB::table('asistencia_dias_no_laborables')
                    ->where('activo', true)
                    ->orderBy('fecha')
                    ->get(),
            ];
        }

        $states = $section === 'historial' ? ['aprobada', 'rechazada'] : ['pendiente'];
        $memberIds = $this->scopedMemberIds($scope->global, $scope->areaId);
        $decorate = fn ($query) => $query->whereIn('integrante_id', $memberIds)
            ->whereIn('estado', $states)
            ->latest()
            ->get()
            ->map(function ($row) {
                $member = DB::table('integrantes as member')
                    ->join('personas as person', 'person.id', '=', 'member.persona_id')
                    ->leftJoin('integrantes_historial as history', function ($join) {
                        $join->on('history.integrante_id', '=', 'member.id')->where('history.estado', '=', 'Activo');
                    })
                    ->leftJoin('cargos as position', 'position.id', '=', 'history.cargo_id')
                    ->leftJoin('areas as area', 'area.id', '=', 'position.area_id')
                    ->where('member.id', $row->integrante_id)
                    ->selectRaw("TRIM(person.nombres || ' ' || person.apellidos) as integrante")
                    ->addSelect('person.correo', 'member.avatar_path', 'position.nombre as cargo', 'area.nombre as area')
                    ->first();
                foreach ((array) $member as $key => $value) {
                    $row->{$key} = $value;
                }

                return $row;
            });

        $justifications = DB::table('asistencia_justificaciones as justification')
            ->join('asistencias as attendance', 'attendance.id', '=', 'justification.asistencia_id')
            ->join('integrantes as member', 'member.id', '=', 'attendance.integrante_id')
            ->join('personas as person', 'person.id', '=', 'member.persona_id')
            ->leftJoin('integrantes_historial as history', 'history.id', '=', 'attendance.historial_id')
            ->leftJoin('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->leftJoin('areas as area', 'area.id', '=', 'position.area_id')
            ->leftJoin('asistencia_amonestaciones as warning', 'warning.justificacion_id', '=', 'justification.id')
            ->whereIn('attendance.integrante_id', $memberIds)
            ->whereIn('justification.estado', $states)
            ->latest('justification.fecha_registro')
            ->get([
                'justification.id',
                'justification.asistencia_id',
                'justification.tipo',
                'justification.estado',
                'justification.motivo',
                'justification.observacion',
                'justification.fecha_registro',
                'justification.fecha_validacion',
                'justification.adjunto_path',
                'warning.gravedad as amonestacion_gravedad',
                'attendance.fecha',
                'attendance.hora_inicio_programada',
                'attendance.hora_fin_programada',
                'attendance.integrante_id',
                'position.id as cargo_id',
                'position.nombre as cargo',
                'area.nombre as area',
                'member.avatar_path',
                'person.nombres',
                'person.apellidos',
                'person.correo',
            ]);
        $recoveriesByJustification = AsistenciaRecuperacion::query()
            ->whereIn('justificacion_id', $justifications->pluck('id'))
            ->orderBy('fecha')
            ->get()
            ->groupBy('justificacion_id');
        $justifications->each(function ($row) use ($recoveriesByJustification) {
            $row->integrante = trim("{$row->nombres} {$row->apellidos}") ?: 'Integrante';
            $row->recuperaciones = $recoveriesByJustification->get($row->id, collect())->values();
            unset($row->nombres, $row->apellidos);
        });

        return [
            'permisos' => $decorate(AsistenciaPermiso::query()->with(['recuperaciones', 'fechas'])),
            'apelaciones' => $decorate(AsistenciaApelacion::query()),
            'justificaciones' => $justifications,
            'configuracion' => (object) [],
            'dias_no_laborables' => collect(),
        ];
    }

    public function updateSettings(User $user, array $data): AsistenciaConfiguracion
    {
        $scope = $this->authorization->scope($user, ['asistencia.gestionar_configuracion']);
        $this->ensureGlobalConfigurationScope($scope->global);
        $settings = AsistenciaConfiguracion::current();
        $settings->update($data + ['actualizado_por' => $scope->accountId]);

        return $settings->fresh();
    }

    public function addNonWorkingDay(User $user, string $date, string $name): object
    {
        $scope = $this->authorization->scope($user, ['asistencia.gestionar_configuracion']);
        $this->ensureGlobalConfigurationScope($scope->global);

        return $this->holidays->addInstitutionalDay($scope->accountId, $date, $name);
    }

    public function updateNonWorkingDayTreatment(User $user, int $id, bool $requiresAttendance, ?string $reason): array
    {
        $scope = $this->authorization->scope($user, ['asistencia.gestionar_configuracion']);
        $this->ensureGlobalConfigurationScope($scope->global);

        return $this->holidays->updateTreatment($scope->accountId, $id, $requiresAttendance, $reason);
    }

    public function removeNonWorkingDay(User $user, int $id): object
    {
        $scope = $this->authorization->scope($user, ['asistencia.gestionar_configuracion']);
        $this->ensureGlobalConfigurationScope($scope->global);

        return $this->holidays->remove($scope->accountId, $id);
    }

    public function calendar(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return $this->holidays->calendar($from, $to);
    }

    private function ensureGlobalConfigurationScope(bool $global): void
    {
        if (! $global) {
            throw new AuthorizationException('La configuración de asistencia requiere alcance global.');
        }
    }

    public function resolveLeave(User $user, AsistenciaPermiso $leave, string $state, ?string $observation): AsistenciaPermiso
    {
        $scope = $this->managementScope($user, $leave->integrante_id, ['asistencia.gestionar_solicitudes']);

        return DB::transaction(function () use ($leave, $state, $observation, $scope): AsistenciaPermiso {
            $locked = AsistenciaPermiso::query()->lockForUpdate()->findOrFail($leave->id);
            $this->ensurePending($locked->estado);
            $locked->update(['estado' => $state, 'resuelto_por' => $scope->accountId, 'fecha_resolucion' => now(), 'observacion' => $observation]);
            if ($state === 'aprobada') {
                $this->materializeLeaveAttendances($locked);
            } else {
                $locked->recuperaciones()->update(['estado' => 'cancelada']);
            }
            $this->notifyDecision($locked->integrante_id, null, 'permiso_'.$state, 'Solicitud de permiso '.$state, $observation);

            return $locked->fresh(['recuperaciones', 'fechas']);
        });
    }

    public function resolveAppeal(User $user, AsistenciaApelacion $appeal, string $state, ?string $observation): AsistenciaApelacion
    {
        $scope = $this->managementScope($user, $appeal->integrante_id, ['asistencia.gestionar_amonestaciones']);

        return DB::transaction(function () use ($appeal, $state, $observation, $scope): AsistenciaApelacion {
            $locked = AsistenciaApelacion::query()->lockForUpdate()->findOrFail($appeal->id);
            $this->ensurePending($locked->estado);
            $warning = AsistenciaAmonestacion::query()->lockForUpdate()->findOrFail($locked->amonestacion_id);
            if ($state === 'aprobada') {
                $warning->update(['estado' => 'retirada']);
            }
            $locked->update(['estado' => $state, 'resuelto_por' => $scope->accountId, 'fecha_resolucion' => now(), 'observacion' => $observation]);
            $this->notifyDecision($locked->integrante_id, $warning->asistencia_id, 'apelacion_'.$state, 'Apelación '.$state, $observation);

            return $locked->fresh();
        });
    }

    public function closeAttendance(User $user, Asistencia $attendance, array $data): Asistencia
    {
        $scope = $this->managementScope($user, $attendance->integrante_id, ['asistencia.gestionar_solicitudes']);

        return DB::transaction(function () use ($attendance, $data, $scope): Asistencia {
            $locked = Asistencia::query()->lockForUpdate()->findOrFail($attendance->id);
            if ($locked->estado !== 'en_jornada' || $locked->hora_salida !== null) {
                throw ValidationException::withMessages(['asistencia' => 'La jornada ya está cerrada.']);
            }
            $exit = CarbonImmutable::parse($data['hora_salida']);
            if ($exit->lte($locked->hora_entrada)) {
                throw ValidationException::withMessages(['hora_salida' => 'La salida debe ser posterior a la entrada.']);
            }
            $before = $locked->toArray();
            $realized = min($locked->minutos_programados, $locked->hora_entrada->diffInMinutes($exit));
            $locked->update(['hora_salida' => $exit, 'fuente_salida' => 'administrativa', 'descripcion_jornada' => $data['descripcion'],
                'minutos_realizados' => $realized, 'minutos_incumplidos' => max(0, $locked->minutos_programados - $realized), 'estado' => 'completada']);
            $this->audit($locked, 'cierre_administrativo', $scope->accountId, $before, $locked->fresh()->toArray(), $data['motivo']);
            $this->notifyDecision($locked->integrante_id, $locked->id, 'cierre_administrativo', 'Jornada cerrada por Gestión', $data['motivo']);

            return $locked->fresh(['incidencias', 'justificaciones', 'amonestaciones']);
        });
    }

    private function participant(User $user): array
    {
        $row = DB::table('cuentas_acceso as account')->join('integrantes as member', 'member.persona_id', '=', 'account.persona_id')
            ->join('integrantes_historial as history', 'history.integrante_id', '=', 'member.id')
            ->where('account.user_id', $user->id)->where('account.activo', true)->where('member.estado', 'Activo')->where('history.estado', 'Activo')
            ->latest('history.id')->first(['member.id as member_id', 'history.id as history_id', 'account.id as account_id']);
        if (! $row) {
            throw new AuthorizationException('No tienes un periodo institucional activo.');
        }

        return [(object) ['id' => $row->member_id], (object) ['id' => $row->history_id], $row->account_id];
    }

    private function scheduledMinutes(int $historyId, CarbonImmutable $from, CarbonImmutable $to): int
    {
        $byDay = DB::table('integrante_horarios')->where('historial_id', $historyId)->get()->groupBy('dia_semana');
        $total = 0;
        for ($day = $from; $day->lte($to); $day = $day->addDay()) {
            if ($this->isNonWorkingDay($day)) {
                continue;
            }
            foreach ($byDay->get($day->isoWeekday(), collect()) as $schedule) {
                $total += CarbonImmutable::parse($schedule->hora_inicio)->diffInMinutes(CarbonImmutable::parse($schedule->hora_fin));
            }
        }

        return $total;
    }

    private function scheduledMinutesForDates(int $historyId, array $dates): int
    {
        $byDay = DB::table('integrante_horarios')->where('historial_id', $historyId)->get()->groupBy('dia_semana');

        return collect($dates)->unique()->sum(function (string $date) use ($byDay): int {
            $day = CarbonImmutable::parse($date, self::TIMEZONE);
            if ($this->isNonWorkingDay($day)) {
                return 0;
            }

            return $byDay->get($day->isoWeekday(), collect())->sum(
                fn ($schedule): int => CarbonImmutable::parse($schedule->hora_inicio)
                    ->diffInMinutes(CarbonImmutable::parse($schedule->hora_fin)),
            );
        });
    }

    private function validateRecoveryAvailability(int $memberId, int $historyId, $recoveries): void
    {
        foreach ($recoveries as $row) {
            $date = CarbonImmutable::parse($row['fecha'], self::TIMEZONE);
            $start = $this->timeToMinutes($row['hora_inicio']);
            $end = $this->timeToMinutes($row['hora_fin']);
            $available = collect($this->availableRecoveryIntervals($memberId, $historyId, $date))
                ->contains(fn (array $interval): bool => $start >= $interval[0] && $end <= $interval[1]);

            if (! $available) {
                throw ValidationException::withMessages([
                    'recuperaciones' => "La recuperación del {$date->format('d/m/Y')} se cruza con tu horario, otra recuperación o está fuera de la jornada institucional.",
                ]);
            }
        }
    }

    private function availableRecoveryIntervals(int $memberId, int $historyId, CarbonImmutable $date): array
    {
        $schedule = $this->organizationSchedule();
        if (! in_array($date->isoWeekday(), $schedule['dias'], true) || $this->isNonWorkingDay($date)) {
            return [];
        }

        $windowStart = $this->timeToMinutes($schedule['hora_inicio']);
        $windowEnd = $this->timeToMinutes($schedule['hora_fin']);
        $occupied = DB::table('integrante_horarios')
            ->where('historial_id', $historyId)
            ->where('dia_semana', $date->isoWeekday())
            ->get(['hora_inicio', 'hora_fin'])
            ->map(fn ($row): array => [$this->timeToMinutes($row->hora_inicio), $this->timeToMinutes($row->hora_fin)])
            ->all();

        $reserved = DB::table('asistencia_recuperaciones as recovery')
            ->join('asistencia_permisos as leave', 'leave.id', '=', 'recovery.permiso_id')
            ->where('leave.integrante_id', $memberId)
            ->whereIn('leave.estado', ['pendiente', 'aprobada'])
            ->whereIn('recovery.estado', ['programada', 'en_curso'])
            ->whereDate('recovery.fecha', $date->toDateString())
            ->get(['recovery.hora_inicio', 'recovery.hora_fin'])
            ->map(fn ($row): array => [$this->timeToMinutes($row->hora_inicio), $this->timeToMinutes($row->hora_fin)])
            ->all();

        $reservedForJustifications = DB::table('asistencia_recuperaciones as recovery')
            ->join('asistencia_justificaciones as justification', 'justification.id', '=', 'recovery.justificacion_id')
            ->join('asistencias as attendance', 'attendance.id', '=', 'justification.asistencia_id')
            ->where('attendance.integrante_id', $memberId)
            ->whereIn('justification.estado', ['pendiente', 'aprobada'])
            ->whereIn('recovery.estado', ['programada', 'en_curso'])
            ->whereDate('recovery.fecha', $date->toDateString())
            ->get(['recovery.hora_inicio', 'recovery.hora_fin'])
            ->map(fn ($row): array => [$this->timeToMinutes($row->hora_inicio), $this->timeToMinutes($row->hora_fin)])
            ->all();

        $occupied = array_merge($occupied, $reserved, $reservedForJustifications);
        usort($occupied, fn (array $left, array $right): int => $left[0] <=> $right[0]);
        $available = [];
        $cursor = $windowStart;
        foreach ($occupied as [$start, $end]) {
            $start = max($windowStart, $start);
            $end = min($windowEnd, $end);
            if ($end <= $windowStart || $start >= $windowEnd) {
                continue;
            }
            if ($start > $cursor) {
                $available[] = [$cursor, $start];
            }
            $cursor = max($cursor, $end);
        }
        if ($cursor < $windowEnd) {
            $available[] = [$cursor, $windowEnd];
        }

        return array_values(array_filter($available, fn (array $interval): bool => $interval[1] > $interval[0]));
    }

    private function organizationSchedule(): array
    {
        $settings = AsistenciaConfiguracion::current();
        $days = collect($settings->jornada_dias ?: [1, 2, 3, 4, 5, 6])->map(fn ($day): int => (int) $day)->values()->all();

        return [
            'hora_inicio' => substr((string) ($settings->jornada_hora_inicio ?: '08:00'), 0, 5),
            'hora_fin' => substr((string) ($settings->jornada_hora_fin ?: '18:00'), 0, 5),
            'dias' => $days,
        ];
    }

    private function timeToMinutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return ($hours * 60) + $minutes;
    }

    private function minutesToTime(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }

    private function materializeLeaveAttendances(AsistenciaPermiso $leave): void
    {
        $history = DB::table('integrantes_historial')->where('integrante_id', $leave->integrante_id)->where('estado', 'Activo')->latest('id')->first();
        if (! $history) {
            return;
        }
        $dates = $leave->fechas()->orderBy('fecha')->pluck('fecha');
        if ($dates->isEmpty()) {
            $from = CarbonImmutable::parse($leave->fecha_inicio);
            $to = CarbonImmutable::parse($leave->fecha_fin);
            for ($day = $from; $day->lte($to); $day = $day->addDay()) {
                $dates->push($day->toDateString());
            }
        }

        foreach ($dates as $date) {
            $day = CarbonImmutable::parse($date);
            if ($this->isNonWorkingDay($day)) {
                continue;
            }
            $schedules = DB::table('integrante_horarios')->where('historial_id', $history->id)->where('dia_semana', $day->isoWeekday())->get();
            foreach ($schedules as $schedule) {
                $minutes = CarbonImmutable::parse($schedule->hora_inicio)->diffInMinutes(CarbonImmutable::parse($schedule->hora_fin));
                Asistencia::query()->updateOrCreate(
                    ['integrante_id' => $leave->integrante_id, 'fecha' => $day->toDateString(), 'horario_id' => $schedule->id],
                    ['historial_id' => $history->id, 'hora_inicio_programada' => $schedule->hora_inicio, 'hora_fin_programada' => $schedule->hora_fin,
                        'minutos_programados' => $minutes, 'minutos_realizados' => 0, 'minutos_incumplidos' => 0, 'estado' => 'permiso',
                        'observacion' => "Permiso aprobado #{$leave->id}"],
                );
                $attendance = Asistencia::query()->where('integrante_id', $leave->integrante_id)->whereDate('fecha', $day->toDateString())->where('horario_id', $schedule->id)->first();
                $attendance?->incidencias()->where('tipo', 'inasistencia')->delete();
            }
        }
    }

    private function managementScope(User $user, int $memberId, array $permissions): object
    {
        $scope = $this->authorization->scope($user, $permissions);
        if (! $scope->global && ! $this->scopedMemberIds(false, $scope->areaId)->contains($memberId)) {
            throw new AuthorizationException('El integrante está fuera de tu alcance.');
        }

        return $scope;
    }

    private function scopedMemberIds(bool $global, ?int $areaId)
    {
        return DB::table('integrantes as member')->join('integrantes_historial as history', 'history.integrante_id', '=', 'member.id')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')->where('history.estado', 'Activo')
            ->when(! $global, fn ($query) => $query->where('position.area_id', $areaId))->pluck('member.id');
    }

    private function ensurePending(string $state): void
    {
        if ($state !== 'pendiente') {
            throw ValidationException::withMessages(['estado' => 'La solicitud ya fue resuelta.']);
        }
    }

    private function notifyDecision(int $memberId, ?int $attendanceId, string $type, string $title, ?string $detail): void
    {
        $userId = DB::table('integrantes as member')->join('cuentas_acceso as account', 'account.persona_id', '=', 'member.persona_id')
            ->where('member.id', $memberId)->where('account.activo', true)->value('account.user_id');
        if (! $userId) {
            return;
        }
        NotificacionAsistencia::query()->create(['user_id' => $userId, 'asistencia_id' => $attendanceId, 'tipo' => $type,
            'titulo' => ucfirst($title), 'mensaje' => $detail ?: 'Revisa el detalle en Mi asistencia.', 'clave' => $type.'-'.$memberId.'-'.now()->format('YmdHisv')]);
    }

    private function audit(Asistencia $attendance, string $action, string $actorId, ?array $before, ?array $after, ?string $reason): void
    {
        DB::table('asistencia_auditoria')->insert(['asistencia_id' => $attendance->id, 'accion' => $action, 'actor_id' => $actorId,
            'datos_anteriores' => $before ? json_encode($before, JSON_THROW_ON_ERROR) : null,
            'datos_nuevos' => $after ? json_encode($after, JSON_THROW_ON_ERROR) : null, 'motivo' => $reason, 'created_at' => now(), 'updated_at' => now()]);
    }

    private function disk(): string
    {
        return (string) config('filesystems.attendance_evidence_disk');
    }

    private function isNonWorkingDay(CarbonImmutable $day): bool
    {
        return $this->holidays->isNonWorkingDay($day);
    }
}
