<?php

namespace App\Models\GestionProyectos;

use App\Models\CuentaAcceso;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Postulacion extends Model
{
    protected $table = 'gp_postulaciones';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_limite' => 'date:Y-m-d',
            'fecha_envio' => 'date:Y-m-d',
            'fecha_identificacion' => 'date:Y-m-d',
            'fecha_revision_diseno' => 'date:Y-m-d',
            'fecha_revision_evidencias' => 'date:Y-m-d',
            'fecha_revision_armado' => 'date:Y-m-d',
            'fecha_revision_primera_replica' => 'date:Y-m-d',
        ];
    }

    public function enviada(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'enviada_por');
    }

    public function seguimientos(): HasMany
    {
        return $this->hasMany(PostulacionSeguimiento::class, 'postulacion_id');
    }
}
