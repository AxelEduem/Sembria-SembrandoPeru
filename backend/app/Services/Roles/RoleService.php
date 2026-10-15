<?php

namespace App\Services\Roles;

use App\Models\Cargo;
use App\Models\Permiso;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoleService
{
    private const INTERNAL_PERMISSION_MODULES = ['equipos', 'convocatorias'];

    private const GLOBAL_ONLY_PERMISSION_CODES = [
        'areas.crear',
        'asistencia.gestionar_configuracion',
        'roles.crear',
        'roles.editar',
        'roles.desactivar',
        'roles.gestionar_permisos',
        'roles.gestionar_cargos',
    ];

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function list(User $user): Collection
    {
        $this->authorization->scope($user, [
            'roles.ver',
        ]);

        return Role::query()->latest('created_at')->latest('id')->get();
    }

    public function permissionCatalog(User $user): Collection
    {
        $this->authorization->scope($user, ['roles.gestionar_permisos']);

        return Permiso::query()
            ->where('activo', true)
            ->whereNotIn('modulo', self::INTERNAL_PERMISSION_MODULES)
            ->orderBy('modulo')
            ->orderByRaw("CASE WHEN accion = 'ver' THEN 0 ELSE 1 END")
            ->orderBy('nombre')
            ->get();
    }

    public function find(User $user, Role $role): Role
    {
        $this->authorization->scope($user, ['roles.ver']);

        return $role;
    }

    public function create(User $user, array $data): Role
    {
        $this->authorizeGlobal($user, ['roles.crear']);

        if ($data['acceso_total']) {
            $this->authorizeGlobal($user, ['roles.gestionar_permisos']);
        }

        $this->ensureUnique($data['codigo'], $data['nombre']);

        try {
            return Role::query()->create($data + ['activo' => true]);
        } catch (QueryException $exception) {
            $this->throwUniqueValidation($exception);
            throw $exception;
        }
    }

    public function update(User $user, Role $role, array $data): Role
    {
        $this->authorizeGlobal($user, ['roles.editar']);

        if ((bool) $role->acceso_total !== (bool) $data['acceso_total']) {
            $this->authorizeGlobal($user, ['roles.gestionar_permisos']);
        }

        $this->ensureUnique($data['codigo'], $data['nombre'], $role->id);

        try {
            $role->update($data);
        } catch (QueryException $exception) {
            $this->throwUniqueValidation($exception);
            throw $exception;
        }

        return $role->refresh();
    }

    public function setActive(User $user, Role $role, bool $active): Role
    {
        $this->authorizeGlobal($user, ['roles.desactivar']);

        return DB::transaction(function () use ($role, $active): Role {
            $lockedRole = Role::query()->lockForUpdate()->findOrFail($role->id);

            if (! $active && $lockedRole->cargos()->where('activo', true)->exists()) {
                throw ValidationException::withMessages([
                    'activo' => 'No puedes desactivar este rol porque tiene cargos activos asociados.',
                ]);
            }

            $lockedRole->update(['activo' => $active]);

            return $lockedRole->refresh();
        });
    }

    public function permissions(User $user, Role $role): Collection
    {
        $this->authorization->scope($user, ['roles.gestionar_permisos']);

        return $role->permisos()
            ->where('permisos.activo', true)
            ->whereNotIn('permisos.modulo', self::INTERNAL_PERMISSION_MODULES)
            ->orderBy('permisos.modulo')
            ->orderByRaw("CASE WHEN permisos.accion = 'ver' THEN 0 ELSE 1 END")
            ->orderBy('permisos.nombre')
            ->get();
    }

    public function cargos(User $user, Role $role): Collection
    {
        $this->authorizeGlobal($user, ['roles.gestionar_cargos']);

        return $this->cargoCatalog($role);
    }

    /** @param list<int> $cargoIds */
    public function replaceCargos(User $user, Role $role, array $cargoIds): Collection
    {
        $this->authorizeGlobal($user, ['roles.gestionar_cargos']);

        $selectedIds = collect($cargoIds)->map(fn ($id): int => (int) $id)->unique()->values();

        DB::transaction(function () use ($role, $selectedIds): void {
            $lockedRole = Role::query()->lockForUpdate()->findOrFail($role->id);

            $affectedCargos = Cargo::query()
                ->where(function ($query) use ($lockedRole, $selectedIds): void {
                    $query->where('rol_id', $lockedRole->id)
                        ->when(
                            $selectedIds->isNotEmpty(),
                            fn ($query) => $query->orWhereIn('id', $selectedIds),
                        );
                })
                ->lockForUpdate()
                ->get();

            $selectedCargos = $affectedCargos->whereIn('id', $selectedIds);

            if ($selectedCargos->contains(
                fn (Cargo $cargo): bool => $cargo->rol_id !== null
                    && (int) $cargo->rol_id !== $lockedRole->id
            )) {
                throw ValidationException::withMessages([
                    'cargo_ids' => 'Uno o más cargos seleccionados ya pertenecen a otro rol.',
                ]);
            }

            if (! $lockedRole->activo && $selectedCargos
                ->contains(fn (Cargo $cargo): bool => (int) $cargo->rol_id !== $lockedRole->id)) {
                throw ValidationException::withMessages([
                    'cargo_ids' => 'No puedes asignar nuevos cargos a un rol inactivo.',
                ]);
            }

            Cargo::query()
                ->where('rol_id', $lockedRole->id)
                ->when($selectedIds->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $selectedIds))
                ->update(['rol_id' => null]);

            if ($selectedIds->isNotEmpty()) {
                Cargo::query()->whereKey($selectedIds)->update(['rol_id' => $lockedRole->id]);
            }
        });

        return $this->cargoCatalog($role);
    }

    public function replacePermissions(
        User $user,
        Role $role,
        array $permissions,
        ?bool $accessTotal = null,
    ): Collection {
        $this->authorizeGlobal($user, ['roles.gestionar_permisos']);

        $targetAccessTotal = $accessTotal ?? (bool) $role->acceso_total;

        if ($accessTotal === null && $targetAccessTotal && $permissions !== []) {
            throw ValidationException::withMessages([
                'permisos' => 'Un rol con acceso total no necesita permisos individuales.',
            ]);
        }

        if ($targetAccessTotal) {
            if ($accessTotal !== null) {
                DB::transaction(function () use ($role): void {
                    Role::query()
                        ->lockForUpdate()
                        ->findOrFail($role->id)
                        ->update(['acceso_total' => true]);
                });
            }

            return $role->refresh()->permisos()
                ->where('permisos.activo', true)
                ->whereNotIn('permisos.modulo', self::INTERNAL_PERMISSION_MODULES)
                ->orderBy('permisos.modulo')
                ->orderByRaw("CASE WHEN permisos.accion = 'ver' THEN 0 ELSE 1 END")
                ->orderBy('permisos.nombre')
                ->get();
        }

        $permissionIds = collect($permissions)->pluck('permiso_id')->map(fn ($id) => (int) $id);
        $selectedPermissions = Permiso::query()
            ->where('activo', true)
            ->whereNotIn('modulo', self::INTERNAL_PERMISSION_MODULES)
            ->whereKey($permissionIds)
            ->get()
            ->keyBy('id');

        if ($selectedPermissions->count() !== $permissionIds->count()) {
            throw ValidationException::withMessages([
                'permisos' => 'Todos los permisos seleccionados deben estar activos y ser administrables.',
            ]);
        }

        $permissionsWithMetadata = collect($permissions)->map(function (array $permission) use ($selectedPermissions): array {
            $model = $selectedPermissions->get((int) $permission['permiso_id']);

            return $permission + [
                'codigo' => $model->codigo,
                'modulo' => $model->modulo,
                'accion' => $model->accion,
            ];
        });

        $invalidGlobalScope = $permissionsWithMetadata->first(
            fn (array $permission): bool => in_array(
                $permission['codigo'],
                self::GLOBAL_ONLY_PERMISSION_CODES,
                true,
            ) && $permission['alcance'] !== 'global'
        );

        if ($invalidGlobalScope !== null) {
            throw ValidationException::withMessages([
                'permisos' => "El permiso {$invalidGlobalScope['codigo']} solo puede tener alcance global.",
            ]);
        }

        foreach ($permissionsWithMetadata->groupBy('modulo') as $module => $modulePermissions) {
            $actionPermissions = $modulePermissions->reject(
                fn (array $permission): bool => $permission['accion'] === 'ver'
                    || str_ends_with($permission['codigo'], '.ver')
            );

            if ($actionPermissions->isEmpty()) {
                continue;
            }

            $viewPermission = $modulePermissions->first(
                fn (array $permission): bool => $permission['accion'] === 'ver'
                    || str_ends_with($permission['codigo'], '.ver')
            );

            if ($viewPermission === null) {
                throw ValidationException::withMessages([
                    'permisos' => "Debes seleccionar primero el permiso Ver módulo de {$module}.",
                ]);
            }

            if (
                $viewPermission['alcance'] !== 'global'
                && $actionPermissions->contains(
                    fn (array $permission): bool => $permission['alcance'] === 'global'
                )
            ) {
                throw ValidationException::withMessages([
                    'permisos' => "El permiso Ver módulo de {$module} debe tener alcance global porque existen acciones globales seleccionadas.",
                ]);
            }
        }

        DB::transaction(function () use ($role, $permissions, $accessTotal): void {
            $lockedRole = Role::query()->lockForUpdate()->findOrFail($role->id);

            if ($accessTotal !== null) {
                $lockedRole->update(['acceso_total' => false]);
            }

            $sync = collect($permissions)->mapWithKeys(
                fn (array $permission): array => [
                    (int) $permission['permiso_id'] => ['alcance' => $permission['alcance']],
                ]
            );

            $internalPermissions = $lockedRole->permisos()
                ->whereIn('permisos.modulo', self::INTERNAL_PERMISSION_MODULES)
                ->get()
                ->mapWithKeys(fn (Permiso $permission): array => [
                    $permission->id => ['alcance' => $permission->pivot->alcance],
                ]);

            $lockedRole->permisos()->sync($internalPermissions->union($sync)->all());
        });

        return $role->refresh()->permisos()
            ->where('permisos.activo', true)
            ->whereNotIn('permisos.modulo', self::INTERNAL_PERMISSION_MODULES)
            ->orderBy('permisos.modulo')
            ->orderByRaw("CASE WHEN permisos.accion = 'ver' THEN 0 ELSE 1 END")
            ->orderBy('permisos.nombre')
            ->get();
    }

    /** @param list<string> $permissions */
    private function authorizeGlobal(User $user, array $permissions): void
    {
        $scope = $this->authorization->scope($user, $permissions);

        if (! $scope->global) {
            throw new AuthorizationException('Solo un permiso global puede administrar roles institucionales.');
        }
    }

    private function cargoCatalog(Role $role): Collection
    {
        return Cargo::query()
            ->with(['area', 'role'])
            ->where(function ($query) use ($role): void {
                $query->whereNull('rol_id')->orWhere('rol_id', $role->id);
            })
            ->get()
            ->sortBy(fn (Cargo $cargo): string => ($cargo->area?->nombre ?? '')."\0".$cargo->nombre)
            ->values();
    }

    private function ensureUnique(string $code, string $name, ?int $exceptId = null): void
    {
        $query = Role::query()->where(function ($query) use ($code, $name): void {
            $query->whereRaw('LOWER(codigo) = ?', [mb_strtolower($code, 'UTF-8')])
                ->orWhereRaw('LOWER(nombre) = ?', [mb_strtolower($name, 'UTF-8')]);
        });

        if ($exceptId !== null) {
            $query->where('id', '<>', $exceptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'codigo' => 'Ya existe un rol con ese código o nombre.',
            ]);
        }
    }

    private function throwUniqueValidation(QueryException $exception): void
    {
        $isUnique = (string) $exception->getCode() === '23505'
            || ((string) $exception->getCode() === '23000'
                && str_contains(mb_strtolower($exception->getMessage()), 'unique'));

        if ($isUnique) {
            throw ValidationException::withMessages([
                'codigo' => 'Ya existe un rol con ese código o nombre.',
            ]);
        }
    }
}
