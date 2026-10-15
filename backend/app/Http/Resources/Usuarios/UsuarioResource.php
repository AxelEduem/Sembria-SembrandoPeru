<?php

namespace App\Http\Resources\Usuarios;

use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $persona = $this->persona;
        $account = $persona?->cuentaAcceso;
        $history = $this->resource->relationLoaded('usuarioHistory')
            ? $this->resource->getRelation('usuarioHistory')
            : null;
        $position = $history?->cargo;
        $area = $position?->area;
        $firstNames = trim((string) ($persona?->nombres ?? ''));
        $lastNames = trim((string) ($persona?->apellidos ?? ''));

        $avatarUrl = app(AvatarService::class)->url($this->avatar_path);

        return [
            'integrante_id' => $this->id,
            'persona_id' => $this->persona_id,
            'cuenta_id' => $account?->id,
            'nombres' => $firstNames,
            'apellidos' => $lastNames,
            'nombre' => trim("{$firstNames} {$lastNames}") ?: 'Sin nombre',

            'avatar_path' => $this->avatar_path,
            'avatar_url' => $avatarUrl,

            'correo' => mb_strtolower(trim((string) ($persona?->correo ?? '')), 'UTF-8'),
            'tipo_integrante' => $history?->tipo_integrante ?? 'voluntario',
            'cargo_id' => $history?->cargo_id,
            'cargo' => $position?->nombre ?? 'Sin cargo',
            'area' => $area?->nombre ?? 'Sin área',
            'area_id' => $position?->area_id ?? $area?->id,
            'integrante_activo' => $this->estado === 'Activo',
            'acceso_configurado' => $account !== null,
            'activo' => (bool) ($account?->activo ?? false),
            'must_change_password' => (bool) ($account?->must_change_password ?? false),
            'created_at' => $this->created_at?->toISOString(),
            'acceso_created_at' => $account?->created_at?->toISOString(),
        ];
    }
}