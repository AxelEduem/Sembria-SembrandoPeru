<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AsistenciaJustificacion extends Model
{
    protected $table = 'asistencia_justificaciones';

    public $timestamps = false;

    protected $fillable = [
        'asistencia_id',
        'tipo',
        'motivo',
        'estado',
        'registrado_por',
        'validado_por',
        'fecha_registro',
        'fecha_validacion',
        'observacion',
        'adjunto_path',
    ];

    protected function casts(): array
    {
        return [
            'fecha_registro' => 'immutable_datetime',
            'fecha_validacion' => 'immutable_datetime',
        ];
    }

    public function asistencia(): BelongsTo
    {
        return $this->belongsTo(Asistencia::class);
    }

    public function recuperaciones(): HasMany
    {
        return $this->hasMany(AsistenciaRecuperacion::class, 'justificacion_id');
    }
}
