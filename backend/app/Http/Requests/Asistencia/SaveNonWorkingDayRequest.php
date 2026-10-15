<?php

namespace App\Http\Requests\Asistencia;

use Illuminate\Foundation\Http\FormRequest;

class SaveNonWorkingDayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['fecha' => ['required', 'date_format:Y-m-d'], 'nombre' => ['required', 'string', 'min:3', 'max:150']];
    }
}
