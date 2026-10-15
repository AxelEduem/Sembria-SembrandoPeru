<?php

namespace App\Http\Resources\Integrantes;

use App\Services\Profile\AvatarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class IntegranteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $histories = $this->relationLoaded('historiales') ? $this->historiales : collect();
        $current = $this->currentHistory($histories);
        $historyData = IntegranteHistorialResource::collection($histories)->resolve($request);
        $currentData = $current
            ? (new IntegranteHistorialResource($current))->resolve($request)
            : null;
        $persona = $this->persona;

        $avatarUrl = app(AvatarService::class)->url($this->avatar_path);

        return [
            'id' => $this->id,
            'persona_id' => $this->persona_id,
            'nombres' => $persona?->nombres ?? '',
            'apellidos' => $persona?->apellidos ?? '',
            'nombre' => trim(($persona?->nombres ?? '').' '.($persona?->apellidos ?? '')) ?: 'Sin nombre',
            'correo' => mb_strtolower($persona?->correo ?? ''),
            'fecha_nacimiento' => $this->fecha_nacimiento?->format('Y-m-d'),
            'documento_identidad' => $this->documento_identidad ?? '',
            'tipo_documento' => $this->tipo_documento ?? '',
            'telefono' => $this->telefono ?? '',

            'avatar_path' => $this->avatar_path,
            'avatar_url' => $avatarUrl,

            'departamento' => $this->departamento ?? '',
            'ciudad' => $this->ciudad ?? '',
            'distrito' => $this->distrito ?? '',
            'tipo_integrante' => $currentData['tipo_integrante'] ?? 'voluntario',
            'carrera' => $currentData['carrera'] ?? '',
            'ciclo' => $currentData['ciclo'] ?? '',
            'modalidad' => $currentData['modalidad'] ?? '',
            'cargo_id' => $currentData['cargo_id'] ?? null,
            'historial_id' => $currentData['id'] ?? null,
            'cargo_area_id' => $currentData['cargo_area_id'] ?? null,
            'cargo' => $currentData['cargo'] ?? 'Sin cargo',
            'area_id' => $currentData['area_id'] ?? null,
            'area' => $currentData['area'] ?? 'Sin área',
            'rol_id' => $currentData['rol_id'] ?? null,
            'rol' => $currentData['rol'] ?? null,
            'rol_nombre' => $currentData['rol_nombre'] ?? 'Sin rol',
            'acceso_total' => (bool) ($currentData['acceso_total'] ?? false),
            'periodo_meses' => $currentData['periodo_meses'] ?? null,
            'fecha_inicio' => $currentData['fecha_inicio'] ?? '',
            'fecha_fin' => $currentData['fecha_fin'] ?? '',
            'institucion_educativa' => $currentData['institucion_educativa'] ?? '',
            'horas_practicas_requeridas' => $currentData['horas_practicas_requeridas'] ?? null,
            'estado' => $this->estado,
            'activo' => $this->estado === 'Activo',
            'accesos_pendientes_revision' => (bool) $this->accesos_pendientes_revision,
            'accesos_retirados' => (bool) $this->accesos_retirados,
            'accesos_retirados_at' => $this->accesos_retirados_at?->toISOString(),
            'fecha_desactivacion' => $currentData['fecha_desactivacion'] ?? null,
            'desactivado_por' => $currentData['desactivado_por'] ?? null,
            'desactivado_por_nombre' => $currentData['desactivado_por_nombre'] ?? '',
            'motivo_desactivacion' => $currentData['motivo_desactivacion'] ?? '',
            'tipo_desactivacion' => $currentData['tipo_desactivacion'] ?? '',
            'created_at' => $this->created_at?->toISOString(),
            'historial_actual' => $currentData,
            'historiales' => $historyData,
        ];
    }

    private function currentHistory(Collection $histories): mixed
    {
        $today = CarbonImmutable::now('America/Lima')->toDateString();

        $coversToday = fn ($row): bool =>
            ($row->fecha_inicio === null || $row->fecha_inicio->format('Y-m-d') <= $today)
            && ($row->fecha_fin === null || $row->fecha_fin->format('Y-m-d') >= $today);

        return $histories->first(
            fn ($row) => $row->estado === 'Activo' && $coversToday($row)
        )
            ?? $histories->first($coversToday)
            ?? $histories->firstWhere('estado', 'Activo')
            ?? $histories->first();
    }
}