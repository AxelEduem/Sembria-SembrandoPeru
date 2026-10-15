<?php

namespace App\Http\Requests\GestionProyectos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveFuenteFinanciamientoRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'nombre' => trim((string) $this->input('nombre')),
            'tipo' => $this->input('tipo') ?: 'otra',
            'sitio_web' => $this->nullableTrimmed('sitio_web'),
            'descripcion' => $this->nullableTrimmed('descripcion'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:200'],
            'tipo' => ['required', Rule::in(['multilateral', 'embajada', 'empresa', 'promotor', 'otra'])],
            'sitio_web' => ['nullable', 'url:http,https', 'max:2048'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
        ];
    }

    private function nullableTrimmed(string $key): ?string
    {
        $value = trim((string) $this->input($key));

        return $value !== '' ? $value : null;
    }
}
