<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResolveSolicitudCambioHorarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'accion' => strtoupper((string) $this->input('accion')),
            'observacion' => is_string($this->input('observacion'))
                ? trim($this->input('observacion'))
                : $this->input('observacion'),
        ]);
    }

    public function rules(): array
    {
        return [
            'accion' => ['required', Rule::in(['APROBADA', 'RECHAZADA', 'REQUIERE_CORRECCION'])],
            'observacion' => [
                'nullable',
                'string',
                'max:2000',
                Rule::requiredIf(fn (): bool => in_array(
                    $this->input('accion'),
                    ['RECHAZADA', 'REQUIERE_CORRECCION'],
                    true,
                )),
            ],
        ];
    }
}
