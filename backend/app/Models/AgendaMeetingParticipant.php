<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgendaMeetingParticipant extends Model
{
    protected $table = 'agenda_reunion_participantes';

    protected $fillable = ['reunion_id', 'cuenta_id', 'estado', 'es_organizador', 'respondido_at'];

    protected function casts(): array
    {
        return [
            'es_organizador' => 'boolean',
            'respondido_at' => 'datetime',
        ];
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(AgendaMeeting::class, 'reunion_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'cuenta_id');
    }
}
