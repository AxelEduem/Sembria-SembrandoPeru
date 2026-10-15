<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangeTemporaryPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'min:8', 'max:128', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'La nueva contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener entre 8 y 128 caracteres.',
            'password.max' => 'La contraseña debe tener entre 8 y 128 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ];
    }
}
