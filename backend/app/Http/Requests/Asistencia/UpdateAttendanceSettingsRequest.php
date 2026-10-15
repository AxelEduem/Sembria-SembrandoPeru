<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'minutos_antes_inicio' => ['required', 'integer', 'between:0,60'],
            'tolerancia_tardanza' => ['required', 'integer', 'between:0,120'],
            'umbral_salida_anticipada' => ['required', 'integer', 'between:0,120'],
            'minutos_gracia_falta' => ['required', 'integer', 'between:0,240'],
            'recordatorio_inicio' => ['required', 'integer', 'between:0,60'],
            'recordatorio_salida' => ['required', 'integer', 'between:0,60'],
            'max_minutos_offline' => ['required', 'integer', 'between:5,1440'],
            'jornada_hora_inicio' => ['required', 'date_format:H:i'],
            'jornada_hora_fin' => ['required', 'date_format:H:i', 'after:jornada_hora_inicio'],
            'jornada_dias' => ['required', 'array', 'min:1', 'max:7'],
            'jornada_dias.*' => ['required', 'integer', 'between:1,7', 'distinct'],
        ];
    }
}
