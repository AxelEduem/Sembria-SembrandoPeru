<?php

namespace App\Http\Requests\Integrantes;

class StoreSolicitudCambioHorarioRequest extends SaveHorarioRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'fecha_efectiva' => ['required', 'date', 'after:today'],
            'motivo' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
