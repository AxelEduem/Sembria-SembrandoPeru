<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveHorarioBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'historial_id' => ['required', 'integer', 'exists:integrantes_historial,id'],
            'dia_semana' => ['required', 'integer', 'between:1,6'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $this->filled(['hora_inicio', 'hora_fin'])) {
                return;
            }
            [$startHour, $startMinute] = array_map('intval', explode(':', $this->input('hora_inicio')));
            [$endHour, $endMinute] = array_map('intval', explode(':', $this->input('hora_fin')));
            $start = $startHour * 60 + $startMinute;
            $end = $endHour * 60 + $endMinute;
            if ($start < 480 || $end > 1080) {
                $validator->errors()->add('hora_inicio', 'El horario debe estar entre 08:00 y 18:00.');
            }
            if ($end - $start < 120) {
                $validator->errors()->add('hora_fin', 'Cada bloque debe durar al menos 2 horas.');
            }
        }];
    }
}
