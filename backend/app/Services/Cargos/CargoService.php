<?php

namespace App\Services\Cargos;

use App\Models\Area;
use App\Models\Cargo;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CargoService
{
    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function list(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['cargos.ver']);

        return Cargo::query()
            ->with(['area', 'role'])
            ->when(! $scope->global, fn ($query) => $query->where('area_id', $scope->areaId))
            ->latest('created_at')
            ->get();
    }

    public function find(User $user, Cargo $cargo): Cargo
    {
        $this->authorization->authorizeArea($user, ['cargos.ver'], $cargo->area_id);

        return $cargo->load(['area', 'role']);
    }

    public function create(User $user, array $data): Cargo
    {
        $this->authorization->authorizeArea($user, ['cargos.crear'], (int) $data['area_id']);
        $this->ensureActiveArea((int) $data['area_id']);
        $this->ensureUniqueActiveName($data['nombre'], (int) $data['area_id']);

        return DB::transaction(function () use ($data): Cargo {
            $cargo = Cargo::query()->create($data + ['activo' => true]);

            return $cargo->load(['area', 'role']);
        });
    }

    public function update(User $user, Cargo $cargo, array $data): Cargo
    {
        $this->authorization->authorizeArea($user, ['cargos.editar'], $cargo->area_id);
        $this->authorization->authorizeArea($user, ['cargos.editar'], (int) $data['area_id']);
        $this->ensureActiveArea((int) $data['area_id']);
        $this->ensureUniqueActiveName($data['nombre'], (int) $data['area_id'], $cargo->id);

        $cargo->update($data);

        return $cargo->refresh()->load(['area', 'role']);
    }

    public function setActive(User $user, Cargo $cargo, bool $active): Cargo
    {
        $this->authorization->authorizeArea($user, ['cargos.desactivar'], $cargo->area_id);

        return DB::transaction(function () use ($cargo, $active): Cargo {
            $lockedCargo = Cargo::query()->lockForUpdate()->findOrFail($cargo->id);

            if ($active) {
                $this->ensureActiveArea($lockedCargo->area_id);
                $this->ensureActiveAssignedRole($lockedCargo->rol_id);
                $this->ensureUniqueActiveName(
                    $lockedCargo->nombre,
                    $lockedCargo->area_id,
                    $lockedCargo->id,
                    'No se puede activar el cargo porque ya existe otro cargo activo con el mismo nombre en esta área.'
                );
            }

            $lockedCargo->update(['activo' => $active]);

            return $lockedCargo->refresh()->load(['area', 'role']);
        });
    }

    private function ensureActiveArea(int $areaId): void
    {
        if (! Area::query()->whereKey($areaId)->where('activo', true)->exists()) {
            throw ValidationException::withMessages([
                'area_id' => 'No puedes asignar un área inactiva al cargo.',
            ]);
        }

    }

    private function ensureActiveAssignedRole(?int $roleId): void
    {
        if ($roleId !== null && ! Role::query()->whereKey($roleId)->where('activo', true)->exists()) {
            throw ValidationException::withMessages([
                'rol_id' => 'No puedes activar un cargo asignado a un rol inactivo.',
            ]);
        }
    }

    private function ensureUniqueActiveName(
        string $name,
        int $areaId,
        ?int $exceptId = null,
        string $message = 'Ya existe un cargo con ese nombre en esta área.',
    ): void {
        $query = Cargo::query()
            ->where('area_id', $areaId)
            ->where('activo', true)
            ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($name, 'UTF-8')]);

        if ($exceptId !== null) {
            $query->where('id', '<>', $exceptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages(['nombre' => $message]);
        }
    }
}
