<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResolveWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', Rule::in(['aprobada', 'rechazada'])],
            'observacion' => ['nullable', 'required_if:estado,rechazada', 'string', 'min:5', 'max:1000'],
        ];
    }
}
