<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AplicacionResource extends JsonResource
{
    private const TEMPORARY_URL_MINUTES = 30;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion ?? '',
            'imagen_url' => $this->imageUrl(),
            'imagen_path' => $this->imagen_path ?? '',
            'licencias_total' => (int) $this->licencias_total,
            'licencias_usadas' => (int) ($this->asignaciones_activas_count ?? 0),
            'area_id' => $this->area_id,
            'area' => $this->area?->nombre,
            'activo' => (bool) $this->activo,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    private function imageUrl(): string
    {
        if ($this->isManagedPath($this->imagen_path)) {
            $diskName = (string) config('filesystems.application_logo_disk');
            $disk = Storage::disk($diskName);

            if ($diskName === 's3') {
                try {
                    return $disk->temporaryUrl(
                        $this->imagen_path,
                        now()->addMinutes(self::TEMPORARY_URL_MINUTES),
                    );
                } catch (Throwable $exception) {
                    report($exception);

                    return '';
                }
            }

            return $disk->url($this->imagen_path);
        }

        return $this->imagen_url ?? '';
    }

    private function isManagedPath(?string $path): bool
    {
        return is_string($path) && str_starts_with($path, 'application-logos/');
    }
}
