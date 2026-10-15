<?php

namespace App\Http\Resources\GestionProyectos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipoIntegranteHistorialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'accion' => $this->accion,
            'rol_anterior' => $this->rol_anterior,
            'rol_nuevo' => $this->rol_nuevo,
            'fecha' => $this->created_at?->toISOString(),
            'integrante' => [
                'id' => $this->integrante_id,
                'nombre' => trim(($this->integrante?->persona?->nombres ?? '').' '.($this->integrante?->persona?->apellidos ?? '')),
                'correo' => $this->integrante?->persona?->correo,
            ],
            'realizado_por' => $this->actor ? [
                'id' => $this->actor->id,
                'nombre' => trim(($this->actor->persona?->nombres ?? '').' '.($this->actor->persona?->apellidos ?? '')),
            ] : null,
        ];
    }
}
