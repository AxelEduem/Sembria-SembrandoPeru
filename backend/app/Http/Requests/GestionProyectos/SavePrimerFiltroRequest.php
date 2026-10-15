<?php

namespace App\Http\Requests\GestionProyectos;

use Illuminate\Foundation\Http\FormRequest;

class SavePrimerFiltroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'evaluaciones' => ['required', 'array', 'size:8'],
            'evaluaciones.*.criterio_codigo' => ['required', 'string', 'distinct'],
            'evaluaciones.*.estado_revision' => ['required', 'in:cumple,no_cumple'],
            'evaluaciones.*.observacion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
