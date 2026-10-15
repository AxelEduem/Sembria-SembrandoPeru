<?php

namespace App\Services\Areas;

use App\Models\Area;
use App\Models\Cargo;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AreaService
{
    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function list(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['areas.ver']);

        return Area::query()
            ->when(! $scope->global, fn ($query) => $query->whereKey($scope->areaId))
            ->latest('created_at')
            ->get();
    }

    public function find(User $user, Area $area): Area
    {
        $this->authorization->authorizeArea($user, ['areas.ver'], $area->id);

        return $area;
    }

    public function create(User $user, array $data): Area
    {
        $scope = $this->authorization->scope($user, ['areas.crear']);
        if (! $scope->global) {
            throw new AuthorizationException('Solo un permiso global puede registrar nuevas áreas.');
        }

        $this->ensureUniqueName($data['nombre']);

        try {
            return Area::query()->create($data + ['activo' => true]);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                throw ValidationException::withMessages(['nombre' => 'Ya existe un área con ese nombre.']);
            }

            throw $exception;
        }
    }

    public function update(User $user, Area $area, array $data): Area
    {
        $this->authorization->authorizeArea($user, ['areas.editar'], $area->id);
        $this->ensureUniqueName($data['nombre'], $area->id);

        try {
            $area->update($data);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                throw ValidationException::withMessages(['nombre' => 'Ya existe un área con ese nombre.']);
            }

            throw $exception;
        }

        return $area->refresh();
    }

    public function setActive(User $user, Area $area, bool $active): Area
    {
        $this->authorization->authorizeArea($user, ['areas.desactivar'], $area->id);

        return DB::transaction(function () use ($area, $active): Area {
            $lockedArea = Area::query()->lockForUpdate()->findOrFail($area->id);

            if (! $active && Cargo::query()->where('area_id', $lockedArea->id)->where('activo', true)->exists()) {
                throw ValidationException::withMessages([
                    'activo' => 'No puedes desactivar esta área porque tiene cargos activos asociados. Desactiva primero sus cargos activos.',
                ]);
            }

            $lockedArea->update(['activo' => $active]);

            return $lockedArea->refresh();
        });
    }

    private function ensureUniqueName(string $name, ?int $exceptId = null): void
    {
        $query = Area::query()->whereRaw('LOWER(nombre) = ?', [mb_strtolower($name, 'UTF-8')]);
        if ($exceptId !== null) {
            $query->where('id', '<>', $exceptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages(['nombre' => 'Ya existe un área con ese nombre.']);
        }
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        return (string) $exception->getCode() === '23505'
            || ((string) $exception->getCode() === '23000'
                && str_contains(mb_strtolower($exception->getMessage()), 'unique'));
    }
}
