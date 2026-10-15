<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgendaMetricsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'total_reuniones' => (int) $this->resource['total_reuniones'],
            'organizadas' => (int) $this->resource['organizadas'],
            'como_participante' => (int) $this->resource['como_participante'],
            'horas_totales' => (float) $this->resource['horas_totales'],
            'promedio_minutos' => (int) $this->resource['promedio_minutos'],
            'colaboradores' => (int) $this->resource['colaboradores'],
            'por_modalidad' => $this->resource['por_modalidad'],
            'por_mes' => $this->resource['por_mes'],
        ];
    }
}
