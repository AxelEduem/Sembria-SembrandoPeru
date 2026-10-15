<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TareaNota extends Model
{
    protected $table = 'tarea_notas';

    protected $fillable = ['tarea_id', 'autor_id', 'contenido'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Tarea::class, 'tarea_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'autor_id');
    }
}
