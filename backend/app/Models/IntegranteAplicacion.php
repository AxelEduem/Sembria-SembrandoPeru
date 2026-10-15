<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegranteAplicacion extends Model
{
    protected $table = 'integrante_aplicaciones';

    protected $fillable = ['historial_id', 'aplicacion_id', 'activo', 'fecha_retiro', 'retirado_por'];

    protected function casts(): array
    {
        return ['activo' => 'boolean', 'fecha_retiro' => 'datetime'];
    }

    public function historial(): BelongsTo
    {
        return $this->belongsTo(IntegranteHistorial::class, 'historial_id');
    }

    public function aplicacion(): BelongsTo
    {
        return $this->belongsTo(Aplicacion::class);
    }
}
