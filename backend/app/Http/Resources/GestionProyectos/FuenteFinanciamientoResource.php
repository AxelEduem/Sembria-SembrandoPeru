<?php

namespace App\Http\Resources\GestionProyectos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuenteFinanciamientoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'tipo' => $this->tipo,
            'sitio_web' => $this->sitio_web,
            'descripcion' => $this->descripcion,
            'activo' => (bool) $this->activo,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
