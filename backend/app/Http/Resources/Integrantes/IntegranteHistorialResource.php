<?php

namespace App\Http\Resources\Integrantes;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IntegranteHistorialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cargo = $this->cargo;
        $area = $cargo?->area;
        $role = $cargo?->role;
        $deactivator = $this->desactivador?->persona;

        return [
            'id' => $this->id,
            'integrante_id' => $this->integrante_id,
            'tipo_integrante' => $this->tipo_integrante,
            'cargo_id' => $this->cargo_id,
            'cargo_area_id' => $cargo?->area_id,
            'cargo' => $cargo?->nombre ?? 'Sin cargo',
            'area_id' => $cargo?->area_id,
            'area' => $area?->nombre ?? 'Sin área',
            'rol_id' => $cargo?->rol_id,
            'rol' => $role?->codigo,
            'rol_nombre' => $role?->nombre ?? 'Sin rol',
            'acceso_total' => (bool) ($role?->acceso_total ?? false),
            'periodo_meses' => $this->periodo_meses,
            'fecha_inicio' => $this->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $this->fecha_fin?->format('Y-m-d'),
            'institucion_educativa' => $this->institucion_educativa ?? '',
            'horas_practicas_requeridas' => $this->horas_practicas_requeridas,
            'carrera' => $this->carrera ?? '',
            'ciclo' => $this->ciclo ?? '',
            'modalidad' => $this->modalidad ?? '',
            'estado' => $this->estado,
            'requiere_asistencia' => (bool) $this->requiere_asistencia,
            'fecha_desactivacion' => $this->fecha_desactivacion?->toISOString(),
            'desactivado_por' => $this->desactivado_por,
            'desactivado_por_nombre' => trim(($deactivator?->nombres ?? '').' '.($deactivator?->apellidos ?? '')),
            'motivo_desactivacion' => $this->motivo_desactivacion ?? '',
            'tipo_desactivacion' => $this->tipo_desactivacion ?? '',
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'horarios' => HorarioResource::collection($this->whenLoaded('horarios')),
        ];
    }
}
