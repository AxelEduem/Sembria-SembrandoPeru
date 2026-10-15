<?php

namespace App\Http\Requests\Tareas;

use Illuminate\Foundation\Http\FormRequest;

class AddTareaNoteRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['contenido' => trim((string) $this->input('contenido'))]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['contenido' => ['required', 'string', 'max:2000']];
    }
}
