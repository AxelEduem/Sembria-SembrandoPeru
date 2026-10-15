<?php

namespace App\Http\Resources;

use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BitacoraResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatarUrl = app(AvatarService::class)->url($this->actor_avatar_path);
        $context = $this->contexto ?? [];

        return [
            'id' => $this->id,

            'actor' => [
                'cuenta_acceso_id' => $this->cuenta_acceso_id,
                'nombre' => $this->actor_nombre,
                'correo' => $this->actor_correo,
                'avatar_path' => $this->actor_avatar_path,
                'avatar_url' => $avatarUrl,
                'area_id' => $this->area_id,
                'area' => $this->area_nombre,
            ],

            'modulo' => $this->modulo,
            'accion' => $this->accion,
            'descripcion' => $this->descripcion,

            'entidad' => [
                'tipo' => $this->entidad_tipo,
                'id' => $this->entidad_id,
                'nombre' => $context['entidad_nombre'] ?? null,
            ],

            'solicitud' => [
                'metodo' => $this->metodo,
                'ruta' => $this->ruta,
                'estado_http' => (int) $this->estado_http,
                'ip' => $this->ip,
                'user_agent' => $this->user_agent,
            ],

            'resultado' => $this->resultado,
            'campos_modificados' => $this->campos_modificados ?? [],
            'contexto' => $context,
            'fecha' => $this->created_at?->toISOString(),
        ];
    }
}
