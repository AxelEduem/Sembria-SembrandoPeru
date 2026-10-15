<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class SuggestIncidentRecoveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'minutos' => ['required', 'integer', 'min:1', 'max:1440'],
            'desde' => ['required', 'date_format:Y-m-d'],
            'dias' => ['required', 'integer', 'min:1', 'max:30'],
        ];
    }
}
