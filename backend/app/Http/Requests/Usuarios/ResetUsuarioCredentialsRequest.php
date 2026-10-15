<?php

namespace App\Http\Requests\Usuarios;

use Illuminate\Foundation\Http\FormRequest;

class ResetUsuarioCredentialsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
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
            'enviar_correo' => ['required', 'boolean'],
        ];
    }
}
