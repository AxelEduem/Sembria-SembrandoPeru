<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;

class AssignApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'aplicacion_id' => ['required', 'integer', 'exists:aplicaciones,id'],
            'historial_id' => ['required', 'integer', 'exists:integrantes_historial,id'],
        ];
    }
}
