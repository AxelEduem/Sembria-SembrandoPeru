<?php

namespace App\Services\Profile;

use App\Data\Profile\AvatarData;
use App\Models\Integrante;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class AvatarService
{
    private const DIRECTORY = 'avatars';

    private const TEMPORARY_URL_MINUTES = 30;

    public function replace(User $user, UploadedFile $file): AvatarData
    {
        $integrante = $this->activeIntegrante($user);
        $diskName = $this->disk();
        $disk = Storage::disk($diskName);

        $previousPath = $integrante->avatar_path;
        $path = $this->pathFor($integrante, $file);

        try {
            $storedPath = $disk->putFileAs(
                dirname($path),
                $file,
                basename($path),
            );

            if ($storedPath === false) {
                throw new RuntimeException(
                    'El almacenamiento rechazó la foto de perfil.'
                );
            }
        } catch (Throwable $exception) {
            throw new RuntimeException(
                'No se pudo guardar la foto de perfil.',
                previous: $exception,
            );
        }

        try {
            DB::transaction(function () use ($integrante, $path): void {
                $integrante->forceFill([
                    'avatar_path' => $path,
                ])->save();
            });
        } catch (Throwable $exception) {
            try {
                $disk->delete($path);
            } catch (Throwable $cleanupException) {
                report($cleanupException);
            }

            throw new RuntimeException(
                'La foto se subió, pero no se pudo actualizar el perfil.',
                previous: $exception,
            );
        }

        if (
            $previousPath !== $path
            && $this->isManagedPath($previousPath)
        ) {
            try {
                $disk->delete($previousPath);
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        return new AvatarData(
            $path,
            $this->urlFromDisk($diskName, $disk, $path),
        );
    }

    public function delete(User $user): void
    {
        $integrante = $this->activeIntegrante($user);
        $path = $integrante->avatar_path;

        DB::transaction(function () use ($integrante): void {
            $integrante->forceFill([
                'avatar_path' => null,
            ])->save();
        });

        if ($this->isManagedPath($path)) {
            try {
                Storage::disk($this->disk())->delete($path);
            } catch (Throwable $exception) {
                report($exception);
            }
        }
    }

    public function url(?string $path): ?string
    {
        if (! $this->isManagedPath($path)) {
            return null;
        }

        $diskName = $this->disk();
        $disk = Storage::disk($diskName);

        return $this->urlFromDisk($diskName, $disk, $path);
    }

    private function urlFromDisk(
        string $diskName,
        mixed $disk,
        string $path,
    ): ?string {
        if ($diskName === 's3') {
            try {
                return $disk->temporaryUrl(
                    $path,
                    now()->addMinutes(self::TEMPORARY_URL_MINUTES),
                );
            } catch (Throwable $exception) {
                report($exception);

                return null;
            }
        }

        return $disk->url($path);
    }

    private function activeIntegrante(User $user): Integrante
    {
        $account = $user->cuentaAcceso()->first();

        if ($account === null) {
            throw (new ModelNotFoundException)->setModel('cuentas_acceso');
        }

        if (! $account->activo) {
            throw new AuthorizationException(
                'La cuenta de acceso está inactiva.'
            );
        }

        $integrante = Integrante::query()
            ->where('persona_id', $account->persona_id)
            ->where('estado', 'Activo')
            ->latest('id')
            ->first();

        if ($integrante === null) {
            throw (new ModelNotFoundException)->setModel(Integrante::class);
        }

        return $integrante;
    }

    private function pathFor(
        Integrante $integrante,
        UploadedFile $file
    ): string {
        $extension = $file->guessExtension() ?: 'jpg';

        return sprintf(
            '%s/%s/%s.%s',
            self::DIRECTORY,
            $integrante->persona_id,
            Str::uuid(),
            $extension,
        );
    }

    private function isManagedPath(?string $path): bool
    {
        return is_string($path)
            && str_starts_with($path, self::DIRECTORY.'/');
    }

    private function disk(): string
    {
        return (string) config('filesystems.avatar_disk');
    }
}