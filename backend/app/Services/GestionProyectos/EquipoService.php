<?php

namespace App\Services\GestionProyectos;

use App\Data\Auth\AuthorizationScope;
use App\Models\GestionProyectos\Convocatoria;
use App\Models\GestionProyectos\Equipo;
use App\Models\GestionProyectos\EquipoIntegranteHistorial;
use App\Models\Integrante;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use App\Services\Profile\AvatarService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EquipoService
{
    private const PROJECT_AREA = 'GESTIÓN DE PROYECTOS';

    private const LEADER_CARGO = 'LÍDER DE GESTIÓN DE PROYECTOS';

    private const MEMBER_CARGO = 'MIEMBRO DE GESTIÓN DE PROYECTOS';

    private const RELATIONS = [
        'area:id,nombre',
        'integrantes.persona:id,nombres,apellidos,correo',
        'integrantes.historiales.cargo:id,nombre,area_id',
        'integrantes.historiales.horarios:id,historial_id,dia_semana,hora_inicio,hora_fin',
    ];

    public function __construct(
        private readonly InstitutionalAuthorizationService $authorization
    ) {}

    public function list(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['gp.equipos.ver']);

        return Equipo::query()
            ->with(self::RELATIONS)
            ->when(
                ! $scope->global,
                fn ($query) => $query->where('area_id', $scope->areaId)
            )
            ->orderBy('nombre')
            ->get();
    }

    public function candidates(User $user): array
    {
        $scope = $this->authorization->scope(
            $user,
            ['gp.equipos.crear', 'gp.equipos.editar']
        );

        $integrantes = $this->eligibleIntegrantes($scope);

        $assignments = DB::table('gp_equipo_integrantes as gei')
            ->join('gp_equipos as ge', 'ge.id', '=', 'gei.equipo_id')
            ->whereIn('gei.integrante_id', $integrantes->pluck('id'))
            ->select(
                'gei.integrante_id',
                'ge.id as equipo_id',
                'ge.nombre as equipo_nombre',
                'gei.rol'
            )
            ->get()
            ->keyBy('integrante_id');

        $avatarService = app(AvatarService::class);

        return $integrantes
            ->map(function (Integrante $item) use (
                $assignments,
                $avatarService
            ): array {
                $history = $item->historiales->firstWhere('estado', 'Activo');
                $assignment = $assignments->get($item->id);

                return [
                    'id' => $item->id,
                    'nombre' => trim(
                        ($item->persona?->nombres ?? '')
                        . ' '
                        . ($item->persona?->apellidos ?? '')
                    ),
                    'correo' => $item->persona?->correo,
                    'avatar_path' => $item->avatar_path,
                    'avatar_url' => $avatarService->url($item->avatar_path),
                    'area_id' => $history?->cargo?->area_id,
                    'area' => $history?->cargo?->area?->nombre,
                    'cargo' => $history?->cargo?->nombre,
                    'equipo_id' => $assignment?->equipo_id,
                    'equipo_nombre' => $assignment?->equipo_nombre,
                    'rol_equipo' => $assignment?->rol,
                    'horarios' => $this->scheduleBlocks($history),
                ];
            })
            ->values()
            ->all();
    }

    public function context(User $user): array
    {
        $this->authorization->scope(
            $user,
            ['gp.equipos.ver', 'gp.convocatorias.ver']
        );

        $membership = DB::table('cuentas_acceso as ca')
            ->join('integrantes as i', 'i.persona_id', '=', 'ca.persona_id')
            ->leftJoin(
                'gp_equipo_integrantes as gei',
                'gei.integrante_id',
                '=',
                'i.id'
            )
            ->leftJoin(
                'gp_equipos as ge',
                fn ($join) => $join
                    ->on('ge.id', '=', 'gei.equipo_id')
                    ->where('ge.activo', true)
            )
            ->where('ca.user_id', $user->id)
            ->where('ca.activo', true)
            ->where('i.estado', 'Activo')
            ->select(
                'ge.id as equipo_id',
                'ge.nombre as equipo_nombre',
                'gei.rol'
            )
            ->first();

        return [
            'puede_registrar' => (bool) $membership?->equipo_id,
            'es_lider' => (bool) $membership?->equipo_id
                && $membership?->rol === 'lider',
            'equipo' => $membership?->equipo_id ? [
                'id' => $membership->equipo_id,
                'nombre' => $membership->equipo_nombre,
            ] : null,
        ];
    }

    public function create(User $user, array $data): Equipo
    {
        $scope = $this->authorization->scope(
            $user,
            ['gp.equipos.crear']
        );

        return $this->persist($scope, $data);
    }

    public function update(
        User $user,
        Equipo $equipo,
        array $data
    ): Equipo {
        $scope = $this->authorization->scope(
            $user,
            ['gp.equipos.editar']
        );

        $this->authorizeArea($scope, $equipo->area_id);

        return $this->persist($scope, $data, $equipo);
    }

    public function history(
        User $user,
        Equipo $equipo
    ): Collection {
        $scope = $this->authorization->scope(
            $user,
            ['gp.equipos.ver']
        );

        $this->authorizeArea($scope, $equipo->area_id);

        return EquipoIntegranteHistorial::query()
            ->with([
                'integrante.persona:id,nombres,apellidos,correo',
                'actor.persona:id,nombres,apellidos',
            ])
            ->where('equipo_id', $equipo->id)
            ->latest('created_at')
            ->latest('id')
            ->get();
    }

    public function setActive(
        User $user,
        Equipo $equipo,
        bool $active
    ): Equipo {
        $scope = $this->authorization->scope(
            $user,
            ['gp.equipos.editar']
        );

        $this->authorizeArea($scope, $equipo->area_id);

        return DB::transaction(function () use (
            $equipo,
            $active
        ): Equipo {
            $locked = Equipo::query()
                ->lockForUpdate()
                ->findOrFail($equipo->id);

            if ((bool) $locked->activo !== $active) {
                $locked->update(['activo' => $active]);
            }

            return $locked
                ->refresh()
                ->load(self::RELATIONS);
        });
    }

    public function metrics(User $user): array
    {
        $scope = $this->authorization->scope(
            $user,
            ['gp.equipos.ver_metricas']
        );

        $teams = Equipo::query()
            ->with(self::RELATIONS)
            ->when(
                ! $scope->global,
                fn ($query) => $query->where('area_id', $scope->areaId)
            )
            ->orderBy('nombre')
            ->get();

        $calls = Convocatoria::query()
            ->select([
                'id',
                'area_id',
                'equipo_id',
                'estado',
                'etapa',
                'fecha_registro',
                'created_at',
            ])
            ->with([
                'aprobacion:id,convocatoria_id,decision,decidido_at',
                'postulaciones:id,convocatoria_id,estado',
                'postulaciones.seguimientos:id,postulacion_id,estado',
            ])
            ->when(
                ! $scope->global,
                fn ($query) => $query->where('area_id', $scope->areaId)
            )
            ->orderBy('id')
            ->get();

        return [
            'equipos' => $teams,

            'convocatorias' => $calls
                ->map(fn (Convocatoria $call): array => [
                    'id' => $call->id,
                    'equipo_id' => $call->equipo_id,
                    'estado' => $call->estado,
                    'etapa' => $call->etapa,
                    'fecha_registro' => $call->fecha_registro?->format('Y-m-d'),
                    'created_at' => $call->created_at?->toISOString(),

                    'aprobacion' => $call->aprobacion ? [
                        'decision' => $call->aprobacion->decision,
                        'decidido_at' => $call->aprobacion->decidido_at?->toISOString(),
                    ] : null,

                    'postulaciones' => $call->postulaciones
                        ->map(fn ($postulation): array => [
                            'id' => $postulation->id,
                            'estado' => $postulation->estado,
                            'seguimientos' => $postulation->seguimientos
                                ->map(fn ($followUp): array => [
                                    'id' => $followUp->id,
                                    'estado' => $followUp->estado,
                                ])
                                ->values()
                                ->all(),
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function persist(
        AuthorizationScope $scope,
        array $data,
        ?Equipo $equipo = null
    ): Equipo {
        $memberIds = array_values(
            array_unique(
                array_map(
                    'intval',
                    $data['integrante_ids'] ?? []
                )
            )
        );

        $leaderId = (int) $data['lider_integrante_id'];

        $memberIds = array_values(
            array_diff($memberIds, [$leaderId])
        );

        $allIds = [$leaderId, ...$memberIds];

        $eligible = $this->eligibleIntegrantes($scope)
            ->whereIn('id', $allIds);

        $leader = $eligible->firstWhere('id', $leaderId);

        if (
            $leader === null
            || $this->activeCargoName($leader) !== self::LEADER_CARGO
        ) {
            throw ValidationException::withMessages([
                'lider_integrante_id' =>
                    'El líder debe tener el rol INTEGRANTE y el cargo LÍDER DE GESTIÓN DE PROYECTOS.',
            ]);
        }

        $members = $eligible->whereIn('id', $memberIds);

        if (
            $members->count() !== count($memberIds)
            || $members->contains(
                fn (Integrante $member) =>
                    $this->activeCargoName($member) !== self::MEMBER_CARGO
            )
        ) {
            throw ValidationException::withMessages([
                'integrante_ids' =>
                    'Los integrantes deben tener el rol INTEGRANTE y el cargo MIEMBRO DE GESTIÓN DE PROYECTOS.',
            ]);
        }

        $areas = $eligible
            ->map(
                fn (Integrante $item) =>
                    $item->historiales
                        ->firstWhere('estado', 'Activo')
                        ?->cargo
                        ?->area_id
            )
            ->unique();

        if ($areas->count() !== 1 || ! $areas->first()) {
            throw ValidationException::withMessages([
                'integrante_ids' =>
                    'El líder y los integrantes deben pertenecer a la misma área.',
            ]);
        }

        $areaId = (int) $areas->first();

        $this->authorizeArea($scope, $areaId);

        if ($equipo && (int) $equipo->area_id !== $areaId) {
            throw ValidationException::withMessages([
                'integrante_ids' =>
                    'El equipo no puede trasladarse a otra área; selecciona integrantes de su área actual.',
            ]);
        }

        $incompatible = $eligible
            ->whereIn('id', $memberIds)
            ->filter(
                fn (Integrante $member) =>
                    $this->sharedMinutes($leader, $member) === 0
            )
            ->map(
                fn (Integrante $member) =>
                    trim(
                        ($member->persona?->nombres ?? '')
                        . ' '
                        . ($member->persona?->apellidos ?? '')
                    )
            )
            ->values();

        if ($incompatible->isNotEmpty()) {
            throw ValidationException::withMessages([
                'integrante_ids' =>
                    'El líder debe compartir al menos un bloque de horario con cada integrante. Sin coincidencia: '
                    . $incompatible->implode(', ')
                    . '.',
            ]);
        }

        return DB::transaction(
            function () use (
                $scope,
                $data,
                $equipo,
                $leaderId,
                $memberIds,
                $allIds,
                $areaId
            ): Equipo {
                $previousAssignments = collect();

                if ($equipo) {
                    $equipo = Equipo::query()
                        ->lockForUpdate()
                        ->findOrFail($equipo->id);

                    $previousAssignments = DB::table(
                        'gp_equipo_integrantes'
                    )
                        ->where('equipo_id', $equipo->id)
                        ->pluck('rol', 'integrante_id');
                }

                $assignments = collect([
                    $leaderId => 'lider',
                ]);

                foreach ($memberIds as $memberId) {
                    $assignments->put(
                        $memberId,
                        'integrante'
                    );
                }

                $assignmentsChanged =
                    $previousAssignments->count()
                    !== $assignments->count()
                    || $previousAssignments->contains(
                        fn (string $role, $integranteId) =>
                            $assignments->get((int) $integranteId)
                            !== $role
                    );

                if (
                    $equipo
                    && ! $equipo->activo
                    && $assignmentsChanged
                ) {
                    throw ValidationException::withMessages([
                        'integrante_ids' =>
                            'No se pueden cambiar asignaciones de un equipo inactivo. Reactívalo primero.',
                    ]);
                }

                $duplicateName = Equipo::query()
                    ->where('area_id', $areaId)
                    ->whereRaw(
                        'LOWER(nombre) = ?',
                        [mb_strtolower(trim($data['nombre']), 'UTF-8')]
                    )
                    ->when(
                        $equipo,
                        fn ($query) =>
                            $query->where('id', '!=', $equipo->id)
                    )
                    ->exists();

                if ($duplicateName) {
                    throw ValidationException::withMessages([
                        'nombre' =>
                            'Ya existe un equipo con ese nombre en el área.',
                    ]);
                }

                $conflicts = DB::table('gp_equipo_integrantes')
                    ->whereIn('integrante_id', $allIds)
                    ->when(
                        $equipo,
                        fn ($query) =>
                            $query->where('equipo_id', '!=', $equipo->id)
                    )
                    ->exists();

                if ($conflicts) {
                    throw ValidationException::withMessages([
                        'integrante_ids' =>
                            'Uno o más integrantes ya pertenecen a otro equipo.',
                    ]);
                }

                if ($equipo) {
                    $equipo->update([
                        'nombre' => trim($data['nombre']),
                        'area_id' => $areaId,
                    ]);
                } else {
                    $equipo = Equipo::query()->create([
                        'nombre' => trim($data['nombre']),
                        'area_id' => $areaId,
                        'activo' => true,
                        'creado_por' => $scope->accountId,
                    ]);
                }

                $syncAssignments = $assignments
                    ->map(
                        fn (string $role): array => [
                            'rol' => $role,
                        ]
                    )
                    ->all();

                $equipo
                    ->integrantes()
                    ->sync($syncAssignments);

                $this->recordMembershipChanges(
                    $equipo,
                    $previousAssignments,
                    $assignments,
                    $scope->accountId
                );

                $personaIds = Integrante::query()
                    ->whereIn('id', $allIds)
                    ->pluck('persona_id');

                $accountIds = DB::table('cuentas_acceso')
                    ->whereIn('persona_id', $personaIds)
                    ->pluck('id');

                if ($equipo->activo) {
                    DB::table('gp_convocatorias')
                        ->whereNull('equipo_id')
                        ->where('area_id', $areaId)
                        ->whereIn('registrada_por', $accountIds)
                        ->update([
                            'equipo_id' => $equipo->id,
                            'updated_at' => now(),
                        ]);
                }

                return $equipo
                    ->refresh()
                    ->load(self::RELATIONS);
            }
        );
    }

    private function recordMembershipChanges(
        Equipo $equipo,
        $previous,
        $current,
        string $accountId
    ): void {
        foreach ($previous as $integranteId => $previousRole) {
            $currentRole = $current->get((int) $integranteId);

            if ($currentRole === null) {
                EquipoIntegranteHistorial::query()->create([
                    'equipo_id' => $equipo->id,
                    'integrante_id' => $integranteId,
                    'accion' => 'retirado',
                    'rol_anterior' => $previousRole,
                    'realizado_por' => $accountId,
                ]);
            } elseif ($currentRole !== $previousRole) {
                EquipoIntegranteHistorial::query()->create([
                    'equipo_id' => $equipo->id,
                    'integrante_id' => $integranteId,
                    'accion' => 'cambio_rol',
                    'rol_anterior' => $previousRole,
                    'rol_nuevo' => $currentRole,
                    'realizado_por' => $accountId,
                ]);
            }
        }

        foreach ($current as $integranteId => $currentRole) {
            if (! $previous->has((int) $integranteId)) {
                EquipoIntegranteHistorial::query()->create([
                    'equipo_id' => $equipo->id,
                    'integrante_id' => $integranteId,
                    'accion' => 'asignado',
                    'rol_nuevo' => $currentRole,
                    'realizado_por' => $accountId,
                ]);
            }
        }
    }

    private function eligibleIntegrantes(
        AuthorizationScope $scope
    ): Collection {
        return Integrante::query()
            ->with([
                'persona:id,nombres,apellidos,correo',
                'historiales.cargo.area:id,nombre',
                'historiales.horarios:id,historial_id,dia_semana,hora_inicio,hora_fin',
            ])
            ->where('estado', 'Activo')
            ->whereHas(
                'persona.cuentaAcceso',
                fn ($query) => $query->where('activo', true)
            )
            ->whereHas(
                'historiales',
                function ($query) use ($scope): void {
                    $query
                        ->where('estado', 'Activo')
                        ->whereHas(
                            'cargo',
                            function ($cargo) use ($scope): void {
                                $cargo
                                    ->where('activo', true)
                                    ->whereIn(
                                        'nombre',
                                        [
                                            self::LEADER_CARGO,
                                            self::MEMBER_CARGO,
                                        ]
                                    )
                                    ->whereHas(
                                        'role',
                                        fn ($role) => $role
                                            ->where(
                                                'codigo',
                                                'integrante'
                                            )
                                            ->where('activo', true)
                                    )
                                    ->whereHas(
                                        'area',
                                        fn ($area) => $area
                                            ->where(
                                                'nombre',
                                                self::PROJECT_AREA
                                            )
                                    )
                                    ->when(
                                        ! $scope->global,
                                        fn ($item) =>
                                            $item->where(
                                                'area_id',
                                                $scope->areaId
                                            )
                                    );
                            }
                        );
                }
            )
            ->orderBy('id')
            ->get();
    }

    private function activeCargoName(
        Integrante $integrante
    ): ?string {
        return $integrante
            ->historiales
            ->firstWhere('estado', 'Activo')
            ?->cargo
            ?->nombre;
    }

    private function scheduleBlocks($history): array
    {
        if (! $history) {
            return [];
        }

        return $history
            ->horarios
            ->sortBy(
                fn ($block) =>
                    sprintf(
                        '%d-%s',
                        $block->dia_semana,
                        $block->hora_inicio
                    )
            )
            ->map(
                fn ($block): array => [
                    'dia_semana' => (int) $block->dia_semana,
                    'hora_inicio' => substr(
                        (string) $block->hora_inicio,
                        0,
                        5
                    ),
                    'hora_fin' => substr(
                        (string) $block->hora_fin,
                        0,
                        5
                    ),
                ]
            )
            ->values()
            ->all();
    }

    private function sharedMinutes(
        Integrante $leader,
        Integrante $member
    ): int {
        $leaderHistory = $leader
            ->historiales
            ->firstWhere('estado', 'Activo');

        $memberHistory = $member
            ->historiales
            ->firstWhere('estado', 'Activo');

        $minutes = 0;

        foreach (
            $this->scheduleBlocks($leaderHistory)
            as $leaderBlock
        ) {
            foreach (
                $this->scheduleBlocks($memberHistory)
                as $memberBlock
            ) {
                if (
                    $leaderBlock['dia_semana']
                    !== $memberBlock['dia_semana']
                ) {
                    continue;
                }

                $start = max(
                    $this->minutesOfDay(
                        $leaderBlock['hora_inicio']
                    ),
                    $this->minutesOfDay(
                        $memberBlock['hora_inicio']
                    )
                );

                $end = min(
                    $this->minutesOfDay(
                        $leaderBlock['hora_fin']
                    ),
                    $this->minutesOfDay(
                        $memberBlock['hora_fin']
                    )
                );

                $minutes += max(0, $end - $start);
            }
        }

        return $minutes;
    }

    private function minutesOfDay(string $time): int
    {
        [$hours, $minutes] = array_map(
            'intval',
            explode(':', $time)
        );

        return ($hours * 60) + $minutes;
    }

    private function authorizeArea(
        AuthorizationScope $scope,
        int $areaId
    ): void {
        if (
            ! $scope->global
            && (int) $scope->areaId !== $areaId
        ) {
            throw new AuthorizationException(
                'No puedes gestionar equipos fuera del alcance de tu área.'
            );
        }
    }
}