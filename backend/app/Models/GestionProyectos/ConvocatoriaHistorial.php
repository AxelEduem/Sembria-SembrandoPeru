<?php

namespace App\Models\GestionProyectos;

use App\Models\CuentaAcceso;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConvocatoriaHistorial extends Model
{
    protected $table = 'gp_convocatoria_historial';

    protected $guarded = [];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'actor_id');
    }
}
