<?php

namespace App\Http\Requests\Tareas;

class UpdateTareaRequest extends CreateTareaRequest
{
    public function rules(): array
    {
        return parent::rules();
    }
}
