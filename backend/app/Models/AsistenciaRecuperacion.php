<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsistenciaRecuperacion extends Model
{
    protected $table = 'asistencia_recuperaciones';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['fecha' => 'date:Y-m-d', 'hora_entrada_real' => 'immutable_datetime', 'hora_salida_real' => 'immutable_datetime'];
    }

    public function permiso(): BelongsTo
    {
        return $this->belongsTo(AsistenciaPermiso::class, 'permiso_id');
    }

    public function justificacion(): BelongsTo
    {
        return $this->belongsTo(AsistenciaJustificacion::class, 'justificacion_id');
    }

    public function asistencia(): BelongsTo
    {
        return $this->belongsTo(Asistencia::class, 'asistencia_id');
    }
}
