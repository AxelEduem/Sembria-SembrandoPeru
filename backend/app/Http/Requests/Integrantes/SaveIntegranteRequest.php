<?php

namespace App\Http\Requests\Integrantes;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveIntegranteRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('tipo_integrante') !== 'practicante') {
            $this->merge([
                'institucion_educativa' => null,
                'horas_practicas_requeridas' => null,
                'carrera' => null,
                'ciclo' => null,
            ]);
        }

        if ($this->input('tipo_integrante') === 'gerente') {
            $this->merge([
                'fecha_fin' => null,
                'periodo_meses' => null,
            ]);
        }
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $integranteId = $this->route('integrante')?->id ?? $this->route('integrante');

        return [
            'tipo_integrante' => ['required', Rule::in(['voluntario', 'practicante', 'gerente'])],
            'nombres' => ['required', 'string', 'max:150', 'regex:/^[\pL\s]+$/u'],
            'apellidos' => ['required', 'string', 'max:150', 'regex:/^[\pL\s]+$/u'],
            'fecha_nacimiento' => ['required', 'date', 'before_or_equal:today'],
            'documento_identidad' => [
                'required', 'string', 'max:20',
                Rule::unique('integrantes', 'documento_identidad')->ignore($integranteId),
            ],
            'tipo_documento' => ['required', Rule::in(['dni', 'ruc', 'carnet de extranjeria'])],
            'telefono' => ['required', 'string', 'max:30'],
            'modalidad' => ['required', 'string', 'max:100'],
            'cargo_id' => ['required', 'integer', 'exists:cargos,id'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'periodo_meses' => ['nullable', 'integer', 'min:1'],
            'institucion_educativa' => ['nullable', 'string', 'max:255'],
            'horas_practicas_requeridas' => ['nullable', 'integer', 'min:1'],
            'carrera' => ['nullable', 'string', 'max:255'],
            'ciclo' => ['nullable', 'string', 'max:100'],
            'departamento' => ['nullable', 'string', 'max:150'],
            'ciudad' => ['nullable', 'string', 'max:150'],
            'distrito' => ['nullable', 'string', 'max:150'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $type = $this->string('tipo_integrante')->toString();

            // Todos requieren fecha_inicio
            if (! $this->filled('fecha_inicio')) {
                $validator->errors()->add('fecha_inicio', 'La fecha de inicio es obligatoria.');
            }

            // Solo voluntarios y practicantes requieren fecha_fin
            if ($type !== 'gerente') {
                if (! $this->filled('fecha_fin')) {
                    $validator->errors()->add('fecha_fin', 'La fecha de fin es obligatoria.');
                }

                if ($this->filled('fecha_inicio') && $this->filled('fecha_fin')) {
                    $start = CarbonImmutable::parse($this->input('fecha_inicio'));
                    $end = CarbonImmutable::parse($this->input('fecha_fin'));
                    if ($end->lt($start->addMonth())) {
                        $validator->errors()->add('fecha_fin', 'El periodo debe tener una duración mínima de 1 mes.');
                    }
                }
            }

            if ($type === 'practicante') {
                foreach (['institucion_educativa', 'carrera', 'ciclo', 'horas_practicas_requeridas'] as $field) {
                    if (! $this->filled($field)) {
                        $validator->errors()->add($field, 'Este campo es obligatorio para practicantes.');
                    }
                }
            }

            $document = (string) $this->input('documento_identidad');
            $documentType = $this->input('tipo_documento');
            if ($documentType === 'dni' && ! preg_match('/^\d{8}$/', $document)) {
                $validator->errors()->add('documento_identidad', 'El DNI debe contener exactamente 8 dígitos.');
            }
            if ($documentType === 'ruc' && ! preg_match('/^\d{11}$/', $document)) {
                $validator->errors()->add('documento_identidad', 'El RUC debe contener exactamente 11 dígitos.');
            }
            if ($documentType === 'carnet de extranjeria' && ! preg_match('/^[a-z0-9-]{5,20}$/i', $document)) {
                $validator->errors()->add('documento_identidad', 'El carnet de extranjería debe tener entre 5 y 20 caracteres.');
            }
        }];
    }
}
