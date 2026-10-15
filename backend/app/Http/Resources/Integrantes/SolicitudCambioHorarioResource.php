<?php

namespace App\Http\Resources\Integrantes;

use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SolicitudCambioHorarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $history = $this->whenLoaded('historialAnterior');
        $member = $this->whenLoaded('integrante');

        return [
            'id' => $this->id,
            'integrante_id' => $this->integrante_id,
            'historial_anterior_id' => $this->historial_anterior_id,
            'historial_nuevo_id' => $this->historial_nuevo_id,
            'estado' => $this->estado,
            'fecha_solicitud' => $this->fecha_solicitud?->toISOString(),
            'fecha_efectiva' => $this->fecha_efectiva?->format('Y-m-d'),
            'motivo' => $this->motivo,
            'fecha_resolucion' => $this->fecha_resolucion?->toISOString(),
            'observacion_resolucion' => $this->observacion_resolucion,
            'integrante' => $this->whenLoaded('integrante', fn () => [
                'id' => $member->id,
                'nombre' => trim(($member->persona?->nombres ?? '').' '.($member->persona?->apellidos ?? '')),
                'avatar_path' => $member->avatar_path,
                'avatar_url' => app(AvatarService::class)->url($member->avatar_path),
            ]),
            'historial_anterior' => $this->whenLoaded('historialAnterior', fn () => [
                'id' => $history->id,
                'fecha_inicio' => $history->fecha_inicio?->format('Y-m-d'),
                'fecha_fin' => $history->fecha_fin?->format('Y-m-d'),
                'cargo_id' => $history->cargo_id,
                'cargo' => $history->cargo?->nombre,
                'area_id' => $history->cargo?->area_id,
                'area' => $history->cargo?->area?->nombre,
            ]),
            'detalle' => $this->whenLoaded('detalle', fn () => $this->detalle->map(fn ($block) => [
                'dia_semana' => (int) $block->dia_semana,
                'hora_inicio' => substr((string) $block->hora_inicio, 0, 5),
                'hora_fin' => substr((string) $block->hora_fin, 0, 5),
            ])->values()),
        ];
    }
}
