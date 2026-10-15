<?php

namespace App\Http\Requests\GestionProyectos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteCapacitacionStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['etapa' => (int) $this->route('etapa')]);
    }

    public function rules(): array
    {
        return ['etapa' => ['required', 'integer', Rule::in([1, 2, 3])]];
    }
}
