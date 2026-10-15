<?php

namespace App\Models\GestionProyectos;

use App\Models\CuentaAcceso;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConvocatoriaAprobacion extends Model
{
    protected $table = 'gp_convocatoria_aprobaciones';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['decidido_at' => 'datetime'];
    }

    public function decisor(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'decidido_por');
    }
}
