<?php

namespace App\Http\Requests\Usuarios;

use Illuminate\Foundation\Http\FormRequest;

class ConfigureUsuarioAccessRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'correo' => mb_strtolower(trim((string) $this->input('correo')), 'UTF-8'),
            'enviar_correo' => $this->boolean('enviar_correo'),
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
            'password' => ['required', 'string', 'min:8', 'max:128'],
            'enviar_correo' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'correo.regex' => 'El correo debe usar el dominio @sembrandoperu.org.',
            'password.min' => 'La contraseña debe tener entre 8 y 128 caracteres.',
            'password.max' => 'La contraseña debe tener entre 8 y 128 caracteres.',
        ];
    }
}
