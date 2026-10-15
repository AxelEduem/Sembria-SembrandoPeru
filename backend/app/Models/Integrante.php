<?php

namespace App\Models;

use App\Models\GestionProyectos\Capacitacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Integrante extends Model
{
    protected $fillable = [
        'estado',
        'persona_id',
        'avatar_path',
        'fecha_nacimiento',
        'documento_identidad',
        'tipo_documento',
        'telefono',
        'accesos_pendientes_revision',
        'accesos_retirados',
        'accesos_retirados_at',
        'departamento',
        'ciudad',
        'distrito',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date:Y-m-d',
            'accesos_pendientes_revision' => 'boolean',
            'accesos_retirados' => 'boolean',
            'accesos_retirados_at' => 'datetime',
        ];
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
    }

    public function historiales(): HasMany
    {
        return $this->hasMany(IntegranteHistorial::class)->latest('created_at')->latest('id');
    }

    public function capacitacionGestionProyectos(): HasOne
    {
        return $this->hasOne(Capacitacion::class, 'integrante_id');
    }
}
