<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegranteHorario extends Model
{
    protected $table = 'integrante_horarios';

    protected $fillable = ['historial_id', 'dia_semana', 'hora_inicio', 'hora_fin'];

    public function historial(): BelongsTo
    {
        return $this->belongsTo(IntegranteHistorial::class, 'historial_id');
    }
}
