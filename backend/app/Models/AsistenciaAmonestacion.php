<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsistenciaAmonestacion extends Model
{
    protected $table = 'asistencia_amonestaciones';

    protected $fillable = ['asistencia_id', 'justificacion_id', 'integrante_id', 'motivo', 'estado', 'gravedad', 'registrado_por'];

    public function asistencia(): BelongsTo
    {
        return $this->belongsTo(Asistencia::class);
    }

    public function justificacion(): BelongsTo
    {
        return $this->belongsTo(AsistenciaJustificacion::class, 'justificacion_id');
    }
}
