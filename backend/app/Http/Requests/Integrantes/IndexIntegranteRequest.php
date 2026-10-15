<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexIntegranteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'inactive' => ['sometimes', 'boolean'],
            'tipo_integrante' => ['sometimes', Rule::in(['voluntario', 'practicante', 'gerente'])],
            'q' => ['sometimes', 'string', 'max:150'],
            'area' => ['sometimes', 'integer', 'exists:areas,id'],
            'cargo' => ['sometimes', 'integer', 'exists:cargos,id'],
            'tipo' => ['sometimes', Rule::in(['voluntario', 'practicante', 'gerente'])],
            'periodo' => ['sometimes', 'integer', 'min:1'],
            'estado' => ['sometimes', Rule::in(['activo', 'inactivo'])],
            'fecha' => ['sometimes', 'date_format:Y-m-d'],
            'pagina' => ['sometimes', 'integer', 'min:1'],
            'por_pagina' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'con_cuenta' => ['sometimes', 'boolean'],
        ];
    }
}
