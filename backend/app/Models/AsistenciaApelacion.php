<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsistenciaApelacion extends Model
{
    protected $table = 'asistencia_apelaciones';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['fecha_resolucion' => 'immutable_datetime'];
    }
}
