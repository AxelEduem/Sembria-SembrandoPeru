<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SolicitudCambioHorario extends Model
{
    protected $table = 'solicitudes_cambio_horario';

    protected $fillable = [
        'integrante_id', 'historial_anterior_id', 'estado', 'fecha_solicitud',
        'fecha_efectiva', 'motivo', 'fecha_resolucion', 'resuelto_por',
        'observacion_resolucion', 'historial_nuevo_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'fecha_solicitud' => 'datetime',
            'fecha_efectiva' => 'date:Y-m-d',
            'fecha_resolucion' => 'datetime',
        ];
    }

    public function integrante(): BelongsTo
    {
        return $this->belongsTo(Integrante::class);
    }

    public function historialAnterior(): BelongsTo
    {
        return $this->belongsTo(IntegranteHistorial::class, 'historial_anterior_id');
    }

    public function historialNuevo(): BelongsTo
    {
        return $this->belongsTo(IntegranteHistorial::class, 'historial_nuevo_id');
    }

    public function detalle(): HasMany
    {
        return $this->hasMany(SolicitudCambioHorarioDetalle::class, 'solicitud_id');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'created_by');
    }

    public function resolvedor(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'resuelto_por');
    }
}
