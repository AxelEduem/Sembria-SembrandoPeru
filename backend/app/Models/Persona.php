<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Persona extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'nombres',
        'apellidos',
        'correo',
        'ultimo_envio_credenciales',
        'password_temporal_expira_en',
    ];

    protected function casts(): array
    {
        return [
            'ultimo_envio_credenciales' => 'datetime',
            'password_temporal_expira_en' => 'datetime',
        ];
    }

    public function integrantes(): HasMany
    {
        return $this->hasMany(Integrante::class);
    }

    public function cuentaAcceso(): HasOne
    {
        return $this->hasOne(CuentaAcceso::class);
    }
}
