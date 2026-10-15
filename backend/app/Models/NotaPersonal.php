<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotaPersonal extends Model
{
    protected $table = 'notas_personales';

    protected $fillable = ['cuenta_id', 'titulo', 'contenido', 'color', 'fijada'];

    protected function casts(): array
    {
        return ['fijada' => 'boolean'];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'cuenta_id');
    }
}
