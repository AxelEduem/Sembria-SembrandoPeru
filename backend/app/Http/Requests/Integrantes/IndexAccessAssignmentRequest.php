<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAccessAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'inactive' => ['sometimes', 'boolean'],
            'q' => ['sometimes', 'string', 'max:255'],
            'area' => ['sometimes', 'string', 'max:150'],
            'cargo' => ['sometimes', 'string', 'max:150'],
            'tipo' => ['sometimes', Rule::in(['voluntario', 'practicante', 'gerente'])],
            'app' => ['sometimes', 'integer', 'exists:aplicaciones,id'],
        ];
    }
}
