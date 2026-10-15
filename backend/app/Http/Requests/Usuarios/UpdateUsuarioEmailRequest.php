<?php

namespace App\Http\Requests\Usuarios;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUsuarioEmailRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'correo' => mb_strtolower(trim((string) $this->input('correo')), 'UTF-8'),
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'correo' => [
                'required',
                'string',
                'email:rfc',
                'max:255',
                'regex:/^[^\s@]+@sembrandoperu\.org$/i',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'correo.required' => 'El correo es obligatorio.',
            'correo.email' => 'El correo no es válido.',
            'correo.regex' => 'El correo debe usar el dominio @sembrandoperu.org.',
        ];
    }
}