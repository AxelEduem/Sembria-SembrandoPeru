<?php

namespace App\Http\Requests\GestionProyectos;

use Illuminate\Foundation\Http\FormRequest;

class SaveEquipoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:120'],
            'lider_integrante_id' => ['required', 'integer', 'exists:integrantes,id'],
            'integrante_ids' => ['present', 'array'],
            'integrante_ids.*' => ['integer', 'distinct', 'exists:integrantes,id'],
        ];
    }
}
