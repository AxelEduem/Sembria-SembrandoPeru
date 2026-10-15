<?php

namespace App\Http\Resources\GestionProyectos;

use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatarService = app(AvatarService::class);

        $members = $this->whenLoaded('integrantes', fn () => $this->integrantes->map(function ($item) use ($avatarService): array {
            $history = $item->historiales->firstWhere('estado', 'Activo');

            return [
                'id' => $item->id,
                'nombre' => trim(($item->persona?->nombres ?? '').' '.($item->persona?->apellidos ?? '')),
                'correo' => $item->persona?->correo,
                'avatar_path' => $item->avatar_path,
                'avatar_url' => $avatarService->url($item->avatar_path),
                'rol' => $item->pivot->rol,
                'cargo' => $history?->cargo?->nombre,
                'horarios' => $history?->horarios?->sortBy('dia_semana')->map(fn ($block): array => [
                    'dia_semana' => (int) $block->dia_semana,
                    'hora_inicio' => substr((string) $block->hora_inicio, 0, 5),
                    'hora_fin' => substr((string) $block->hora_fin, 0, 5),
                ])->values()->all() ?? [],
            ];
        })->values()->all());

        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'activo' => $this->activo,
            'area_id' => $this->area_id,
            'area' => $this->whenLoaded('area', fn () => [
                'id' => $this->area?->id,
                'nombre' => $this->area?->nombre,
            ]),
            'lider' => collect($members)->firstWhere('rol', 'lider'),
            'integrantes' => collect($members)->where('rol', 'integrante')->values()->all(),
            'integrantes_total' => collect($members)->count(),
        ];
    }
}