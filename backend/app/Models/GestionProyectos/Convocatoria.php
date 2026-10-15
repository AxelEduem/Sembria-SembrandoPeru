<?php

namespace App\Models\GestionProyectos;

use App\Models\CuentaAcceso;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Convocatoria extends Model
{
    protected $table = 'gp_convocatorias';

    protected $fillable = [
        'fuente_id',
        'area_id',
        'equipo_id',
        'nombre',
        'descripcion',
        'financiador_nombre',
        'url_convocatoria',
        'url_postulacion',
        'fecha_apertura',
        'fecha_cierre',
        'monto_minimo',
        'monto_maximo',
        'moneda',
        'monto_solicitable',
        'territorio',
        'sector',
        'tipo_proyecto',
        'tipo_financiamiento',
        'lleva_cofinanciamiento',
        'tipo_organizacion_admitida',
        'tiempo_postulacion',
        'beneficiario_ideal',
        'requiere_alianza',
        'tipo_alianza',
        'fuente_encontrada',
        'fuente_busqueda',
        'fuente_busqueda_otro',
        'registrada_por',
        'fecha_registro',
        'estado',
        'etapa',
        'resultado_final',
        'motivo_descarte',
        'cerrada_at',
        'cerrada_por',
        'archivada_at',
        'archivada_por',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_apertura' => 'date:Y-m-d',
            'fecha_cierre' => 'date:Y-m-d',
            'fecha_registro' => 'date:Y-m-d',
            'cerrada_at' => 'datetime',
            'archivada_at' => 'datetime',
            'monto_minimo' => 'decimal:2',
            'monto_maximo' => 'decimal:2',
            'monto_solicitable' => 'decimal:2',
            'lleva_cofinanciamiento' => 'boolean',
        ];
    }

    public function fuente(): BelongsTo
    {
        return $this->belongsTo(FuenteFinanciamiento::class, 'fuente_id');
    }

    public function registrante(): BelongsTo
    {
        return $this->belongsTo(CuentaAcceso::class, 'registrada_por');
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Equipo::class, 'equipo_id');
    }

    public function evaluaciones(): HasMany
    {
        return $this->hasMany(ConvocatoriaEvaluacion::class, 'convocatoria_id');
    }

    public function aprobacion(): HasOne
    {
        return $this->hasOne(ConvocatoriaAprobacion::class, 'convocatoria_id');
    }

    public function postulaciones(): HasMany
    {
        return $this->hasMany(Postulacion::class, 'convocatoria_id');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(ConvocatoriaHistorial::class, 'convocatoria_id')
            ->latest('created_at');
    }
}
