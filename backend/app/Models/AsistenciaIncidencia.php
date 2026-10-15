<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsistenciaIncidencia extends Model
{
    protected $table = 'asistencia_incidencias';

    protected $fillable = ['asistencia_id', 'tipo', 'minutos', 'descripcion', 'registrado_por'];

    protected function casts(): array
    {
        return ['minutos' => 'integer'];
    }

    public function asistencia(): BelongsTo
    {
        return $this->belongsTo(Asistencia::class);
    }
}
