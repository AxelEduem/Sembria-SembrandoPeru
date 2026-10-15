<?php

namespace App\Services\Integrantes;

use App\Models\CuentaAcceso;
use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use App\Models\NotificacionAsistencia;
use App\Models\SolicitudCambioHorario;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SolicitudCambioHorarioService
{
    private const CREATION_COOLDOWN_DAYS = 15;

    private const MANAGE_PERMISSIONS = [
        'solicitudes_horario.ver',
        'voluntarios.gestionar_horario',
    ];

    private const VIEW_PERMISSIONS = ['solicitudes_horario.ver'];

    public function __construct(
        private readonly InstitutionalAuthorizationService $authorization,
        private readonly HorarioService $horarios,
    ) {}

    /**
     * @return array{
     *     requests: LengthAwarePaginator,
     *     has_pending: bool,
     *     creation_eligibility: array{
     *         can_create: bool,
     *         reason: ?string,
     *         available_from: ?string,
     *         message: ?string
     *     }
     * }
     */
    public function mine(User $user, array $filters): array
    {
        $account = $this->activeAccount($user);
        $member = Integrante::query()
            ->where('persona_id', $account->persona_id)
            ->latest('id')
            ->first();

        $memberId = $member?->id ?? 0;
        $term = trim((string) ($filters['q'] ?? ''));
        $status = $filters['estado'] ?? null;
        $period = isset($filters['periodo']) ? (int) $filters['periodo'] : null;
        $perPage = (int) ($filters['por_pagina'] ?? 6);
        $page = (int) ($filters['pagina'] ?? 1);

        $requests = $this->baseQuery()
            ->where('integrante_id', $memberId)
            ->when($term !== '', function ($query) use ($term): void {
                $query->where(function ($search) use ($term): void {
                    $search->whereLike('motivo', "%{$term}%", caseSensitive: false)
                        ->orWhereLike('observacion_resolucion', "%{$term}%", caseSensitive: false);
                });
            })
            ->when($status, fn ($query) => $query->where('estado', $status))
            ->when($period, fn ($query) => $query->where(
                'fecha_solicitud',
                '>=',
                now()->subDays($period)->startOfDay(),
            ))
            ->orderByDesc('fecha_solicitud')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'pagina', $page);

        $eligibility = $this->creationEligibility($memberId);

        return [
            'requests' => $requests,
            'has_pending' => $eligibility['reason'] === 'pending',
            'creation_eligibility' => $eligibility,
        ];
    }

    public function list(User $user, ?string $status = null): Collection
    {
        $scope = $this->authorization->scope($user, self::VIEW_PERMISSIONS);

        return $this->baseQuery()
            ->when(! $scope->global, fn ($query) => $query->whereHas(
                'historialAnterior.cargo',
                fn ($cargo) => $cargo->where('area_id', $scope->areaId),
            ))
            ->when($status, fn ($query) => $query->where('estado', $status))
            ->orderByDesc('fecha_solicitud')
            ->orderByDesc('id')
            ->get();
    }

    public function create(User $user, array $data): SolicitudCambioHorario
    {
        return DB::transaction(function () use ($user, $data): SolicitudCambioHorario {
            $account = $this->activeAccount($user);
            $member = Integrante::query()
                ->where('persona_id', $account->persona_id)
                ->lockForUpdate()
                ->latest('id')
                ->first();

            if ($member === null || $member->estado !== 'Activo') {
                throw ValidationException::withMessages([
                    'integrante' => 'No tienes un registro de integrante activo.',
                ]);
            }

            $eligibility = $this->creationEligibility($member->id);

            if (! $eligibility['can_create']) {
                throw ValidationException::withMessages([
                    'estado' => $eligibility['message'],
                ]);
            }

            $effectiveDate = CarbonImmutable::parse($data['fecha_efectiva'])->startOfDay();
            $history = IntegranteHistorial::query()
                ->where('integrante_id', $member->id)
                ->where('estado', 'Activo')
                ->whereDate('fecha_inicio', '<=', $effectiveDate->toDateString())
                ->where(function ($query) use ($effectiveDate): void {
                    $query->whereNull('fecha_fin')
                        ->orWhereDate('fecha_fin', '>=', $effectiveDate->toDateString());
                })
                ->orderByDesc('fecha_inicio')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            if ($history === null) {
                throw ValidationException::withMessages([
                    'fecha_efectiva' => 'La fecha efectiva no pertenece a un periodo activo.',
                ]);
            }

            if ($history->fecha_inicio && $effectiveDate->lte($history->fecha_inicio)) {
                throw ValidationException::withMessages([
                    'fecha_efectiva' => 'La fecha efectiva debe ser posterior al inicio del periodo actual.',
                ]);
            }

            $request = SolicitudCambioHorario::query()->create([
                'integrante_id' => $member->id,
                'historial_anterior_id' => $history->id,
                'estado' => 'PENDIENTE',
                'fecha_solicitud' => now(),
                'fecha_efectiva' => $effectiveDate->toDateString(),
                'motivo' => filled($data['motivo'] ?? null) ? trim($data['motivo']) : null,
                'created_by' => $account->id,
            ]);

            $request->detalle()->createMany($data['blocks']);

            return $this->loadRelations($request);
        });
    }

    public function resolve(
        User $user,
        SolicitudCambioHorario $scheduleChangeRequest,
        array $data,
    ): SolicitudCambioHorario {
        return DB::transaction(function () use ($user, $scheduleChangeRequest, $data): SolicitudCambioHorario {
            $request = SolicitudCambioHorario::query()
                ->whereKey($scheduleChangeRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            $request->load(['integrante', 'historialAnterior.cargo', 'detalle']);
            $history = $request->historialAnterior;

            if ($history?->cargo === null) {
                throw ValidationException::withMessages([
                    'solicitud' => 'La solicitud no tiene un periodo o cargo válido.',
                ]);
            }

            $scope = $this->authorization->authorizeArea(
                $user,
                self::MANAGE_PERMISSIONS,
                (int) $history->cargo->area_id,
            );

            if ($request->estado !== 'PENDIENTE') {
                throw ValidationException::withMessages([
                    'estado' => 'La solicitud ya fue resuelta.',
                ]);
            }

            $observation = filled($data['observacion'] ?? null)
                ? trim($data['observacion'])
                : null;

            if ($data['accion'] !== 'APROBADA') {
                $request->update([
                    'estado' => $data['accion'],
                    'fecha_resolucion' => now(),
                    'resuelto_por' => $scope->accountId,
                    'observacion_resolucion' => $observation,
                ]);

                $this->notifyResolution($request);

                return $this->loadRelations($request->refresh());
            }

            if ($request->integrante?->estado !== 'Activo') {
                throw ValidationException::withMessages([
                    'integrante' => 'No se puede aprobar el cambio de un integrante inactivo.',
                ]);
            }

            $lockedHistory = IntegranteHistorial::query()
                ->whereKey($history->id)
                ->lockForUpdate()
                ->firstOrFail();
            $effectiveDate = CarbonImmutable::parse($request->fecha_efectiva)->startOfDay();

            if (($lockedHistory->fecha_inicio && $effectiveDate->lte($lockedHistory->fecha_inicio))
                || ($lockedHistory->fecha_fin && $effectiveDate->gt($lockedHistory->fecha_fin))) {
                throw ValidationException::withMessages([
                    'fecha_efectiva' => 'La fecha efectiva ya no pertenece al periodo solicitado.',
                ]);
            }

            $originalEndDate = $lockedHistory->fecha_fin?->format('Y-m-d');
            $lockedHistory->update(['fecha_fin' => $effectiveDate->subDay()->toDateString()]);

            $newHistory = IntegranteHistorial::query()->create([
                'integrante_id' => $lockedHistory->integrante_id,
                'tipo_integrante' => $lockedHistory->tipo_integrante,
                'cargo_id' => $lockedHistory->cargo_id,
                'fecha_inicio' => $effectiveDate->toDateString(),
                'fecha_fin' => $originalEndDate,
                'periodo_meses' => $lockedHistory->periodo_meses,
                'estado' => 'Activo',
                'institucion_educativa' => $lockedHistory->institucion_educativa,
                'horas_practicas_requeridas' => $lockedHistory->horas_practicas_requeridas,
                'carrera' => $lockedHistory->carrera,
                'ciclo' => $lockedHistory->ciclo,
                'modalidad' => $lockedHistory->modalidad,
            ]);

            $blocks = $request->detalle->map(fn ($block) => [
                'dia_semana' => (int) $block->dia_semana,
                'hora_inicio' => substr((string) $block->hora_inicio, 0, 5),
                'hora_fin' => substr((string) $block->hora_fin, 0, 5),
            ])->all();
            $this->horarios->replace($user, $newHistory, $blocks);

            $request->update([
                'estado' => 'APROBADA',
                'fecha_resolucion' => now(),
                'resuelto_por' => $scope->accountId,
                'observacion_resolucion' => $observation,
                'historial_nuevo_id' => $newHistory->id,
            ]);

            $this->notifyResolution($request);

            return $this->loadRelations($request->refresh());
        });
    }

    private function notifyResolution(SolicitudCambioHorario $request): void
    {
        $userId = CuentaAcceso::query()
            ->whereKey($request->created_by)
            ->value('user_id');

        if ($userId === null) {
            return;
        }

        [$type, $title, $message] = match ($request->estado) {
            'APROBADA' => [
                'cambio_horario_aprobado',
                'Cambio de horario aprobado',
                sprintf(
                    'Tu solicitud fue aprobada. El nuevo horario entrará en vigencia el %s.',
                    CarbonImmutable::parse($request->fecha_efectiva)->format('d/m/Y'),
                ),
            ],
            'RECHAZADA' => [
                'cambio_horario_rechazado',
                'Cambio de horario rechazado',
                sprintf('Tu solicitud fue rechazada. Motivo: %s', $request->observacion_resolucion),
            ],
            'REQUIERE_CORRECCION' => [
                'cambio_horario_correccion',
                'Tu solicitud requiere correcciones',
                sprintf(
                    'Revisa la observación y presenta una nueva solicitud: %s',
                    $request->observacion_resolucion,
                ),
            ],
        };

        NotificacionAsistencia::query()->updateOrCreate(
            ['clave' => sprintf('cambio-horario:%d:%s', $request->id, $request->estado)],
            [
                'user_id' => $userId,
                'asistencia_id' => null,
                'tipo' => $type,
                'titulo' => $title,
                'mensaje' => $message,
                'read_at' => null,
                'dismissed_at' => null,
            ],
        );
    }

    private function activeAccount(User $user): CuentaAcceso
    {
        $account = CuentaAcceso::query()
            ->where('user_id', $user->id)
            ->where('activo', true)
            ->first();

        if ($account === null) {
            throw ValidationException::withMessages([
                'cuenta' => 'Tu cuenta institucional no está activa o configurada.',
            ]);
        }

        return $account;
    }

    /**
     * @return array{can_create: bool, reason: ?string, available_from: ?string, message: ?string}
     */
    private function creationEligibility(int $memberId): array
    {
        $hasPending = SolicitudCambioHorario::query()
            ->where('integrante_id', $memberId)
            ->where('estado', 'PENDIENTE')
            ->exists();

        if ($hasPending) {
            return [
                'can_create' => false,
                'reason' => 'pending',
                'available_from' => null,
                'message' => 'Ya tienes una solicitud de cambio de horario pendiente.',
            ];
        }

        $lastApproval = SolicitudCambioHorario::query()
            ->where('integrante_id', $memberId)
            ->where('estado', 'APROBADA')
            ->orderByDesc('fecha_efectiva')
            ->orderByDesc('id')
            ->first(['fecha_efectiva']);

        $availableFrom = $lastApproval?->fecha_efectiva
            ? CarbonImmutable::parse($lastApproval->fecha_efectiva)
                ->startOfDay()
                ->addDays(self::CREATION_COOLDOWN_DAYS)
            : null;

        if ($availableFrom !== null && now()->startOfDay()->lt($availableFrom)) {
            $availableDate = $availableFrom->toDateString();

            return [
                'can_create' => false,
                'reason' => 'cooldown',
                'available_from' => $availableDate,
                'message' => sprintf(
                    'Tu horario aprobado debe permanecer vigente durante 15 días. Podrás enviar una nueva solicitud desde el %s.',
                    $availableFrom->format('d/m/Y'),
                ),
            ];
        }

        return [
            'can_create' => true,
            'reason' => null,
            'available_from' => null,
            'message' => null,
        ];
    }

    private function baseQuery()
    {
        return SolicitudCambioHorario::query()->with([
            'integrante.persona',
            'historialAnterior.cargo.area',
            'detalle' => fn ($query) => $query->orderBy('dia_semana')->orderBy('hora_inicio'),
        ]);
    }

    private function loadRelations(SolicitudCambioHorario $request): SolicitudCambioHorario
    {
        return $request->load([
            'integrante.persona',
            'historialAnterior.cargo.area',
            'detalle' => fn ($query) => $query->orderBy('dia_semana')->orderBy('hora_inicio'),
        ]);
    }
}
