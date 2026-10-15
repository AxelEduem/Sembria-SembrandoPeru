<?php

namespace App\Http\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;

class ReplaceRoleCargosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'cargo_ids' => ['present', 'array'],
            'cargo_ids.*' => ['required', 'integer', 'distinct', 'exists:cargos,id'],
        ];
    }
}
