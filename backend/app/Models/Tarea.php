<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tarea extends Model
{
    protected $fillable = [
        'titulo',
        'descripcion',
        'asignada_por',
        'asignada_a',
        'prioridad',
        'estado',
        'fecha_limite',
        'completada_at',
    ];

    protected function casts(): array
    {
        return [
            'fecha_limite' => 'date:Y-m-d',
            'completada_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'asignada_por');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'asignada_a');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(
            CuentaAcceso::class,
            'tarea_responsables',
            'tarea_id',
            'cuenta_id'
        )->withTimestamps();
    }

    public function notes(): HasMany
    {
        return $this->hasMany(TareaNota::class, 'tarea_id')->oldest('created_at')->oldest('id');
    }
}
