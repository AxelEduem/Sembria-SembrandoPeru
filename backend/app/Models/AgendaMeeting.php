<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgendaMeeting extends Model
{
    protected $table = 'agenda_reuniones';

    protected $fillable = [
        'titulo', 'descripcion', 'fecha', 'hora_inicio', 'hora_fin', 'modalidad',
        'ubicacion', 'enlace', 'estado', 'creada_por',
    ];

    protected function casts(): array
    {
        return ['fecha' => 'date:Y-m-d'];
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'creada_por');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(AgendaMeetingParticipant::class, 'reunion_id');
    }
}
