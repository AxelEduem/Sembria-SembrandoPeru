<?php

namespace App\Models\GestionProyectos;

use App\Models\Area;
use App\Models\CuentaAcceso;
use App\Models\Integrante;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipo extends Model
{
    protected $table = 'gp_equipos';

    protected $fillable = ['area_id', 'nombre', 'activo', 'creado_por'];

    protected function casts(): array
    {
        return ['activo' => 'boolean'];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'creado_por');
    }

    public function integrantes(): BelongsToMany
    {
        return $this->belongsToMany(Integrante::class, 'gp_equipo_integrantes')
            ->withPivot('rol')->withTimestamps();
    }

    public function convocatorias(): HasMany
    {
        return $this->hasMany(Convocatoria::class, 'equipo_id');
    }

    public function historialIntegrantes(): HasMany
    {
        return $this->hasMany(EquipoIntegranteHistorial::class, 'equipo_id');
    }
}
