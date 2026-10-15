<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;

class DeactivateIntegranteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['motivo' => ['required', 'string', 'max:1000']];
    }
}
