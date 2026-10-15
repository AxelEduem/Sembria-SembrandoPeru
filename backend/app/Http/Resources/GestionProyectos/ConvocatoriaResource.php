<?php

namespace App\Http\Resources\GestionProyectos;

use App\Models\CuentaAcceso;
use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConvocatoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...$this->resource->attributesToArray(),
            'fuente' => $this->whenLoaded('fuente', fn () => [
                'id' => $this->fuente?->id,
                'nombre' => $this->fuente?->nombre,
                'tipo' => $this->fuente?->tipo,
            ]),
            'equipo' => $this->whenLoaded('equipo', fn () => $this->equipo ? [
                'id' => $this->equipo->id,
                'nombre' => $this->equipo->nombre,
            ] : null),
            'primer_filtro_autorizado' => (bool) ($this->resource->primer_filtro_autorizado ?? false),
            'registrante' => $this->whenLoaded(
                'registrante',
                fn () => $this->account($this->registrante, true)
            ),
            'evaluaciones' => $this->whenLoaded(
                'evaluaciones',
                fn () => $this->evaluaciones->map(fn ($item) => [
                    ...$item->attributesToArray(),
                    'revisor' => $this->account($item->revisor),
                ])->values()->all()
            ),
            'aprobacion' => $this->whenLoaded('aprobacion', function () {
                if (! $this->aprobacion) {
                    return null;
                }

                return [
                    ...$this->aprobacion->attributesToArray(),
                    'decisor' => $this->account($this->aprobacion->decisor),
                ];
            }),
            'postulaciones' => $this->whenLoaded(
                'postulaciones',
                fn () => $this->postulaciones->map(fn ($item) => [
                    ...$item->attributesToArray(),
                    'enviada' => $this->account($item->enviada),
                    'seguimientos' => $item->relationLoaded('seguimientos')
                        ? $item->seguimientos->map->attributesToArray()->values()->all()
                        : [],
                ])->values()->all()
            ),
            'historial' => $this->whenLoaded(
                'historial',
                fn () => $this->historial->map(fn ($item) => [
                    ...$item->attributesToArray(),
                    'actor' => $this->account($item->actor),
                ])->values()->all()
            ),
        ];
    }

    private function account(?CuentaAcceso $account, bool $includeMembership = false): ?array
    {
        if (! $account) {
            return null;
        }

        $persona = $account->persona;

        $personData = $persona ? [
            'id' => $persona->id,
            'nombres' => $persona->nombres,
            'apellidos' => $persona->apellidos,
        ] : null;

        if ($personData && $includeMembership) {
            $avatarService = app(AvatarService::class);

            $personData['integrantes'] = $persona->relationLoaded('integrantes')
                ? $persona->integrantes->map(fn ($item) => [
                    'avatar_path' => $item->avatar_path,
                    'avatar_url' => $avatarService->url($item->avatar_path),
                    'estado' => $item->estado,
                ])->values()->all()
                : [];

            $personData['trabajadores'] = [];
        }

        return [
            'id' => $account->id,
            'persona' => $personData,
        ];
    }
}
