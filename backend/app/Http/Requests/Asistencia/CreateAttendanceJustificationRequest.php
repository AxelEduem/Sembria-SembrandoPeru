<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class CreateAttendanceJustificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:5', 'max:2000'],
            'adjunto' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'recuperaciones' => ['required', 'array', 'min:1', 'max:30'],
            'recuperaciones.*.fecha' => ['required', 'date_format:Y-m-d', 'after:today'],
            'recuperaciones.*.hora_inicio' => ['required', 'date_format:H:i'],
            'recuperaciones.*.hora_fin' => ['required', 'date_format:H:i', 'after:recuperaciones.*.hora_inicio'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['motivo' => trim((string) $this->input('motivo'))]);
    }
}
