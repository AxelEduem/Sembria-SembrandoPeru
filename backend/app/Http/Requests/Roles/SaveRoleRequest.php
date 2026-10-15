<?php

namespace App\Http\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;

class SaveRoleRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $description = trim((string) $this->input('descripcion'));

        $this->merge([
            'codigo' => mb_strtolower(trim((string) $this->input('codigo')), 'UTF-8'),
            'nombre' => mb_strtoupper(trim((string) $this->input('nombre')), 'UTF-8'),
            'descripcion' => $description !== '' ? $description : null,
            'acceso_total' => $this->boolean('acceso_total'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/'],
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'acceso_total' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.regex' => 'El código solo puede contener letras minúsculas, números y guiones bajos.',
        ];
    }
}
