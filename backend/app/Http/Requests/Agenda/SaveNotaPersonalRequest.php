<?php

namespace App\Http\Requests\Agenda;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveNotaPersonalRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $content = trim((string) $this->input('contenido'));

        $this->merge([
            'titulo' => trim((string) $this->input('titulo')),
            'contenido' => $content !== '' ? $content : null,
            'fijada' => $this->boolean('fijada'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'min:2', 'max:140'],
            'contenido' => ['nullable', 'string', 'max:10000'],
            'color' => ['required', Rule::in(['amarillo', 'verde', 'azul', 'violeta', 'rosa'])],
            'fijada' => ['required', 'boolean'],
        ];
    }
}
