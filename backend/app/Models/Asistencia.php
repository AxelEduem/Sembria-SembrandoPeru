<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Asistencia extends Model
{
    protected $fillable = [
        'integrante_id',
        'historial_id',
        'horario_id',
        'fecha',
        'hora_inicio_programada',
        'hora_fin_programada',
        'hora_entrada',
        'fuente_entrada',
        'entrada_client_event_id',
        'hora_salida',
        'fuente_salida',
        'salida_client_event_id',
        'minutos_programados',
        'minutos_realizados',
        'minutos_tardanza',
        'minutos_salida_anticipada',
        'minutos_incumplidos',
        'estado',
        'observacion',
        'descripcion_jornada',
        'evidencia_path',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date:Y-m-d',
            'hora_entrada' => 'immutable_datetime',
            'hora_salida' => 'immutable_datetime',
            'minutos_programados' => 'integer',
            'minutos_realizados' => 'integer',
            'minutos_tardanza' => 'integer',
            'minutos_salida_anticipada' => 'integer',
            'minutos_incumplidos' => 'integer',
        ];
    }

    public function integrante(): BelongsTo
    {
        return $this->belongsTo(Integrante::class);
    }

    public function historial(): BelongsTo
    {
        return $this->belongsTo(IntegranteHistorial::class, 'historial_id');
    }

    public function horario(): BelongsTo
    {
        return $this->belongsTo(IntegranteHorario::class, 'horario_id');
    }

    public function incidencias(): HasMany
    {
        return $this->hasMany(AsistenciaIncidencia::class);
    }

    public function justificaciones(): HasMany
    {
        return $this->hasMany(AsistenciaJustificacion::class);
    }

    public function amonestaciones(): HasMany
    {
        return $this->hasMany(AsistenciaAmonestacion::class);
    }

    public function recuperacion(): HasOne
    {
        return $this->hasOne(AsistenciaRecuperacion::class, 'asistencia_id');
    }
}
