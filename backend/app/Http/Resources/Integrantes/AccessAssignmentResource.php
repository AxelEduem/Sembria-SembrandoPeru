<?php

namespace App\Http\Resources\Integrantes;

use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccessAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $application = $this->aplicacion;
        $history = $this->historial;
        $integrante = $history?->integrante;
        $persona = $integrante?->persona;
        $cargo = $history?->cargo;
        $avatarService = app(AvatarService::class);

        $person = [
            'id' => $integrante?->id,
            'historial_id' => $history?->id,
            'persona_id' => $integrante?->persona_id,
            'nombre' => trim(($persona?->nombres ?? '').' '.($persona?->apellidos ?? '')),
            'correo' => $persona?->correo ?? '',
            'avatar_path' => $integrante?->avatar_path,
            'avatar_url' => $avatarService->url($integrante?->avatar_path),
            'tipo_integrante' => $history?->tipo_integrante,
            'area' => $cargo?->area?->nombre ?? 'Sin área',
            'area_id' => $cargo?->area_id,
            'cargo' => $cargo?->nombre ?? '-',
            'cargo_id' => $cargo?->id,
            'estado' => $integrante?->estado,
        ];

        return [
            'id' => $this->id,
            'historial_id' => $this->historial_id,
            'aplicacion_id' => $this->aplicacion_id,
            'created_at' => $this->created_at?->toISOString(),
            'activo' => (bool) $this->activo,
            'fecha_retiro' => $this->fecha_retiro?->toISOString(),
            'aplicacion' => $application ? [
                'id' => $application->id,
                'nombre' => $application->nombre,
                'descripcion' => $application->descripcion,
                'imagen_url' => $application->imagen_url,
                'imagen_path' => $application->imagen_path,
                'licencias_total' => $application->licencias_total,
                'area_id' => $application->area_id,
                'activo' => (bool) $application->activo,
            ] : null,
            'integrante_id' => $integrante?->id,
            'integrante' => $person,
            'voluntario' => $person,
        ];
    }
}