<?php

namespace App\Http\Requests\Aplicaciones;

use Illuminate\Foundation\Http\FormRequest;

class SaveAplicacionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $description = trim((string) $this->input('descripcion'));

        $this->merge([
            'nombre' => trim((string) $this->input('nombre')),
            'descripcion' => $description !== '' ? $description : null,
            'area_id' => $this->filled('area_id') ? $this->input('area_id') : null,
        ]);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'licencias_total' => ['required', 'integer', 'min:1'],
            'area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'logo_file' => [
                'nullable',
                'file',
                'mimetypes:image/jpeg,image/png,image/webp,image/svg+xml',
                'mimes:jpg,jpeg,png,webp,svg',
                'max:2048',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'logo_file.file' => 'El logo enviado no es un archivo válido.',
            'logo_file.mimetypes' => 'El logo debe ser JPG, PNG, WEBP o SVG.',
            'logo_file.mimes' => 'El logo debe ser JPG, PNG, WEBP o SVG.',
            'logo_file.max' => 'El logo no puede superar los 2 MB.',
        ];
    }
}
