<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudCambioHorarioDetalle extends Model
{
    public $timestamps = false;

    protected $table = 'solicitudes_cambio_horario_detalle';

    protected $fillable = ['dia_semana', 'hora_inicio', 'hora_fin'];

    protected function casts(): array
    {
        return ['dia_semana' => 'integer'];
    }

    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudCambioHorario::class, 'solicitud_id');
    }
}
