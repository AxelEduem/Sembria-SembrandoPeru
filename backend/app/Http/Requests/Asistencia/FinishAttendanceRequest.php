<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class FinishAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'descripcion' => ['required', 'string', 'min:5', 'max:2000'],
            'motivo_salida' => ['nullable', 'string', 'min:5', 'max:1000'],
            'ocurrido_en' => ['nullable', 'date'],
            'client_event_id' => ['nullable', 'string', 'max:100'],
            'adjunto' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,application/pdf', 'max:5120'],
            'recuperaciones' => ['sometimes', 'array', 'max:30'],
            'recuperaciones.*.fecha' => ['required', 'date_format:Y-m-d', 'after:today'],
            'recuperaciones.*.hora_inicio' => ['required', 'date_format:H:i'],
            'recuperaciones.*.hora_fin' => ['required', 'date_format:H:i', 'after:recuperaciones.*.hora_inicio'],
        ];
    }

    public function messages(): array
    {
        return [
            'descripcion.required' => 'Describe lo que realizaste durante la jornada.',
            'descripcion.min' => 'La descripción debe tener al menos 5 caracteres.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('descripcion')) {
            $this->merge(['descripcion' => trim((string) $this->input('descripcion'))]);
        }
        if ($this->has('motivo_salida')) {
            $this->merge(['motivo_salida' => trim((string) $this->input('motivo_salida'))]);
        }
    }
}
