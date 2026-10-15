<?php

namespace App\Http\Requests\Aplicaciones;

use Illuminate\Foundation\Http\FormRequest;

class SetAplicacionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['activo' => ['required', 'boolean']];
    }
}
