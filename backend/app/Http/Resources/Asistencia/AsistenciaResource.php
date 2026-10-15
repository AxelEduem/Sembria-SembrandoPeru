<?php

namespace App\Http\Resources\Asistencia;

use App\Services\Asistencia\AttendanceEvidenceUrlService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AsistenciaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $recovery = $this->relationLoaded('recuperacion') ? $this->recuperacion : null;

        return [
            'id' => $this->id,
            'integrante_id' => $this->integrante_id,
            'historial_id' => $this->historial_id,
            'horario_id' => $this->horario_id,
            'tipo_bloque' => $recovery ? 'recuperacion' : 'normal',
            'recuperacion_id' => $recovery?->id,
            'fecha' => $this->fecha?->format('Y-m-d'),
            'hora_inicio_programada' => $this->hora_inicio_programada,
            'hora_fin_programada' => $this->hora_fin_programada,
            'hora_entrada' => $this->hora_entrada?->toISOString(),
            'fuente_entrada' => $this->fuente_entrada,
            'hora_salida' => $this->hora_salida?->toISOString(),
            'fuente_salida' => $this->fuente_salida,
            'minutos_programados' => (int) $this->minutos_programados,
            'minutos_realizados' => (int) $this->minutos_realizados,
            'minutos_tardanza' => (int) $this->minutos_tardanza,
            'minutos_salida_anticipada' => (int) $this->minutos_salida_anticipada,
            'minutos_incumplidos' => (int) $this->minutos_incumplidos,
            'estado' => $this->estado,
            'observacion' => $this->observacion,
            'descripcion_jornada' => $this->descripcion_jornada,
            'evidencia_url' => $this->evidenceUrl(),
            'asistencia_incidencias' => $this->whenLoaded(
                'incidencias',
                fn () => $this->incidencias->map(fn ($row) => [
                    'id' => $row->id,
                    'tipo' => $row->tipo,
                    'minutos' => (int) $row->minutos,
                    'descripcion' => $row->descripcion,
                    'created_at' => $row->created_at?->toISOString(),
                ])->values()
            ),
            'asistencia_justificaciones' => $this->whenLoaded(
                'justificaciones',
                fn () => $this->justificaciones->map(fn ($row) => [
                    'id' => $row->id,
                    'motivo' => $row->motivo,
                    'estado' => $row->estado,
                    'fecha_registro' => $row->fecha_registro?->toISOString(),
                    'fecha_validacion' => $row->fecha_validacion?->toISOString(),
                    'observacion' => $row->observacion,
                    'adjunto_url' => $this->justificationAttachmentUrl($row->adjunto_path),
                    'recuperaciones' => $row->relationLoaded('recuperaciones')
                        ? $row->recuperaciones->values()
                        : [],
                ])->values()
            ),
            'asistencia_amonestaciones' => $this->whenLoaded(
                'amonestaciones',
                fn () => $this->amonestaciones->map(fn ($row) => [
                    'id' => $row->id,
                    'motivo' => $row->motivo,
                    'estado' => $row->estado,
                    'gravedad' => $row->gravedad,
                    'created_at' => $row->created_at?->toISOString(),
                ])->values()
            ),
        ];
    }

    private function evidenceUrl(): ?string
    {
        return app(AttendanceEvidenceUrlService::class)->url($this->evidencia_path);
    }

    private function justificationAttachmentUrl(?string $path): ?string
    {
        return app(AttendanceEvidenceUrlService::class)->url($path);
    }
}
