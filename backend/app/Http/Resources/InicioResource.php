<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InicioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'integrantes_activos' => (int) $this->resource['integrantes_activos'],
            'areas_activas' => (int) $this->resource['areas_activas'],
            'usuarios_conectados' => (int) $this->resource['usuarios_conectados'],
        ];
    }
}
