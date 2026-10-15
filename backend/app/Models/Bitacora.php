<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bitacora extends Model
{
    protected $table = 'bitacora';

    public $timestamps = false;

    protected $fillable = [
        'cuenta_acceso_id',
        'area_id',
        'actor_nombre',
        'actor_correo',
        'actor_avatar_path',
        'area_nombre',
        'modulo',
        'accion',
        'descripcion',
        'entidad_tipo',
        'entidad_id',
        'metodo',
        'ruta',
        'estado_http',
        'resultado',
        'campos_modificados',
        'contexto',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'campos_modificados' => 'array',
            'contexto' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function cuentaAcceso(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'cuenta_acceso_id');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }
}
