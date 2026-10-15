<?php

namespace App\Http\Requests\Tareas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTareaStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'estado' => ['required', Rule::in(['en_progreso', 'completada', 'cancelada'])],
        ];
    }
}
