<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CargoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion ?? '',
            'area_id' => $this->area_id,
            'rol_id' => $this->rol_id,
            'area' => $this->area?->nombre ?? 'Sin área',
            'rol' => $this->role ? [
                'id' => $this->role->id,
                'codigo' => $this->role->codigo,
                'nombre' => $this->role->nombre,
                'descripcion' => $this->role->descripcion ?? '',
                'acceso_total' => (bool) $this->role->acceso_total,
                'activo' => (bool) $this->role->activo,
            ] : null,
            'rol_nombre' => $this->role?->nombre ?? 'Sin rol asignado',
            'activo' => (bool) $this->activo,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
