<?php

namespace App\Http\Resources\Asistencia;

use App\Services\Asistencia\AttendanceEvidenceUrlService;
use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceTrackingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatarUrl = app(AvatarService::class)->url($this->avatar_path ?? null);

        return [
            'integrante_id' => (int) $this->integrante_id,
            'integrante' => $this->integrante,
            'correo' => $this->correo ?? null,

            'avatar_path' => $this->avatar_path ?? null,
            'avatar_url' => $avatarUrl,

            'cargo_id' => $this->cargo_id === null ? null : (int) $this->cargo_id,
            'cargo' => $this->cargo ?? null,
            'area' => $this->area,
            'horario_id' => $this->horario_id === null ? null : (int) $this->horario_id,
            'fecha' => $this->fecha,
            'hora_inicio_programada' => $this->hora_inicio_programada,
            'hora_fin_programada' => $this->hora_fin_programada,
            'asistencia_id' => $this->asistencia_id === null ? null : (int) $this->asistencia_id,
            'estado' => $this->estado,
            'hora_entrada' => $this->hora_entrada,
            'hora_salida' => $this->hora_salida,
            'minutos_realizados' => (int) $this->minutos_realizados,
            'minutos_tardanza' => (int) $this->minutos_tardanza,
            'minutos_salida_anticipada' => (int) $this->minutos_salida_anticipada,
            'minutos_incumplidos' => (int) $this->minutos_incumplidos,
            'descripcion_jornada' => $this->descripcion_jornada,
            'evidencia_url' => $this->evidenceUrl(),
            'incidencias' => $this->incidencias,
            'justificacion_estado' => $this->justificacion_estado,
            'justificacion_motivo' => $this->justificacion_motivo ?? null,
            'justificacion_id' => $this->justificacion_id === null ? null : (int) $this->justificacion_id,
            'justificacion_tipo' => $this->justificacion_tipo ?? null,
            'justificacion_observacion' => $this->justificacion_observacion ?? null,
            'amonestaciones' => (int) ($this->amonestaciones ?? 0),
        ];
    }

    private function evidenceUrl(): ?string
    {
        return app(AttendanceEvidenceUrlService::class)->url($this->evidencia_path);
    }
}
