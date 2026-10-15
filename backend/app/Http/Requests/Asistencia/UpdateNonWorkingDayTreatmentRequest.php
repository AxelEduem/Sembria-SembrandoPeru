<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNonWorkingDayTreatmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'requiere_asistencia' => ['required', 'boolean'],
            'motivo' => ['nullable', 'string', 'max:500'],
        ];
    }
}
