<?php

namespace App\Http\Requests\Roles;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReplaceRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'permisos' => ['present', 'array'],
            'permisos.*.permiso_id' => ['required', 'integer', 'distinct', 'exists:permisos,id'],
            'permisos.*.alcance' => ['required', 'string', Rule::in(['area', 'global'])],
            'acceso_total' => ['sometimes', 'boolean'],
        ];
    }
}
