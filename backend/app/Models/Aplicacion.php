<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Aplicacion extends Model
{
    protected $table = 'aplicaciones';

    protected $fillable = ['nombre', 'descripcion', 'imagen_url', 'imagen_path', 'licencias_total', 'area_id', 'activo'];

    protected function casts(): array
    {
        return ['activo' => 'boolean', 'licencias_total' => 'integer'];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(IntegranteAplicacion::class);
    }
}
