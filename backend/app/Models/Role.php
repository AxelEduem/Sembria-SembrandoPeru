<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = ['codigo', 'nombre', 'descripcion', 'acceso_total', 'activo'];

    protected function casts(): array
    {
        return ['acceso_total' => 'boolean', 'activo' => 'boolean'];
    }

    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(Permiso::class, 'rol_permisos', 'rol_id', 'permiso_id')
            ->withPivot('alcance')
            ->withTimestamps();
    }

    public function cargos(): HasMany
    {
        return $this->hasMany(Cargo::class, 'rol_id');
    }
}
