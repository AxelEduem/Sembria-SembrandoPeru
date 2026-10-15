<?php

namespace App\Services\Asistencia;

use App\Models\Asistencia;
use App\Models\AsistenciaConfiguracion;
use App\Models\AsistenciaIncidencia;
use App\Models\AsistenciaJustificacion;
use App\Models\AsistenciaRecuperacion;
use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use App\Models\IntegranteHorario;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PersonalAttendanceService
{
    private const TIMEZONE = 'America/Lima';

    public function __construct(
        private readonly AttendanceWorkflowService $workflows,
        private readonly PeruHolidayService $holidays,
        private readonly AttendanceEvidenceUrlService $evidenceUrls,
    ) {}

    public function today(User $user): array
    {
        [$integrante, $historial] = $this->participantContext($user);
        $today = CarbonImmutable::now(self::TIMEZONE);
        $schedules = $this->holidays->isNonWorkingDay($today)
            ? collect()
            : $historial->horarios()
                ->where('dia_semana', $today->isoWeekday())
                ->orderBy('hora_inicio')
                ->get();
        $attendances = Asistencia::query()
            ->with(['incidencias', 'justificaciones.recuperaciones', 'amonestaciones', 'recuperacion'])
            ->where('integrante_id', $integrante->id)
            ->whereDate('fecha', $today->toDateString())
            ->whereIn('horario_id', $schedules->pluck('id'))
            ->get()
            ->keyBy('horario_id');

        $blocks = $schedules
            ->filter(fn (IntegranteHorario $schedule): bool => $attendances->get($schedule->id)?->estado !== 'falta')
            ->map(function (IntegranteHorario $schedule) use ($attendances, $historial, $today): array {
                $attendance = $attendances->get($schedule->id);

                if ($attendance !== null) {
                    return $this->attendanceArray($attendance);
                }

                return [
                    'id' => null,
                    'integrante_id' => $historial->integrante_id,
                    'historial_id' => $historial->id,
                    'horario_id' => $schedule->id,
                    'tipo_bloque' => 'normal',
                    'recuperacion_id' => null,
                    'fecha' => $today->toDateString(),
                    'hora_inicio_programada' => $schedule->hora_inicio,
                    'hora_fin_programada' => $schedule->hora_fin,
                    'hora_entrada' => null,
                    'hora_salida' => null,
                    'minutos_programados' => $this->scheduledMinutes($schedule),
                    'minutos_realizados' => 0,
                    'minutos_tardanza' => 0,
                    'minutos_salida_anticipada' => 0,
                    'minutos_incumplidos' => 0,
                    'estado' => 'pendiente',
                    'observacion' => null,
                    'asistencia_incidencias' => [],
                    'asistencia_justificaciones' => [],
                ];
            })->values();

        if (! $this->holidays->isNonWorkingDay($today)) {
            $recoveryBlocks = AsistenciaRecuperacion::query()
                ->with([
                    'asistencia.incidencias',
                    'asistencia.justificaciones.recuperaciones',
                    'asistencia.amonestaciones',
                    'asistencia.recuperacion',
                ])
                ->whereDate('fecha', $today->toDateString())
                ->whereIn('estado', ['programada', 'en_curso', 'completada'])
                ->where(function ($query) use ($integrante): void {
                    $query->whereHas('permiso', fn ($leave) => $leave
                        ->where('integrante_id', $integrante->id)
                        ->where('estado', 'aprobada'))
                        ->orWhereHas('justificacion', fn ($justification) => $justification
                            ->where('estado', 'aprobada')
                            ->whereHas('asistencia', fn ($attendance) => $attendance
                                ->where('integrante_id', $integrante->id)));
                })
                ->get()
                ->map(fn (AsistenciaRecuperacion $recovery): array => $this->recoveryArray(
                    $recovery,
                    $historial->id,
                    $integrante->id,
                ));

            $blocks = $blocks
                ->concat($recoveryBlocks)
                ->sortBy('hora_inicio_programada')
                ->values();
        }

        $openAttendance = Asistencia::query()
            ->with(['incidencias', 'justificaciones.recuperaciones', 'amonestaciones', 'recuperacion'])
            ->where('integrante_id', $integrante->id)
            ->where('estado', 'en_jornada')
            ->whereNull('hora_salida')
            ->latest('fecha')
            ->first();

        if ($openAttendance !== null && ! $blocks->contains(fn (array $block): bool => $block['id'] === $openAttendance->id)) {
            $blocks->prepend($this->attendanceArray($openAttendance));
        }

        return $blocks->all();
    }

    public function history(User $user, int $limit = 20): Collection
    {
        [$integrante] = $this->participantContext($user);

        return Asistencia::query()
            ->with(['incidencias', 'justificaciones.recuperaciones', 'amonestaciones', 'recuperacion'])
            ->where('integrante_id', $integrante->id)
            ->latest('fecha')
            ->orderByDesc('hora_inicio_programada')
            ->limit($limit)
            ->get();
    }

    public function start(
        User $user,
        int $scheduleId,
        ?string $reason,
        ?string $occurredAt = null,
        ?string $clientEventId = null,
        array $recoveries = [],
    ): Asistencia {
        [$integrante, $historial, $accountId] = $this->participantContext($user);

        if ($clientEventId !== null) {
            $existing = Asistencia::query()->where('entrada_client_event_id', $clientEventId)->first();
            if ($existing !== null) {
                return $this->fresh($existing);
            }
        }

        return DB::transaction(function () use ($user, $integrante, $historial, $accountId, $scheduleId, $reason, $occurredAt, $clientEventId, $recoveries): Asistencia {
            $schedule = IntegranteHorario::query()->lockForUpdate()->findOrFail($scheduleId);
            $settings = AsistenciaConfiguracion::current();
            $receivedAt = CarbonImmutable::now();
            $now = $occurredAt ? CarbonImmutable::parse($occurredAt)->utc() : $receivedAt;
            if ($occurredAt && ($now->isAfter($receivedAt->addMinutes(2)) || $now->isBefore($receivedAt->subMinutes($settings->max_minutos_offline)))) {
                throw ValidationException::withMessages(['ocurrido_en' => 'El registro offline está fuera del tiempo permitido.']);
            }
            $today = $now->setTimezone(self::TIMEZONE);

            if ($this->holidays->isNonWorkingDay($today)) {
                throw ValidationException::withMessages([
                    'horario_id' => 'Esta fecha está configurada como feriado o día no laborable.',
                ]);
            }

            if ((int) $schedule->historial_id !== (int) $historial->id
                || (int) $schedule->dia_semana !== $today->isoWeekday()) {
                throw new AuthorizationException('El bloque no corresponde a tu horario activo de hoy.');
            }

            [$scheduledStart, $scheduledEnd] = $this->scheduledRange($today, $schedule);

            if ($now->lt($scheduledStart->subMinutes($settings->minutos_antes_inicio))) {
                throw ValidationException::withMessages([
                    'horario_id' => "Este bloque se habilita {$settings->minutos_antes_inicio} minutos antes de su inicio.",
                ]);
            }

            if ($now->gte($scheduledEnd)) {
                throw ValidationException::withMessages([
                    'horario_id' => 'El horario de este bloque ya finalizó.',
                ]);
            }

            if (Asistencia::query()
                ->where('integrante_id', $integrante->id)
                ->where('estado', 'en_jornada')
                ->whereNull('hora_salida')
                ->lockForUpdate()
                ->exists()) {
                throw ValidationException::withMessages([
                    'horario_id' => 'Debes terminar tu bloque abierto antes de iniciar otro.',
                ]);
            }

            $scheduledMinutes = $this->scheduledMinutes($schedule);
            $lateMinutes = max(0, min(
                $scheduledMinutes,
                (int) floor(($now->getTimestamp() - $scheduledStart->getTimestamp()) / 60)
            ));

            if ($lateMinutes > $settings->tolerancia_tardanza && $reason === null) {
                throw ValidationException::withMessages([
                    'motivo' => 'Debes indicar por qué registras tu entrada tarde.',
                ]);
            }

            $existingBlock = Asistencia::query()
                ->where('integrante_id', $integrante->id)
                ->whereDate('fecha', $today->toDateString())
                ->where('horario_id', $schedule->id)
                ->lockForUpdate()
                ->first();
            if ($existingBlock !== null) {
                if ($occurredAt && $existingBlock->estado === 'falta') {
                    $before = $existingBlock->toArray();
                    $existingBlock->incidencias()->where('tipo', 'inasistencia')->delete();
                    $existingBlock->update([
                        'hora_entrada' => $now, 'fuente_entrada' => $clientEventId ? 'offline' : 'online', 'entrada_client_event_id' => $clientEventId,
                        'minutos_tardanza' => $lateMinutes, 'minutos_incumplidos' => $scheduledMinutes, 'estado' => 'en_jornada', 'observacion' => $reason,
                    ]);
                    if ($lateMinutes > $settings->tolerancia_tardanza) {
                        AsistenciaIncidencia::query()->create([
                            'asistencia_id' => $existingBlock->id, 'tipo' => 'tardanza', 'minutos' => $lateMinutes,
                            'descripcion' => $reason, 'registrado_por' => $accountId,
                        ]);
                        $justification = AsistenciaJustificacion::query()->create([
                            'asistencia_id' => $existingBlock->id,
                            'tipo' => 'tardanza',
                            'motivo' => $reason,
                            'estado' => 'pendiente',
                            'registrado_por' => $accountId,
                            'fecha_registro' => CarbonImmutable::now(),
                        ]);
                        $this->workflows->createJustificationRecoveries(
                            $user,
                            $justification,
                            $lateMinutes,
                            $today->toDateString(),
                            $recoveries,
                        );
                    }
                    $this->audit($existingBlock, 'falta_revertida_por_registro_offline', $accountId, $before, $existingBlock->fresh()->toArray(), $reason);

                    return $this->fresh($existingBlock);
                }
                throw ValidationException::withMessages([
                    'horario_id' => 'Este bloque ya tiene una asistencia registrada.',
                ]);
            }

            $attendance = Asistencia::query()->create([
                'integrante_id' => $integrante->id,
                'historial_id' => $historial->id,
                'horario_id' => $schedule->id,
                'fecha' => $today->toDateString(),
                'hora_inicio_programada' => $schedule->hora_inicio,
                'hora_fin_programada' => $schedule->hora_fin,
                'hora_entrada' => $now,
                'fuente_entrada' => $clientEventId ? 'offline' : 'online',
                'entrada_client_event_id' => $clientEventId,
                'minutos_programados' => $scheduledMinutes,
                'minutos_realizados' => 0,
                'minutos_tardanza' => $lateMinutes,
                'minutos_salida_anticipada' => 0,
                'minutos_incumplidos' => $scheduledMinutes,
                'estado' => 'en_jornada',
                'observacion' => $reason,
            ]);

            if ($lateMinutes > $settings->tolerancia_tardanza) {
                AsistenciaIncidencia::query()->create([
                    'asistencia_id' => $attendance->id,
                    'tipo' => 'tardanza',
                    'minutos' => $lateMinutes,
                    'descripcion' => $reason,
                    'registrado_por' => $accountId,
                ]);
                $justification = AsistenciaJustificacion::query()->create([
                    'asistencia_id' => $attendance->id,
                    'tipo' => 'tardanza',
                    'motivo' => $reason,
                    'estado' => 'pendiente',
                    'registrado_por' => $accountId,
                    'fecha_registro' => CarbonImmutable::now(),
                ]);
                $this->workflows->createJustificationRecoveries(
                    $user,
                    $justification,
                    $lateMinutes,
                    $today->toDateString(),
                    $recoveries,
                );
            }

            $this->audit($attendance, 'entrada_registrada', $accountId, null, $attendance->toArray(), $reason);

            return $this->fresh($attendance);
        });
    }

    public function startRecovery(
        User $user,
        AsistenciaRecuperacion $recovery,
        ?string $reason,
        ?string $occurredAt = null,
        ?string $clientEventId = null,
        array $recoveries = [],
    ): Asistencia {
        [$integrante, $historial, $accountId] = $this->participantContext($user);

        if ($clientEventId !== null) {
            $existing = Asistencia::query()->where('entrada_client_event_id', $clientEventId)->first();
            if ($existing !== null) {
                return $this->fresh($existing);
            }
        }

        return DB::transaction(function () use (
            $user,
            $integrante,
            $historial,
            $accountId,
            $recovery,
            $reason,
            $occurredAt,
            $clientEventId,
            $recoveries,
        ): Asistencia {
            $lockedRecovery = AsistenciaRecuperacion::query()->lockForUpdate()->findOrFail($recovery->id);
            [$ownerId, $parentState] = $this->workflows->recoveryOwnerAndState($lockedRecovery);

            if ($ownerId !== (int) $integrante->id || $parentState !== 'aprobada') {
                throw new AuthorizationException('No puedes iniciar esta recuperación.');
            }
            if ($lockedRecovery->estado !== 'programada' || $lockedRecovery->asistencia_id !== null) {
                throw ValidationException::withMessages([
                    'recuperacion' => 'Esta recuperación ya fue iniciada o no se encuentra disponible.',
                ]);
            }

            $settings = AsistenciaConfiguracion::current();
            $receivedAt = CarbonImmutable::now();
            $now = $occurredAt ? CarbonImmutable::parse($occurredAt)->utc() : $receivedAt;
            if ($occurredAt && ($now->isAfter($receivedAt->addMinutes(2)) || $now->isBefore($receivedAt->subMinutes($settings->max_minutos_offline)))) {
                throw ValidationException::withMessages([
                    'ocurrido_en' => 'El registro offline está fuera del tiempo permitido.',
                ]);
            }

            $today = $now->setTimezone(self::TIMEZONE);
            if (! $lockedRecovery->fecha->isSameDay($today)) {
                throw ValidationException::withMessages([
                    'recuperacion' => 'La recuperación solo puede iniciarse en su fecha programada.',
                ]);
            }
            if ($this->holidays->isNonWorkingDay($today)) {
                throw ValidationException::withMessages([
                    'recuperacion' => 'Esta fecha está configurada como feriado o día no laborable.',
                ]);
            }

            $scheduledStart = $this->dateTime($lockedRecovery->fecha->format('Y-m-d'), $lockedRecovery->hora_inicio);
            $scheduledEnd = $this->dateTime($lockedRecovery->fecha->format('Y-m-d'), $lockedRecovery->hora_fin);

            if ($now->lt($scheduledStart->subMinutes($settings->minutos_antes_inicio))) {
                throw ValidationException::withMessages([
                    'recuperacion' => "Este bloque se habilita {$settings->minutos_antes_inicio} minutos antes de su inicio.",
                ]);
            }
            if ($now->gte($scheduledEnd)) {
                throw ValidationException::withMessages([
                    'recuperacion' => 'El horario de este bloque de recuperación ya finalizó.',
                ]);
            }
            if (Asistencia::query()
                ->where('integrante_id', $integrante->id)
                ->where('estado', 'en_jornada')
                ->whereNull('hora_salida')
                ->lockForUpdate()
                ->exists()) {
                throw ValidationException::withMessages([
                    'recuperacion' => 'Debes terminar tu bloque abierto antes de iniciar otro.',
                ]);
            }

            $scheduledMinutes = (int) $lockedRecovery->minutos;
            $lateMinutes = max(0, min(
                $scheduledMinutes,
                (int) floor(($now->getTimestamp() - $scheduledStart->getTimestamp()) / 60),
            ));
            if ($lateMinutes > $settings->tolerancia_tardanza && $reason === null) {
                throw ValidationException::withMessages([
                    'motivo' => 'Debes indicar por qué registras tu entrada tarde.',
                ]);
            }

            $attendance = Asistencia::query()->create([
                'integrante_id' => $integrante->id,
                'historial_id' => $historial->id,
                'horario_id' => null,
                'fecha' => $today->toDateString(),
                'hora_inicio_programada' => $lockedRecovery->hora_inicio,
                'hora_fin_programada' => $lockedRecovery->hora_fin,
                'hora_entrada' => $now,
                'fuente_entrada' => $clientEventId ? 'offline' : 'online',
                'entrada_client_event_id' => $clientEventId,
                'minutos_programados' => $scheduledMinutes,
                'minutos_realizados' => 0,
                'minutos_tardanza' => $lateMinutes,
                'minutos_salida_anticipada' => 0,
                'minutos_incumplidos' => $scheduledMinutes,
                'estado' => 'en_jornada',
                'observacion' => $reason,
            ]);

            $lockedRecovery->update([
                'asistencia_id' => $attendance->id,
                'estado' => 'en_curso',
                'hora_entrada_real' => $now,
            ]);

            if ($lateMinutes > $settings->tolerancia_tardanza) {
                AsistenciaIncidencia::query()->create([
                    'asistencia_id' => $attendance->id,
                    'tipo' => 'tardanza',
                    'minutos' => $lateMinutes,
                    'descripcion' => $reason,
                    'registrado_por' => $accountId,
                ]);
                $justification = AsistenciaJustificacion::query()->create([
                    'asistencia_id' => $attendance->id,
                    'tipo' => 'tardanza',
                    'motivo' => $reason,
                    'estado' => 'pendiente',
                    'registrado_por' => $accountId,
                    'fecha_registro' => CarbonImmutable::now(),
                ]);
                $this->workflows->createJustificationRecoveries(
                    $user,
                    $justification,
                    $lateMinutes,
                    $today->toDateString(),
                    $recoveries,
                );
            }

            $this->audit($attendance, 'recuperacion_iniciada', $accountId, null, $attendance->toArray(), $reason);

            return $this->fresh($attendance);
        });
    }

    public function finishRecovery(
        User $user,
        AsistenciaRecuperacion $recovery,
        string $description,
    ): Asistencia {
        [$integrante] = $this->participantContext($user);
        [$ownerId, $parentState] = $this->workflows->recoveryOwnerAndState($recovery);

        if ($ownerId !== (int) $integrante->id || $parentState !== 'aprobada') {
            throw new AuthorizationException('No puedes finalizar esta recuperación.');
        }

        $attendance = $recovery->asistencia()->first();
        if ($attendance === null) {
            throw ValidationException::withMessages([
                'recuperacion' => 'La recuperación no se encuentra en curso.',
            ]);
        }

        return $this->finish($user, $attendance, $description, null);
    }

    public function finish(
        User $user,
        Asistencia $attendance,
        string $description,
        ?string $earlyExitReason,
        ?string $occurredAt = null,
        ?string $clientEventId = null,
        ?UploadedFile $attachment = null,
        array $recoveries = [],
    ): Asistencia {
        [$integrante, , $accountId] = $this->participantContext($user);
        $path = $attachment?->store('attendance-documents/early-exits', (string) config('filesystems.attendance_evidence_disk'));

        try {
            return DB::transaction(function () use (
                $user,
                $integrante,
                $accountId,
                $attendance,
                $description,
                $earlyExitReason,
                $occurredAt,
                $clientEventId,
                $recoveries,
                $path,
            ): Asistencia {
                $locked = Asistencia::query()->lockForUpdate()->findOrFail($attendance->id);

                if ((int) $locked->integrante_id !== (int) $integrante->id) {
                    throw new AuthorizationException('Solo puedes terminar tu propia asistencia.');
                }

                if ($clientEventId && $locked->salida_client_event_id === $clientEventId) {
                    if ($path) {
                        Storage::disk((string) config('filesystems.attendance_evidence_disk'))->delete($path);
                    }

                    return $this->fresh($locked);
                }

                if ($locked->estado !== 'en_jornada' || $locked->hora_salida !== null) {
                    throw ValidationException::withMessages([
                        'asistencia' => 'La asistencia no se encuentra abierta.',
                    ]);
                }

                $settings = AsistenciaConfiguracion::current();
                $before = $locked->toArray();
                $receivedAt = CarbonImmutable::now();
                $now = $occurredAt ? CarbonImmutable::parse($occurredAt)->utc() : $receivedAt;
                if ($occurredAt && ($now->isAfter($receivedAt->addMinutes(2)) || $now->isBefore($receivedAt->subMinutes($settings->max_minutos_offline)))) {
                    throw ValidationException::withMessages(['ocurrido_en' => 'El registro offline está fuera del tiempo permitido.']);
                }
                $scheduledStart = $this->dateTime($locked->fecha->format('Y-m-d'), $locked->hora_inicio_programada);
                $scheduledEnd = $this->dateTime($locked->fecha->format('Y-m-d'), $locked->hora_fin_programada);
                $entry = CarbonImmutable::parse($locked->hora_entrada);
                $effectiveStart = max($entry->getTimestamp(), $scheduledStart->getTimestamp());
                $effectiveEnd = min($now->getTimestamp(), $scheduledEnd->getTimestamp());
                $realized = max(0, (int) floor(($effectiveEnd - $effectiveStart) / 60));
                $early = max(0, (int) floor(($scheduledEnd->getTimestamp() - min($now->getTimestamp(), $scheduledEnd->getTimestamp())) / 60));

                if ($early >= $settings->umbral_salida_anticipada && ($earlyExitReason === null || trim($earlyExitReason) === '')) {
                    throw ValidationException::withMessages([
                        'motivo_salida' => 'Debes explicar por qué necesitas salir antes.',
                    ]);
                }

                $locked->update([
                    'hora_salida' => $now,
                    'fuente_salida' => $occurredAt ? 'offline' : 'online',
                    'salida_client_event_id' => $clientEventId,
                    'minutos_realizados' => $realized,
                    'minutos_salida_anticipada' => $early,
                    'minutos_incumplidos' => max(0, $locked->minutos_programados - $realized),
                    'estado' => 'completada',
                    'descripcion_jornada' => $description,
                ]);

                AsistenciaRecuperacion::query()
                    ->where('asistencia_id', $locked->id)
                    ->lockForUpdate()
                    ->update([
                        'estado' => 'completada',
                        'hora_salida_real' => $now,
                        'minutos_realizados' => $realized,
                        'descripcion' => $description,
                    ]);

                if ($early >= $settings->umbral_salida_anticipada) {
                    AsistenciaIncidencia::query()->create([
                        'asistencia_id' => $locked->id,
                        'tipo' => 'salida_anticipada',
                        'minutos' => $early,
                        'descripcion' => $earlyExitReason,
                        'registrado_por' => $accountId,
                    ]);

                    $justification = AsistenciaJustificacion::query()->create([
                        'asistencia_id' => $locked->id,
                        'tipo' => 'salida_anticipada',
                        'motivo' => $earlyExitReason,
                        'estado' => 'pendiente',
                        'registrado_por' => $accountId,
                        'fecha_registro' => CarbonImmutable::now(),
                        'adjunto_path' => $path,
                    ]);
                    $this->workflows->createJustificationRecoveries(
                        $user,
                        $justification,
                        $early,
                        $locked->fecha->toDateString(),
                        $recoveries,
                    );
                } elseif ($path) {
                    Storage::disk((string) config('filesystems.attendance_evidence_disk'))->delete($path);
                }

                $this->audit($locked, 'salida_registrada', $accountId, $before, $locked->fresh()->toArray(), null);

                return $this->fresh($locked);
            });
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk((string) config('filesystems.attendance_evidence_disk'))->delete($path);
            }

            throw $exception;
        }
    }

    public function justify(
        User $user,
        Asistencia $attendance,
        string $reason,
        ?UploadedFile $attachment,
        array $recoveries = [],
    ): Asistencia {
        [$integrante, , $accountId] = $this->participantContext($user);
        $disk = (string) config('filesystems.attendance_evidence_disk');
        $path = $attachment?->store('attendance-documents/absence-justifications', $disk);

        try {
            return DB::transaction(function () use ($user, $integrante, $accountId, $attendance, $reason, $path, $recoveries): Asistencia {
                $locked = Asistencia::query()->lockForUpdate()->findOrFail($attendance->id);

                if ((int) $locked->integrante_id !== (int) $integrante->id) {
                    throw new AuthorizationException('Solo puedes justificar tu propia asistencia.');
                }

                if ($locked->estado !== 'falta') {
                    throw ValidationException::withMessages([
                        'asistencia' => 'Solo puedes justificar una asistencia registrada como falta.',
                    ]);
                }

                if ($locked->justificaciones()->where('estado', 'pendiente')->exists()) {
                    throw ValidationException::withMessages([
                        'motivo' => 'Esta asistencia ya tiene una justificación pendiente.',
                    ]);
                }

                $justification = AsistenciaJustificacion::query()->create([
                    'asistencia_id' => $locked->id,
                    'tipo' => 'falta',
                    'motivo' => $reason,
                    'estado' => 'pendiente',
                    'registrado_por' => $accountId,
                    'fecha_registro' => CarbonImmutable::now(),
                    'adjunto_path' => $path,
                ]);

                $this->workflows->createJustificationRecoveries(
                    $user,
                    $justification,
                    (int) $locked->minutos_incumplidos,
                    $locked->fecha->toDateString(),
                    $recoveries,
                );

                $this->audit($locked, 'justificada', $accountId, null, $justification->toArray(), $reason);

                return $this->fresh($locked);
            });
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk($disk)->delete($path);
            }

            throw $exception;
        }
    }

    private function participantContext(User $user): array
    {
        $account = $user->cuentaAcceso()->where('activo', true)->first();

        if ($account === null) {
            throw new AuthorizationException('Tu cuenta institucional no se encuentra activa.');
        }

        $integrante = Integrante::query()
            ->where('persona_id', $account->persona_id)
            ->where('estado', 'Activo')
            ->latest('id')
            ->first();

        if ($integrante === null) {
            throw new AuthorizationException('Tu cuenta no corresponde a un integrante activo.');
        }

        $today = CarbonImmutable::now(self::TIMEZONE)->toDateString();
        $historial = IntegranteHistorial::query()
            ->where('integrante_id', $integrante->id)
            ->where('estado', 'Activo')
            ->where(fn ($query) => $query->whereNull('fecha_inicio')->orWhereDate('fecha_inicio', '<=', $today))
            ->where(fn ($query) => $query->whereNull('fecha_fin')->orWhereDate('fecha_fin', '>=', $today))
            ->latest('id')
            ->first();

        if ($historial === null) {
            throw new AuthorizationException('No tienes un periodo institucional activo.');
        }

        if ($historial->tipo_integrante === 'gerente') {
            throw new AuthorizationException('Los gerentes no registran asistencia.');
        }

        return [$integrante, $historial, $account->id];
    }

    private function scheduledRange(CarbonImmutable $day, IntegranteHorario $schedule): array
    {
        return [
            $this->dateTime($day->toDateString(), $schedule->hora_inicio),
            $this->dateTime($day->toDateString(), $schedule->hora_fin),
        ];
    }

    private function dateTime(string $date, string $time): CarbonImmutable
    {
        return CarbonImmutable::parse("{$date} {$time}", self::TIMEZONE)->utc();
    }

    private function scheduledMinutes(IntegranteHorario $schedule): int
    {
        $start = CarbonImmutable::parse($schedule->hora_inicio);
        $end = CarbonImmutable::parse($schedule->hora_fin);

        return (int) (($end->getTimestamp() - $start->getTimestamp()) / 60);
    }

    private function fresh(Asistencia $attendance): Asistencia
    {
        return $attendance->fresh(['incidencias', 'justificaciones.recuperaciones', 'amonestaciones', 'recuperacion']);
    }

    private function attendanceArray(Asistencia $attendance): array
    {
        $recovery = $attendance->relationLoaded('recuperacion')
            ? $attendance->recuperacion
            : null;

        return [
            'id' => $attendance->id,
            'integrante_id' => $attendance->integrante_id,
            'historial_id' => $attendance->historial_id,
            'horario_id' => $attendance->horario_id,
            'tipo_bloque' => $recovery ? 'recuperacion' : 'normal',
            'recuperacion_id' => $recovery?->id,
            'fecha' => $attendance->fecha->format('Y-m-d'),
            'hora_inicio_programada' => $attendance->hora_inicio_programada,
            'hora_fin_programada' => $attendance->hora_fin_programada,
            'hora_entrada' => $attendance->hora_entrada?->toISOString(),
            'fuente_entrada' => $attendance->fuente_entrada,
            'hora_salida' => $attendance->hora_salida?->toISOString(),
            'fuente_salida' => $attendance->fuente_salida,
            'minutos_programados' => (int) $attendance->minutos_programados,
            'minutos_realizados' => (int) $attendance->minutos_realizados,
            'minutos_tardanza' => (int) $attendance->minutos_tardanza,
            'minutos_salida_anticipada' => (int) $attendance->minutos_salida_anticipada,
            'minutos_incumplidos' => (int) $attendance->minutos_incumplidos,
            'estado' => $attendance->estado,
            'observacion' => $attendance->observacion,
            'descripcion_jornada' => $attendance->descripcion_jornada,
            'evidencia_url' => $this->evidenceUrl($attendance->evidencia_path),
            'asistencia_incidencias' => $attendance->incidencias->values()->all(),
            'asistencia_justificaciones' => $attendance->justificaciones->values()->all(),
            'asistencia_amonestaciones' => $attendance->amonestaciones->values()->all(),
        ];
    }

    private function recoveryArray(
        AsistenciaRecuperacion $recovery,
        int $historyId,
        int $memberId,
    ): array {
        if ($recovery->asistencia !== null) {
            return $this->attendanceArray($recovery->asistencia);
        }

        return [
            'id' => null,
            'integrante_id' => $memberId,
            'historial_id' => $historyId,
            'horario_id' => null,
            'tipo_bloque' => 'recuperacion',
            'recuperacion_id' => $recovery->id,
            'fecha' => $recovery->fecha->format('Y-m-d'),
            'hora_inicio_programada' => $recovery->hora_inicio,
            'hora_fin_programada' => $recovery->hora_fin,
            'hora_entrada' => $recovery->hora_entrada_real?->toISOString(),
            'hora_salida' => $recovery->hora_salida_real?->toISOString(),
            'minutos_programados' => (int) $recovery->minutos,
            'minutos_realizados' => (int) $recovery->minutos_realizados,
            'minutos_tardanza' => 0,
            'minutos_salida_anticipada' => 0,
            'minutos_incumplidos' => max(
                0,
                (int) $recovery->minutos - (int) $recovery->minutos_realizados,
            ),
            'estado' => match ($recovery->estado) {
                'en_curso' => 'en_jornada',
                'completada' => 'completada',
                default => 'pendiente',
            },
            'observacion' => null,
            'descripcion_jornada' => $recovery->descripcion,
            'asistencia_incidencias' => [],
            'asistencia_justificaciones' => [],
            'asistencia_amonestaciones' => [],
        ];
    }

    private function evidenceUrl(?string $path): ?string
    {
        return $this->evidenceUrls->url($path);
    }

    private function evidenceDisk(): string
    {
        return (string) config('filesystems.attendance_evidence_disk');
    }

    private function audit(
        Asistencia $attendance,
        string $action,
        string $actorId,
        ?array $before,
        ?array $after,
        ?string $reason,
    ): void {
        DB::table('asistencia_auditoria')->insert([
            'asistencia_id' => $attendance->id,
            'accion' => $action,
            'actor_id' => $actorId,
            'datos_anteriores' => $before === null ? null : json_encode($before, JSON_THROW_ON_ERROR),
            'datos_nuevos' => $after === null ? null : json_encode($after, JSON_THROW_ON_ERROR),
            'motivo' => $reason,
            'created_at' => CarbonImmutable::now(),
            'updated_at' => CarbonImmutable::now(),
        ]);
    }
}
