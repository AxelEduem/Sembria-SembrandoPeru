<?php

namespace App\Models\GestionProyectos;

use Illuminate\Database\Eloquent\Model;

class PostulacionSeguimiento extends Model
{
    protected $table = 'gp_postulacion_seguimientos';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_estimada_decision' => 'date:Y-m-d',
            'fecha_cierre' => 'datetime',
            'fecha_resultado' => 'date:Y-m-d',
        ];
    }
}
