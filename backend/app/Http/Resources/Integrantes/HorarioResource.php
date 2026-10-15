<?php

namespace App\Http\Resources\Integrantes;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HorarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'historial_id' => $this->historial_id,
            'dia_semana' => (int) $this->dia_semana,
            'hora_inicio' => substr((string) $this->hora_inicio, 0, 5),
            'hora_fin' => substr((string) $this->hora_fin, 0, 5),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
