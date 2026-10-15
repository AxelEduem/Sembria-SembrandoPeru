<?php

namespace App\Http\Resources\Integrantes;

use App\Services\Profile\AvatarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class CumpleanosResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $history = $this->currentHistory($this->historiales);
        $cargo = $history?->cargo;
        $persona = $this->persona;

        $avatarUrl = app(AvatarService::class)->url($this->avatar_path);

        return [
            'id' => $this->id,
            'persona_id' => $this->persona_id,
            'nombre' => trim(($persona?->nombres ?? '').' '.($persona?->apellidos ?? '')) ?: 'Sin nombre',
            'fecha_nacimiento' => $this->fecha_nacimiento?->format('Y-m-d'),

            'avatar_path' => $this->avatar_path,
            'avatar_url' => $avatarUrl,

            'tipo_integrante' => $history?->tipo_integrante ?? 'voluntario',
            'cargo_id' => $cargo?->id,
            'cargo' => $cargo?->nombre ?? 'Sin cargo',
            'area_id' => $cargo?->area_id,
            'area' => $cargo?->area?->nombre ?? 'Sin área',
            'estado' => $this->estado,
            'activo' => $this->estado === 'Activo',
            'historial_id' => $history?->id,
            'historial_actual' => $history ? ['estado' => $history->estado] : null,
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