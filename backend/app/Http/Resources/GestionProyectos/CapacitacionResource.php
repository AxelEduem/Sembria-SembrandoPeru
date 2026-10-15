<?php

namespace App\Http\Resources\GestionProyectos;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CapacitacionResource extends JsonResource
{
    private const STAGES = [
        1 => 'Conceptos generales de proyecto',
        2 => 'Métodos de identificación de fondos',
        3 => 'Desarrollo de un mini proyecto',
    ];

    public function toArray(Request $request): array
    {
        $training = $this->capacitacionGestionProyectos;
        $completed = [
            1 => $training?->fase_1_completada_at,
            2 => $training?->fase_2_completada_at,
            3 => $training?->fase_3_completada_at,
        ];
        $currentStage = collect($completed)->search(fn ($date) => $date === null);
        $finished = $currentStage === false;
        $completedAt = $training?->fase_3_completada_at;
        $celebrationUntil = $completedAt?->copy()->addDay();
        $history = $this->historiales->firstWhere('estado', 'Activo');

        return [
            'integrante_id' => $this->id,
            'nombre' => trim(($this->persona?->nombres ?? '').' '.($this->persona?->apellidos ?? '')),
            'correo' => $this->persona?->correo,
            'cargo' => $history?->cargo?->nombre,
            'estado' => $finished ? 'completada' : ($training ? 'en_capacitacion' : 'sin_iniciar'),
            'etapa_actual' => $finished ? null : (int) $currentStage,
            'etapa_actual_nombre' => $finished ? null : self::STAGES[$currentStage],
            'habilitado_registro_proyectos' => $finished,
            'completada_at' => $completedAt?->toIso8601String(),
            'celebracion_hasta' => $celebrationUntil?->toIso8601String(),
            'mostrar_celebracion' => $finished && $celebrationUntil?->isFuture(),
            'etapas' => collect(self::STAGES)->map(fn (string $name, int $stage): array => [
                'numero' => $stage,
                'nombre' => $name,
                'completada' => $completed[$stage] !== null,
                'completada_at' => $completed[$stage]?->toIso8601String(),
            ])->values()->all(),
        ];
    }
}
