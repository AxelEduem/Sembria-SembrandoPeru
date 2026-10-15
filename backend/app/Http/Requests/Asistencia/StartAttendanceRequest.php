<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class StartAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'horario_id' => ['required', 'integer'],
            'motivo' => ['nullable', 'string', 'min:5', 'max:1000'],
            'ocurrido_en' => ['nullable', 'date'],
            'client_event_id' => ['nullable', 'string', 'max:100'],
            'recuperaciones' => ['sometimes', 'array', 'max:30'],
            'recuperaciones.*.fecha' => ['required', 'date_format:Y-m-d', 'after:today'],
            'recuperaciones.*.hora_inicio' => ['required', 'date_format:H:i'],
            'recuperaciones.*.hora_fin' => ['required', 'date_format:H:i', 'after:recuperaciones.*.hora_inicio'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('motivo')) {
            $this->merge(['motivo' => trim((string) $this->input('motivo')) ?: null]);
        }
    }
}
