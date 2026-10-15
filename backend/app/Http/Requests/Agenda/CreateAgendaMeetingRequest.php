<?php

namespace App\Http\Requests\Agenda;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAgendaMeetingRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'titulo' => trim((string) $this->input('titulo')),
            'descripcion' => $this->nullableTrimmed('descripcion'),
            'ubicacion' => $this->nullableTrimmed('ubicacion'),
            'enlace' => $this->nullableTrimmed('enlace'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'min:3', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
            'fecha' => ['required', 'date_format:Y-m-d'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'modalidad' => ['required', Rule::in(['virtual', 'presencial', 'hibrida'])],
            'ubicacion' => ['nullable', 'string', 'max:500'],
            'enlace' => ['nullable', 'string', 'max:1000'],
            'participantes' => ['required', 'array', 'min:1'],
            'participantes.*' => ['required', 'uuid', 'distinct'],
        ];
    }

    private function nullableTrimmed(string $key): ?string
    {
        $value = trim((string) $this->input($key));

        return $value !== '' ? $value : null;
    }
}
