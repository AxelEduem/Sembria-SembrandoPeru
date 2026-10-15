<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AsistenciaPermiso extends Model
{
    protected $table = 'asistencia_permisos';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['fecha_inicio' => 'date:Y-m-d', 'fecha_fin' => 'date:Y-m-d', 'fecha_resolucion' => 'immutable_datetime'];
    }

    public function integrante(): BelongsTo
    {
        return $this->belongsTo(Integrante::class);
    }

    public function recuperaciones(): HasMany
    {
        return $this->hasMany(AsistenciaRecuperacion::class, 'permiso_id');
    }

    public function fechas(): HasMany
    {
        return $this->hasMany(AsistenciaPermisoFecha::class, 'permiso_id');
    }
}
