<?php

namespace App\Services\GestionProyectos;

use App\Data\Auth\AuthorizationScope;
use App\Models\GestionProyectos\Convocatoria;
use App\Models\GestionProyectos\ConvocatoriaEvaluacion;
use App\Models\GestionProyectos\ConvocatoriaHistorial;
use App\Models\GestionProyectos\FuenteFinanciamiento;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConvocatoriaService
{
    private const RELATIONS = [
        'fuente:id,nombre,tipo',
        'equipo:id,nombre,area_id',
        'registrante.persona.integrantes:id,persona_id,avatar_path,estado',
        'evaluaciones.revisor.persona:id,nombres,apellidos',
        'aprobacion.decisor.persona:id,nombres,apellidos',
        'postulaciones.enviada.persona:id,nombres,apellidos',
        'postulaciones.seguimientos',
    ];

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function listFuentes(User $user): Collection
    {
        $this->authorization->scope($user, ['gp.convocatorias.ver']);

        return FuenteFinanciamiento::query()->where('activo', true)->orderBy('nombre')->get();
    }

    public function createFuente(User $user, array $data): FuenteFinanciamiento
    {
        $this->authorization->scope($user, ['gp.convocatorias.crear']);
        $duplicate = FuenteFinanciamiento::query()->whereRaw('LOWER(nombre) = ?', [mb_strtolower($data['nombre'], 'UTF-8')])->first();
        if ($duplicate) {
            if (! $duplicate->activo) {
                $duplicate->update($data + ['activo' => true]);

                return $duplicate->refresh();
            }
            throw ValidationException::withMessages(['nombre' => 'Ya existe una fuente de financiamiento con ese nombre.']);
        }

        return FuenteFinanciamiento::query()->create($data + ['activo' => true]);
    }

    public function list(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['gp.convocatorias.ver']);
        $leaderTeams = $this->leaderTeamIds($scope->accountId);
        $teamMembership = $this->authorization->teamMembership($scope->accountId);

        return Convocatoria::query()->with(self::RELATIONS)
            ->when(! $scope->global, fn ($query) => $query->where('area_id', $scope->areaId))
            ->when(! $scope->accessTotal && $teamMembership?->rol === 'lider', fn ($query) => $query->where('equipo_id', $teamMembership->equipo_id))
            ->when(! $scope->accessTotal && $teamMembership?->rol === 'integrante', fn ($query) => $query
                ->where('equipo_id', $teamMembership->equipo_id)
                ->where('registrada_por', $scope->accountId))
            ->latest('created_at')->get()
            ->each(fn (Convocatoria $item) => $item->setAttribute(
                'primer_filtro_autorizado',
                $scope->accessTotal || ($item->equipo_id !== null && $leaderTeams->contains((int) $item->equipo_id))
            ));
    }

    public function find(User $user, Convocatoria $convocatoria): Convocatoria
    {
        $scope = $this->authorizeRecord($user, ['gp.convocatorias.ver'], $convocatoria);
        if (! $scope->accessTotal) {
            $this->assertTeamVisibility($scope->accountId, $convocatoria);
        }
        $loaded = $convocatoria->load([...self::RELATIONS, 'historial.actor.persona:id,nombres,apellidos']);
        $loaded->setAttribute(
            'primer_filtro_autorizado',
            $scope->accessTotal || ($loaded->equipo_id !== null && $this->leaderTeamIds($scope->accountId)->contains((int) $loaded->equipo_id))
        );

        return $loaded;
    }

    public function create(User $user, array $data): Convocatoria
    {
        $scope = $this->authorization->scope($user, ['gp.convocatorias.crear']);
        $membership = $this->membership($scope->accountId);
        if (! $membership) {
            throw ValidationException::withMessages(['equipo' => 'Debes estar asignado a un equipo antes de registrar una convocatoria.']);
        }
        if (! $scope->global && (int) $scope->areaId !== (int) $membership->area_id) {
            throw new AuthorizationException('El equipo no pertenece al alcance de tu Ã¡rea.');
        }

        return DB::transaction(function () use ($data, $scope, $membership): Convocatoria {
            $convocatoria = Convocatoria::query()->create($data + [
                'area_id' => $membership->area_id, 'equipo_id' => $membership->equipo_id,
                'registrada_por' => $scope->accountId, 'fecha_registro' => now()->toDateString(),
                'estado' => 'registrada', 'etapa' => 'deteccion',
            ]);
            $this->recordHistory($convocatoria, $scope, 'creada');

            return $convocatoria->load(self::RELATIONS);
        });
    }

    public function update(User $user, Convocatoria $convocatoria, array $data): Convocatoria
    {
        $scope = $this->authorizeRecord($user, ['gp.convocatorias.editar'], $convocatoria);

        return DB::transaction(function () use ($convocatoria, $data, $scope): Convocatoria {
            $locked = Convocatoria::query()->lockForUpdate()->findOrFail($convocatoria->id);
            if (in_array($locked->estado, ['cerrada', 'archivada'], true)) {
                throw ValidationException::withMessages(['convocatoria' => 'Una convocatoria cerrada o archivada no puede editarse.']);
            }
            if (ConvocatoriaEvaluacion::query()->where('convocatoria_id', $locked->id)->where('tipo_filtro', 'primer_filtro')->exists()) {
                throw ValidationException::withMessages(['convocatoria' => 'La convocatoria ya no se puede editar porque el primer filtro fue revisado.']);
            }
            $locked->update($data);
            $this->recordHistory($locked, $scope, 'editada');

            return $locked->refresh()->load(self::RELATIONS);
        });
    }

    public function primerFiltro(User $user, Convocatoria $convocatoria): Convocatoria
    {
        $this->authorizeLeader($user, $convocatoria);
        $convocatoria->setAttribute('primer_filtro_autorizado', true);

        return $convocatoria->load(self::RELATIONS);
    }

    public function savePrimerFiltro(User $user, Convocatoria $convocatoria, array $evaluaciones): Convocatoria
    {
        $scope = $this->authorizeLeader($user, $convocatoria);
        $expected = collect(['internacional', 'organizacion_admitida', 'alianzas', 'tipo_proyecto', 'territorio', 'fecha_cierre', 'alineacion_sectorial', 'rango_financiamiento'])->sort()->values();
        if (collect($evaluaciones)->pluck('criterio_codigo')->sort()->values()->all() !== $expected->all()) {
            throw ValidationException::withMessages(['evaluaciones' => 'Debes calificar una vez cada criterio del primer filtro.']);
        }

        return DB::transaction(function () use ($convocatoria, $evaluaciones, $scope): Convocatoria {
            $locked = Convocatoria::query()->lockForUpdate()->findOrFail($convocatoria->id);
            if (! $scope->accessTotal) {
                $this->assertLeader($scope->accountId, $locked);
            }
            if ($locked->estado !== 'registrada' || $locked->etapa !== 'deteccion') {
                throw ValidationException::withMessages(['convocatoria' => 'La convocatoria ya no admite cambios en el primer filtro.']);
            }
            if (ConvocatoriaEvaluacion::query()->where('convocatoria_id', $locked->id)->where('tipo_filtro', 'primer_filtro')->exists()) {
                throw ValidationException::withMessages(['evaluaciones' => 'El primer filtro ya fue guardado y no se puede modificar.']);
            }
            foreach ($evaluaciones as $item) {
                ConvocatoriaEvaluacion::query()->create([
                    'convocatoria_id' => $locked->id, 'tipo_filtro' => 'primer_filtro',
                    'criterio_codigo' => $item['criterio_codigo'], 'estado_revision' => $item['estado_revision'],
                    'observacion' => $item['observacion'] ?? null, 'revisado_por' => $scope->accountId, 'revisado_at' => now(),
                ]);
            }
            $passed = collect($evaluaciones)->every(fn (array $item) => $item['estado_revision'] === 'cumple');
            [$previousState, $previousStage] = [$locked->estado, $locked->etapa];
            $locked->update(['estado' => $passed ? 'en_revision' : 'no_viable', 'etapa' => $passed ? 'segundo_filtro' : 'cierre']);
            ConvocatoriaHistorial::query()->create([
                'convocatoria_id' => $locked->id, 'accion' => 'primer_filtro_completado',
                'estado_anterior' => $previousState, 'estado_nuevo' => $locked->estado,
                'etapa_anterior' => $previousStage, 'etapa_nueva' => $locked->etapa, 'actor_id' => $scope->accountId,
            ]);

            return $locked->refresh()->load(self::RELATIONS);
        });
    }

    public function segundoFiltro(User $user, Convocatoria $convocatoria): Convocatoria
    {
        $this->authorizeSecondFilter($user, $convocatoria);

        return $convocatoria->load(self::RELATIONS);
    }

    public function saveSegundoFiltro(User $user, Convocatoria $convocatoria, array $evaluaciones): Convocatoria
    {
        $scope = $this->authorizeSecondFilter($user, $convocatoria);
        $expected = collect(['internacional', 'organizacion_admitida', 'alianzas', 'tipo_proyecto', 'territorio', 'fecha_cierre', 'alineacion_sectorial', 'rango_financiamiento'])->sort()->values();
        if (collect($evaluaciones)->pluck('criterio_codigo')->sort()->values()->all() !== $expected->all()) {
            throw ValidationException::withMessages(['evaluaciones' => 'Debes calificar una vez cada criterio del segundo filtro.']);
        }

        return DB::transaction(function () use ($convocatoria, $evaluaciones, $scope): Convocatoria {
            $locked = Convocatoria::query()->lockForUpdate()->findOrFail($convocatoria->id);
            $this->assertPassedFirstFilter($locked);
            if (ConvocatoriaEvaluacion::query()->where('convocatoria_id', $locked->id)->where('tipo_filtro', 'segundo_filtro')->exists()) {
                throw ValidationException::withMessages(['evaluaciones' => 'El segundo filtro ya fue guardado y no se puede modificar.']);
            }
            foreach ($evaluaciones as $item) {
                ConvocatoriaEvaluacion::query()->create([
                    'convocatoria_id' => $locked->id, 'tipo_filtro' => 'segundo_filtro',
                    'criterio_codigo' => $item['criterio_codigo'], 'estado_revision' => $item['estado_revision'],
                    'observacion' => $item['observacion'] ?? null, 'revisado_por' => $scope->accountId, 'revisado_at' => now(),
                ]);
            }
            $passed = collect($evaluaciones)->every(fn (array $item) => $item['estado_revision'] === 'cumple');
            [$previousState, $previousStage] = [$locked->estado, $locked->etapa];
            $locked->update(['estado' => $passed ? 'preseleccionada' : 'no_viable', 'etapa' => $passed ? 'aprobacion' : 'cierre']);
            ConvocatoriaHistorial::query()->create([
                'convocatoria_id' => $locked->id, 'accion' => 'segundo_filtro_completado',
                'estado_anterior' => $previousState, 'estado_nuevo' => $locked->estado,
                'etapa_anterior' => $previousStage, 'etapa_nueva' => $locked->etapa, 'actor_id' => $scope->accountId,
            ]);

            return $locked->refresh()->load(self::RELATIONS);
        });
    }

    private function authorizeRecord(User $user, array $permissions, Convocatoria $convocatoria): AuthorizationScope
    {
        $scope = $this->authorization->scope($user, $permissions);
        if (! $scope->global && (int) $scope->areaId !== (int) $convocatoria->area_id) {
            throw new AuthorizationException('No puedes gestionar convocatorias fuera del alcance de tu Ã¡rea.');
        }

        return $scope;
    }

    private function membership(string $accountId): ?object
    {
        return DB::table('cuentas_acceso as ca')->join('integrantes as i', 'i.persona_id', '=', 'ca.persona_id')
            ->join('gp_equipo_integrantes as gei', 'gei.integrante_id', '=', 'i.id')
            ->join('gp_equipos as ge', fn ($join) => $join->on('ge.id', '=', 'gei.equipo_id')->where('ge.activo', true))
            ->where('ca.id', $accountId)->where('ca.activo', true)->where('i.estado', 'Activo')
            ->select('ge.id as equipo_id', 'ge.area_id', 'gei.rol')->first();
    }

    private function leaderTeamIds(string $accountId)
    {
        return DB::table('cuentas_acceso as ca')->join('integrantes as i', 'i.persona_id', '=', 'ca.persona_id')
            ->join('gp_equipo_integrantes as gei', 'gei.integrante_id', '=', 'i.id')->join('gp_equipos as ge', 'ge.id', '=', 'gei.equipo_id')
            ->where('ca.id', $accountId)->where('ca.activo', true)->where('ge.activo', true)->where('gei.rol', 'lider')
            ->pluck('ge.id')->map(fn ($id) => (int) $id);
    }

    private function assertTeamVisibility(string $accountId, Convocatoria $convocatoria): void
    {
        $membership = $this->authorization->teamMembership($accountId);
        if ($membership === null) {
            return;
        }

        $isVisible = (int) $membership->equipo_id === (int) $convocatoria->equipo_id
            && ($membership->rol === 'lider' || $convocatoria->registrada_por === $accountId);

        if (! $isVisible) {
            throw new AuthorizationException('No tienes acceso a esta convocatoria.');
        }
    }

    private function authorizeLeader(User $user, Convocatoria $convocatoria): AuthorizationScope
    {
        $scope = $this->authorization->scope($user, ['gp.convocatorias.evaluar']);
        if (! $scope->accessTotal) {
            $this->assertLeader($scope->accountId, $convocatoria);
        }

        return $scope;
    }

    private function assertLeader(string $accountId, Convocatoria $convocatoria): void
    {
        if (! $convocatoria->equipo_id || ! $this->leaderTeamIds($accountId)->contains((int) $convocatoria->equipo_id)) {
            throw new AuthorizationException('Solo el lÃ­der del equipo de esta convocatoria puede realizar el primer filtro.');
        }
    }

    private function authorizeSecondFilter(User $user, Convocatoria $convocatoria): AuthorizationScope
    {
        $scope = $this->authorizeRecord($user, ['gp.convocatorias.revisar'], $convocatoria);
        $this->assertPassedFirstFilter($convocatoria);

        return $scope;
    }

    private function assertPassedFirstFilter(Convocatoria $convocatoria): void
    {
        $evaluations = ConvocatoriaEvaluacion::query()
            ->where('convocatoria_id', $convocatoria->id)
            ->where('tipo_filtro', 'primer_filtro')
            ->get(['criterio_codigo', 'estado_revision']);

        if (
            $convocatoria->etapa !== 'segundo_filtro'
            || $evaluations->count() !== 8
            || ! $evaluations->every(fn (ConvocatoriaEvaluacion $item) => $item->estado_revision === 'cumple')
        ) {
            throw ValidationException::withMessages([
                'convocatoria' => 'Solo se puede realizar el segundo filtro de convocatorias que aprobaron el primer filtro.',
            ]);
        }
    }

    private function recordHistory(Convocatoria $convocatoria, AuthorizationScope $scope, string $action): void
    {
        ConvocatoriaHistorial::query()->create([
            'convocatoria_id' => $convocatoria->id, 'accion' => $action,
            'estado_nuevo' => $convocatoria->estado, 'etapa_nueva' => $convocatoria->etapa, 'actor_id' => $scope->accountId,
        ]);
    }
}
