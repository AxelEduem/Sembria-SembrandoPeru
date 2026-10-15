<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class CloseAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'hora_salida' => ['required', 'date'],
            'descripcion' => ['required', 'string', 'min:5', 'max:2000'],
            'motivo' => ['required', 'string', 'min:5', 'max:1000'],
        ];
    }
}
