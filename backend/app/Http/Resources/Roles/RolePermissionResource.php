<?php

namespace App\Http\Resources\Roles;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RolePermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'rol_id' => (int) $this->pivot->rol_id,
            'permiso_id' => (int) $this->id,
            'alcance' => $this->pivot->alcance,
        ];
    }
}
