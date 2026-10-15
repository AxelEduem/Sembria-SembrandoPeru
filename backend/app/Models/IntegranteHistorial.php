<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IntegranteHistorial extends Model
{
    protected $table = 'integrantes_historial';

    protected $fillable = [
        'integrante_id',
        'tipo_integrante',
        'cargo_id',
        'fecha_inicio',
        'fecha_fin',
        'periodo_meses',
        'estado',
        'requiere_asistencia',   // 🆕 NUEVO
        'fecha_desactivacion',
        'desactivado_por',
        'motivo_desactivacion',
        'tipo_desactivacion',
        'institucion_educativa',
        'horas_practicas_requeridas',
        'carrera',
        'ciclo',
        'modalidad',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date:Y-m-d',
            'fecha_fin' => 'date:Y-m-d',
            'fecha_desactivacion' => 'datetime',
            'periodo_meses' => 'integer',
            'horas_practicas_requeridas' => 'integer',
            'requiere_asistencia' => 'boolean',   // 🆕 NUEVO
        ];
    }

    public function integrante(): BelongsTo
    {
        return $this->belongsTo(Integrante::class);
    }

    public function cargo(): BelongsTo
    {
        return $this->belongsTo(Cargo::class);
    }

    public function desactivador(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'desactivado_por');
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(IntegranteHorario::class, 'historial_id');
    }

    public function accesos(): HasMany
    {
        return $this->hasMany(IntegranteAplicacion::class, 'historial_id');
    }
}
