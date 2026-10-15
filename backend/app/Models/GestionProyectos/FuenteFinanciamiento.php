<?php

namespace App\Models\GestionProyectos;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FuenteFinanciamiento extends Model
{
    protected $table = 'gp_fuentes_financiamiento';

    protected $fillable = ['nombre', 'tipo', 'sitio_web', 'descripcion', 'activo'];

    protected function casts(): array
    {
        return ['activo' => 'boolean'];
    }

    public function convocatorias(): HasMany
    {
        return $this->hasMany(Convocatoria::class, 'fuente_id');
    }
}
