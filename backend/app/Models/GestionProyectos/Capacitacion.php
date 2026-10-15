<?php

namespace App\Models\GestionProyectos;

use App\Models\CuentaAcceso;
use App\Models\Integrante;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Capacitacion extends Model
{
    protected $table = 'gp_capacitaciones';

    protected $fillable = [
        'integrante_id',
        'fase_1_completada_at',
        'fase_2_completada_at',
        'fase_3_completada_at',
        'actualizado_por',
    ];

    protected function casts(): array
    {
        return [
            'fase_1_completada_at' => 'datetime',
            'fase_2_completada_at' => 'datetime',
            'fase_3_completada_at' => 'datetime',
        ];
    }

    public function integrante(): BelongsTo
    {
        return $this->belongsTo(Integrante::class);
    }

    public function actualizador(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'actualizado_por');
    }
}
