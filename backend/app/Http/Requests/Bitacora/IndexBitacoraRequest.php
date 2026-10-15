<?php

namespace App\Http\Requests\Bitacora;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexBitacoraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'q' => trim((string) $this->input('q', '')),
            'modulo' => trim((string) $this->input('modulo', '')),
            'accion' => trim((string) $this->input('accion', '')),
            'resultado' => trim((string) $this->input('resultado', '')),
        ]);
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:120'],
            'modulo' => ['nullable', 'string', 'max:100'],
            'accion' => ['nullable', 'string', 'max:100'],
            'resultado' => ['nullable', Rule::in(['exitoso', 'error'])],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ];
    }
}
