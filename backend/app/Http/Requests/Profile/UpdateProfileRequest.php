<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nombres' => ['required', 'string', 'max:150', 'regex:/^[\pL\s]+$/u'],
            'apellidos' => ['required', 'string', 'max:150', 'regex:/^[\pL\s]+$/u'],
        ];
    }
}
