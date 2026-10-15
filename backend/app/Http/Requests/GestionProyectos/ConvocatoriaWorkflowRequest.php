<?php

namespace App\Http\Requests\GestionProyectos;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConvocatoriaWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return match ($this->route()?->getName()) {
            'gp.convocatorias.aprobacion.store' => [
                'decision' => ['required', Rule::in(['aprobada', 'rechazada'])],
                'observacion' => [
                    Rule::requiredIf(fn () => $this->input('decision') === 'rechazada'),
                    'nullable', 'string', 'max:5000',
                ],
            ],
            'gp.postulaciones.items.store', 'gp.postulaciones.items.update' => $this->itemRules(),
            'gp.postulaciones.envio.store' => [
                'lider_idear_nombre' => ['required', 'string', 'max:255'],
                'fecha_identificacion' => ['required', 'date'],
                'fecha_revision_diseno' => ['required', 'date'],
                'fecha_revision_evidencias' => ['required', 'date'],
                'fecha_revision_armado' => ['required', 'date'],
                'fecha_revision_primera_replica' => ['required', 'date'],
                'fecha_envio' => ['required', 'date'],
                'plazo_respuesta_dias' => ['required', 'integer', Rule::in([30, 45])],
                'rango_postulacion' => [
                    'required',
                    Rule::in(['0_15', '15_25', '25_50', '50_100', '100_200', '200_mas']),
                ],
            ],
            'gp.postulaciones.documentos.upload' => [
                'archivo' => [
                    'required', 'file', 'max:20480',
                    'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp',
                ],
            ],
            'gp.postulaciones.documentos.delete' => [
                'path' => ['required', 'string', 'max:2000'],
            ],
            'gp.seguimientos.eventos.store' => [
                'tipo' => ['required', 'string', 'max:50'],
                'descripcion' => ['nullable', 'string', 'max:5000'],
                'fecha_evento' => ['nullable', 'date'],
            ],
            'gp.seguimientos.comunicaciones.store', 'gp.seguimientos.comunicaciones.update' => [
                'fecha' => ['nullable', 'date'],
                'direccion' => ['required', Rule::in(['recibida', 'enviada'])],
                'canal' => ['required', 'string', 'max:50'],
                'asunto' => ['nullable', 'string', 'max:1000'],
                'remitente' => ['nullable', 'string', 'max:1000'],
                'destinatarios' => ['nullable', 'string', 'max:2000'],
                'resumen' => ['required', 'string', 'max:5000'],
                'requiere_respuesta' => ['sometimes', 'boolean'],
                'fecha_limite' => ['nullable', 'date'],
                'evidencia' => ['nullable', 'string', 'max:2000'],
            ],
            'gp.seguimientos.solicitudes.store', 'gp.seguimientos.solicitudes.update' => [
                'descripcion' => ['required', 'string', 'max:5000'],
                'responsable_id' => ['nullable', 'uuid', 'exists:cuentas_acceso,id'],
                'fecha_limite' => ['nullable', 'date'],
                'fecha_recepcion' => ['nullable', 'date'],
                'observaciones' => ['nullable', 'string', 'max:5000'],
            ],
            'gp.seguimientos.solicitudes.respond' => [
                'respuesta' => ['nullable', 'string', 'max:5000'],
                'evidencia' => ['nullable', 'string', 'max:2000'],
                'cancelar' => ['sometimes', 'boolean'],
            ],
            'gp.seguimientos.resultado.store' => [
                'tipo_resultado' => ['required', Rule::in(['adjudicada', 'no_adjudicada'])],
                'fecha' => ['required', 'date'],
                'observacion' => ['nullable', 'string', 'max:5000'],
                'evidencia' => ['nullable', 'string', 'max:2000'],
                'comunicacion_id' => ['nullable', 'integer'],
            ],
            'gp.convocatorias.archive' => [
                'motivo' => ['required', 'string', 'max:5000'],
            ],
            default => [],
        };
    }

    private function itemRules(): array
    {
        return match ((string) $this->route('seccion')) {
            'checklist' => [
                'categoria' => ['sometimes', 'string', 'max:255'],
                'titulo' => ['sometimes', 'string', 'max:255'],
                'requerido' => ['sometimes', 'boolean'],
                'completado' => ['sometimes', 'boolean'],
                'observaciones' => ['nullable', 'string', 'max:5000'],
                'orden' => ['sometimes', 'integer', 'min:0'],
            ],
            'documentos' => [
                'nombre' => ['sometimes', 'string', 'max:255'],
                'categoria' => ['sometimes', 'string', 'max:30'],
                'descripcion' => ['nullable', 'string', 'max:5000'],
                'archivo_url' => ['nullable', 'string', 'max:2000'],
                'estado' => ['sometimes', Rule::in(['pendiente', 'cargado', 'validado', 'observado'])],
                'requerido' => ['sometimes', 'boolean'],
                'observaciones' => ['nullable', 'string', 'max:5000'],
            ],
            'propuestas' => [
                'tipo' => ['sometimes', Rule::in(['proposal', 'budget'])],
                'estado' => ['sometimes', Rule::in(['pendiente', 'en_proceso', 'completada', 'bloqueada'])],
                'responsable_id' => ['nullable', 'uuid', 'exists:cuentas_acceso,id'],
                'fecha_limite' => ['nullable', 'date'],
                'enlace_documento' => ['nullable', 'url', 'max:2000'],
                'observaciones' => ['nullable', 'string', 'max:5000'],
            ],
            default => ['seccion' => ['prohibited']],
        };
    }
}
