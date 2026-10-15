<?php

namespace App\Services\Integrantes;

use App\Models\Aplicacion;
use App\Models\Integrante;
use App\Models\IntegranteAplicacion;
use App\Models\IntegranteHistorial;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class IntegranteAccessService
{
    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function forIntegrante(User $user, Integrante $integrante)
    {
        $history = $integrante->historiales()->with('cargo')->latest('created_at')->latest('id')->firstOrFail();
        $this->authorization->authorizeArea($user, ['accesos.ver', 'accesos.gestionar'], $history->cargo->area_id);

        return $history->accesos()->where('activo', true)->with('aplicacion')->oldest()->get();
    }

    public function countForHistory(User $user, IntegranteHistorial $history): int
    {
        $history->loadMissing('cargo');
        $this->authorization->authorizeArea($user, ['accesos.ver', 'accesos.gestionar'], $history->cargo->area_id);

        return $history->accesos()->where('activo', true)->count();
    }

    public function assignments(User $user, bool $inactive = false, array $filters = [])
    {
        $permissions = $inactive
            ? ['accesos.ver_inactivos', 'accesos.ver_metricas']
            : ['accesos.ver', 'accesos.gestionar'];
        $scope = $this->authorization->scope($user, $permissions);
        $search = mb_strtolower(trim((string) ($filters['q'] ?? '')));

        return IntegranteAplicacion::query()
            ->where('activo', true)
            ->whereHas('historial.integrante', fn ($query) => $query->where('estado', $inactive ? 'Inactivo' : 'Activo'))
            ->when(! $scope->global, fn ($query) => $query->whereHas('historial.cargo', fn ($cargo) => $cargo->where('area_id', $scope->areaId)))
            ->when($search !== '', fn ($query) => $query->whereHas('historial.integrante.persona', function ($persona) use ($search): void {
                $pattern = "%{$search}%";

                $persona->where(function ($person) use ($pattern): void {
                    $person
                        ->whereRaw("LOWER(nombres || ' ' || apellidos) LIKE ?", [$pattern])
                        ->orWhereRaw('LOWER(correo) LIKE ?', [$pattern]);
                });
            }))
            ->when($filters['area'] ?? null, fn ($query, $area) => $query->whereHas('historial.cargo.area', fn ($areaQuery) => $areaQuery->where('nombre', $area)))
            ->when($filters['cargo'] ?? null, fn ($query, $cargo) => $query->whereHas('historial.cargo', fn ($cargoQuery) => $cargoQuery->where('nombre', $cargo)))
            ->when($filters['tipo'] ?? null, fn ($query, $type) => $query->whereHas('historial', fn ($history) => $history->where('tipo_integrante', $type)))
            ->when($filters['app'] ?? null, fn ($query, $applicationId) => $query->where('aplicacion_id', $applicationId))
            ->with(['aplicacion', 'historial.integrante.persona', 'historial.cargo.area'])
            ->latest()->get();
    }

    public function assign(User $user, int $applicationId, int $historyId): IntegranteAplicacion
    {
        return DB::transaction(function () use ($user, $applicationId, $historyId): IntegranteAplicacion {
            $history = IntegranteHistorial::query()->with('cargo')->findOrFail($historyId);
            $this->authorization->authorizeArea($user, ['accesos.gestionar'], $history->cargo->area_id);
            $application = Aplicacion::query()->lockForUpdate()->findOrFail($applicationId);
            if (! $application->activo) {
                throw ValidationException::withMessages(['aplicacion_id' => 'La aplicación está inactiva.']);
            }
            if ($application->area_id && $application->area_id !== $history->cargo->area_id) {
                throw ValidationException::withMessages(['aplicacion_id' => 'La aplicación no pertenece al área del integrante.']);
            }
            if (IntegranteAplicacion::query()->where('aplicacion_id', $applicationId)->where('activo', true)->count() >= $application->licencias_total) {
                throw ValidationException::withMessages(['aplicacion_id' => 'No hay licencias disponibles para esta aplicación.']);
            }

            $assignment = IntegranteAplicacion::query()->firstOrNew(['aplicacion_id' => $applicationId, 'historial_id' => $historyId]);
            if ($assignment->exists && $assignment->activo) {
                throw ValidationException::withMessages(['aplicacion_id' => 'El integrante ya tiene acceso a esta aplicación.']);
            }
            $assignment->fill(['activo' => true, 'fecha_retiro' => null, 'retirado_por' => null])->save();

            return $assignment->load(['aplicacion', 'historial.integrante.persona', 'historial.cargo.area']);
        });
    }

    public function revoke(User $user, IntegranteAplicacion $assignment): void
    {
        $assignment->loadMissing('historial.cargo');
        $scope = $this->authorization->authorizeArea($user, ['accesos.gestionar'], $assignment->historial->cargo->area_id);
        $assignment->update(['activo' => false, 'fecha_retiro' => now(), 'retirado_por' => $scope->accountId]);
    }
}
