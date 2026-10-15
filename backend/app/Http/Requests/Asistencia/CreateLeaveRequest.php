<?php

namespace App\Http\Requests\Asistencia;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $today = CarbonImmutable::now('America/Lima')->toDateString();

        return [
            'tipo' => ['required', Rule::in(['personal', 'medico', 'vacaciones'])],
            'fechas' => ['required', 'array', 'min:1', 'max:60'],
            'fechas.*' => ['required', 'date_format:Y-m-d', "after_or_equal:{$today}", 'distinct'],
            'motivo' => ['required', 'string', 'min:5', 'max:2000'],
            'adjunto' => [Rule::requiredIf(fn (): bool => $this->input('tipo') === 'medico'), 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'recuperaciones' => ['sometimes', 'array', 'max:30'],
            'recuperaciones.*.fecha' => ['required', 'date_format:Y-m-d'],
            'recuperaciones.*.hora_inicio' => ['required', 'date_format:H:i'],
            'recuperaciones.*.hora_fin' => ['required', 'date_format:H:i', 'after:recuperaciones.*.hora_inicio'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            $lastPermissionDate = collect($this->input('fechas', []))->filter()->max();
            if (! $lastPermissionDate) {
                return;
            }

            foreach ($this->input('recuperaciones', []) as $index => $recovery) {
                if (($recovery['fecha'] ?? null) && $recovery['fecha'] <= $lastPermissionDate) {
                    $validator->errors()->add(
                        "recuperaciones.{$index}.fecha",
                        'La recuperación debe programarse después de la última fecha del permiso.',
                    );
                }
            }
        }];
    }

    public function messages(): array
    {
        return [
            'adjunto.required' => 'Debes adjuntar el certificado médico para solicitar un permiso médico.',
            'fechas.required' => 'Selecciona al menos una fecha para el permiso.',
            'fechas.min' => 'Selecciona al menos una fecha para el permiso.',
            'fechas.*.distinct' => 'No puedes seleccionar la misma fecha más de una vez.',
        ];
    }
}
