<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsistenciaPermisoFecha extends Model
{
    protected $table = 'asistencia_permiso_fechas';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['fecha' => 'date:Y-m-d'];
    }

    public function permiso(): BelongsTo
    {
        return $this->belongsTo(AsistenciaPermiso::class, 'permiso_id');
    }
}
