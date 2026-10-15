<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexMiHorarioHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'estado' => ['nullable', Rule::in(['Activo', 'Inactivo'])],
            'modalidad' => ['nullable', 'string', 'max:100'],
            'periodo' => ['nullable', 'integer', Rule::in([30, 90, 365])],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'between:1,50'],
        ];
    }
}
