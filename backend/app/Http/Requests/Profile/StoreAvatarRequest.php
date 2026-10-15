<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class StoreAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'file',
                'mimetypes:image/jpeg,image/png,image/webp',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'avatar.required' => 'Selecciona una foto para continuar.',
            'avatar.file' => 'La foto enviada no es un archivo válido.',
            'avatar.mimetypes' => 'La foto debe ser JPG, PNG o WebP.',
            'avatar.mimes' => 'La foto debe ser JPG, PNG o WebP.',
            'avatar.max' => 'La foto debe pesar como máximo 2 MB.',
        ];
    }
}
