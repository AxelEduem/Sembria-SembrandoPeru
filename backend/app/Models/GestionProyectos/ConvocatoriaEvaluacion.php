<?php

namespace App\Models\GestionProyectos;

use App\Models\CuentaAcceso;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConvocatoriaEvaluacion extends Model
{
    protected $table = 'gp_convocatoria_evaluaciones';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['revisado_at' => 'datetime'];
    }

    public function revisor(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'revisado_por');
    }
}
