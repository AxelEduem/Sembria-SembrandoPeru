<?php

namespace App\Http\Requests\Tareas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTareaRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $assigneeIds = $this->input('asignadas_a');
        if (! is_array($assigneeIds) && $this->filled('asignada_a')) {
            $assigneeIds = [$this->input('asignada_a')];
        }

        $this->merge([
            'titulo' => trim((string) $this->input('titulo')),
            'descripcion' => $this->nullableTrimmed('descripcion'),
            'asignadas_a' => $assigneeIds,
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'min:3', 'max:140'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'asignadas_a' => ['required', 'array', 'min:1'],
            'asignadas_a.*' => ['required', 'uuid', 'distinct'],
            'prioridad' => ['required', Rule::in(['baja', 'media', 'alta', 'urgente'])],
            'fecha_limite' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    private function nullableTrimmed(string $key): ?string
    {
        $value = trim((string) $this->input($key));

        return $value !== '' ? $value : null;
    }
}
