<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CuentaAcceso extends Model
{
    use HasFactory;

    protected $table = 'cuentas_acceso';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'persona_id',
        'activo',
        'must_change_password',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'must_change_password' => 'boolean',
    ];

    /**
     * Generar UUID automáticamente.
     */
    protected static function booted()
    {
        static::creating(function ($cuenta) {
            if (! $cuenta->id) {
                $cuenta->id = (string) Str::uuid();
            }
        });
    }

    /**
     * Usuario de Laravel asociado.
     *
     * cuentas_acceso.user_id
     *     ↓
     * users.id
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Persona asociada a la cuenta.
     */
    public function persona()
    {
        return $this->belongsTo(Persona::class, 'persona_id');
    }
}
