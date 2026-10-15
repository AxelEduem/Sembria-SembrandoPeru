<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificacionAsistencia extends Model
{
    protected $table = 'notificaciones_asistencia';

    protected $fillable = [
        'user_id', 'asistencia_id', 'tipo', 'titulo', 'mensaje', 'clave', 'read_at', 'dismissed_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'immutable_datetime',
            'dismissed_at' => 'immutable_datetime',
        ];
    }
}
