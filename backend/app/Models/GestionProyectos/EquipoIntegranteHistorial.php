<?php

namespace App\Models\GestionProyectos;

use App\Models\CuentaAcceso;
use App\Models\Integrante;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipoIntegranteHistorial extends Model
{
    protected $table = 'gp_equipo_integrantes_historial';

    protected $fillable = [
        'equipo_id',
        'integrante_id',
        'accion',
        'rol_anterior',
        'rol_nuevo',
        'realizado_por',
    ];

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class);
    }

    public function integrante(): BelongsTo
    {
        return $this->belongsTo(Integrante::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'realizado_por');
    }
}
