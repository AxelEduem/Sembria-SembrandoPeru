<?php

namespace App\Http\Requests\GestionProyectos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveConvocatoriaRequest extends FormRequest
{
    private const ALLIANCE_TYPES = [
        'alianza_comunitaria',
        'alianza_institucional',
        'alianza_educativa',
        'investigadores',
        'profesionales',
        'sin_alianzas',
    ];

    private const BENEFICIARY_TYPES = [
        'emprendedores',
        'comunidades',
        'ongs',
        'organizaciones',
        'agricultores_campesinos',
        'mas_de_un_beneficiario',
    ];

    private const ORGANIZATION_TYPES = [
        'ongs',
        'personas_naturales',
        'investigadores',
        'empresas',
        'universidades',
        'profesionales',
        'otro',
    ];

    protected function prepareForValidation(): void
    {
        $nullable = [
            'url_convocatoria',
            'url_postulacion',
            'fecha_apertura',
            'fecha_cierre',
            'monto_minimo',
            'monto_maximo',
            'territorio',
            'beneficiario_ideal',
            'tipo_alianza',
            'tipo_organizacion_admitida',
            'tiempo_postulacion',
        ];
        $normalized = [
            'nombre' => trim((string) $this->input('nombre')),
            'financiador_nombre' => trim((string) $this->input('financiador_nombre')),
        ];

        foreach ($nullable as $key) {
            $value = $this->input($key);
            $normalized[$key] = is_string($value) ? (trim($value) ?: null) : $value;
        }

        if ($normalized['tiempo_postulacion'] === 'sin_limite') {
            $normalized['fecha_cierre'] = null;
        }

        if (in_array($normalized['tipo_alianza'], self::ALLIANCE_TYPES, true)) {
            $normalized['requiere_alianza'] = $normalized['tipo_alianza'] === 'sin_alianzas' ? 'no' : 'si';
        }

        $this->merge($normalized);
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'fuente_id' => [
                'required',
                'integer',
                Rule::exists('gp_fuentes_financiamiento', 'id')->where('activo', true),
            ],
            'nombre' => ['required', 'string', 'max:255'],
            'financiador_nombre' => ['required', 'string', 'max:255'],
            'url_convocatoria' => ['nullable', 'url:http,https', 'max:2048'],
            'url_postulacion' => ['nullable', 'url:http,https', 'max:2048'],
            'fecha_apertura' => ['nullable', 'date'],
            'tiempo_postulacion' => ['required', Rule::in(['sin_limite', 'con_limite'])],
            'fecha_cierre' => [
                'nullable',
                'required_if:tiempo_postulacion,con_limite',
                'date',
                'after:today',
                'after_or_equal:fecha_apertura',
            ],
            'monto_minimo' => ['nullable', 'numeric', 'min:0'],
            'monto_maximo' => ['nullable', 'numeric', 'min:0'],
            'moneda' => ['required', Rule::in(['USD', 'PEN', 'EUR', 'OTRA'])],
            'territorio' => ['nullable', Rule::in(['Perú', 'Latam'])],
            'sector' => ['required', Rule::in(['medio_ambiente', 'salud', 'educacion', 'fauna'])],
            'tipo_proyecto' => ['required', Rule::in(['piloto', 'investigacion', 'fortalecimiento', 'otro'])],
            'tipo_financiamiento' => ['required', Rule::in(['subvencion', 'cofinanciamiento', 'otro'])],
            'lleva_cofinanciamiento' => ['required', 'boolean'],
            'tipo_organizacion_admitida' => ['required', Rule::in(self::ORGANIZATION_TYPES)],
            'beneficiario_ideal' => ['nullable', Rule::in(self::BENEFICIARY_TYPES)],
            'requiere_alianza' => ['required', Rule::in(['si', 'no', 'no_especificado'])],
            'tipo_alianza' => ['required', Rule::in(self::ALLIANCE_TYPES)],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $minimum = $this->input('monto_minimo');
                $maximum = $this->input('monto_maximo');

                if ($minimum !== null && $maximum !== null && (float) $minimum > (float) $maximum) {
                    $validator->errors()->add('monto_maximo', 'El monto máximo debe ser mayor o igual al monto mínimo.');
                }

            },
        ];
    }
}
