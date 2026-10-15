<?php

namespace App\Services\Aplicaciones;

use App\Models\Aplicacion;
use App\Models\Area;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AplicacionService
{
    private const DIRECTORY = 'application-logos';

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function list(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['aplicaciones.ver']);

        return Aplicacion::query()
            ->with('area')
            ->withCount(['asignaciones as asignaciones_activas_count' => fn ($query) => $query->where('activo', true)])
            ->when(! $scope->global, fn ($query) => $query->where('area_id', $scope->areaId))
            ->latest('created_at')
            ->get();
    }

    public function find(User $user, Aplicacion $aplicacion): Aplicacion
    {
        $this->authorizeApplication($user, ['aplicaciones.ver'], $aplicacion);

        return $this->load($aplicacion);
    }

    public function create(User $user, array $data): Aplicacion
    {
        $scope = $this->authorization->scope($user, ['aplicaciones.crear']);
        $areaId = $scope->global ? ($data['area_id'] ?? null) : $scope->areaId;
        $this->ensureActiveArea($areaId);
        $this->ensureUniqueName($data['nombre']);

        $storedPath = null;

        try {
            return DB::transaction(function () use ($data, $areaId, &$storedPath): Aplicacion {
                $application = Aplicacion::query()->create([
                    'nombre' => $data['nombre'],
                    'descripcion' => $data['descripcion'] ?? null,
                    'licencias_total' => $data['licencias_total'],
                    'area_id' => $areaId,
                    'activo' => true,
                    'imagen_url' => null,
                    'imagen_path' => null,
                ]);

                if (($data['logo_file'] ?? null) instanceof UploadedFile) {
                    $storedPath = $this->storeLogo($application, $data['logo_file']);
                    $application->update(['imagen_path' => $storedPath, 'imagen_url' => null]);
                }

                return $this->load($application);
            });
        } catch (Throwable $exception) {
            $this->deleteManagedFile($storedPath);

            if ($this->isUniqueViolation($exception)) {
                throw ValidationException::withMessages([
                    'nombre' => 'Ya existe una aplicación con ese nombre.',
                ]);
            }

            throw $exception;
        }
    }

    public function update(User $user, Aplicacion $aplicacion, array $data): Aplicacion
    {
        $this->authorizeApplication($user, ['aplicaciones.editar'], $aplicacion);

        if (! $aplicacion->activo) {
            throw ValidationException::withMessages([
                'activo' => 'La aplicación seleccionada no está disponible.',
            ]);
        }

        $this->ensureUniqueName($data['nombre'], $aplicacion->id);
        $this->ensureLicenseCapacity($aplicacion, (int) $data['licencias_total']);

        $previousPath = $aplicacion->imagen_path;
        $storedPath = null;

        try {
            $updated = DB::transaction(function () use ($aplicacion, $data, &$storedPath): Aplicacion {
                $locked = Aplicacion::query()->lockForUpdate()->findOrFail($aplicacion->id);
                $payload = [
                    'nombre' => $data['nombre'],
                    'descripcion' => $data['descripcion'] ?? null,
                    'licencias_total' => $data['licencias_total'],
                ];

                if (($data['logo_file'] ?? null) instanceof UploadedFile) {
                    $storedPath = $this->storeLogo($locked, $data['logo_file']);
                    $payload['imagen_path'] = $storedPath;
                    $payload['imagen_url'] = null;
                }

                $locked->update($payload);

                return $this->load($locked);
            });
        } catch (Throwable $exception) {
            $this->deleteManagedFile($storedPath);

            if ($this->isUniqueViolation($exception)) {
                throw ValidationException::withMessages([
                    'nombre' => 'Ya existe una aplicación con ese nombre.',
                ]);
            }

            throw $exception;
        }

        if ($storedPath !== null && $previousPath !== $storedPath) {
            $this->deleteManagedFile($previousPath);
        }

        return $updated;
    }

    public function setActive(User $user, Aplicacion $aplicacion, bool $active): Aplicacion
    {
        $this->authorizeApplication($user, ['aplicaciones.desactivar'], $aplicacion);

        return DB::transaction(function () use ($aplicacion, $active): Aplicacion {
            $locked = Aplicacion::query()->lockForUpdate()->findOrFail($aplicacion->id);

            if ($locked->activo === $active) {
                throw ValidationException::withMessages([
                    'activo' => sprintf(
                        'La aplicación seleccionada ya está %s.',
                        $active ? 'activa' : 'inactiva'
                    ),
                ]);
            }

            if ($active) {
                $this->ensureActiveArea($locked->area_id);
                $this->ensureUniqueName($locked->nombre, $locked->id);
            }

            $locked->update(['activo' => $active]);

            return $this->load($locked);
        });
    }

    /** @param list<string> $permissions */
    private function authorizeApplication(
        User $user,
        array $permissions,
        Aplicacion $application,
    ): void {
        $scope = $this->authorization->scope($user, $permissions);

        if ($scope->global) {
            return;
        }

        if ($application->area_id === $scope->areaId) {
            return;
        }

        throw new AuthorizationException('No tienes permisos para administrar esta aplicación.');
    }

    private function ensureActiveArea(?int $areaId): void
    {
        if ($areaId !== null && ! Area::query()->whereKey($areaId)->where('activo', true)->exists()) {
            throw ValidationException::withMessages([
                'area_id' => 'No puedes asignar un área inactiva a la aplicación.',
            ]);
        }
    }

    private function ensureUniqueName(string $name, ?int $exceptId = null): void
    {
        $query = Aplicacion::query()
            ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower(trim($name), 'UTF-8')]);

        if ($exceptId !== null) {
            $query->where('id', '<>', $exceptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'nombre' => 'Ya existe una aplicación con ese nombre.',
            ]);
        }
    }

    private function ensureLicenseCapacity(Aplicacion $application, int $total): void
    {
        $used = $application->asignaciones()->where('activo', true)->count();

        if ($used > $total) {
            throw ValidationException::withMessages([
                'licencias_total' => 'No puedes reducir las licencias por debajo de las asignaciones actuales.',
            ]);
        }
    }

    private function isUniqueViolation(Throwable $exception): bool
    {
        if (! $exception instanceof QueryException) {
            return false;
        }

        return (string) $exception->getCode() === '23505'
            || ((string) $exception->getCode() === '23000'
                && str_contains(mb_strtolower($exception->getMessage()), 'unique'));
    }

    private function storeLogo(Aplicacion $application, UploadedFile $file): string
    {
        $extension = $file->guessExtension() ?: 'png';
        $path = sprintf('%s/%d/%s.%s', self::DIRECTORY, $application->id, Str::uuid(), $extension);

        try {
            $stored = Storage::disk($this->disk())->putFileAs(dirname($path), $file, basename($path));
        } catch (Throwable $exception) {
            throw new RuntimeException('No se pudo guardar el logo de la aplicación.', previous: $exception);
        }

        if ($stored === false) {
            throw new RuntimeException('No se pudo guardar el logo de la aplicación.');
        }

        return $path;
    }

    private function deleteManagedFile(?string $path): void
    {
        if (! is_string($path) || ! str_starts_with($path, self::DIRECTORY.'/')) {
            return;
        }

        try {
            Storage::disk($this->disk())->delete($path);
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    private function load(Aplicacion $application): Aplicacion
    {
        return $application->refresh()
            ->load('area')
            ->loadCount(['asignaciones as asignaciones_activas_count' => fn ($query) => $query->where('activo', true)]);
    }

    private function disk(): string
    {
        return (string) config('filesystems.application_logo_disk');
    }
}
