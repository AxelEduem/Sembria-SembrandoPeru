<?php

namespace App\Http\Requests\Cargos;

use Illuminate\Foundation\Http\FormRequest;

class SaveCargoRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $name = mb_strtoupper(trim((string) $this->input('nombre')), 'UTF-8');
        $description = trim((string) $this->input('descripcion'));

        $this->merge([
            'nombre' => $name,
            'descripcion' => $description !== '' ? $description : null,
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'area_id' => ['required', 'integer', 'exists:areas,id'],
        ];
    }
}
