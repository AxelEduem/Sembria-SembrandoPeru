<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AsistenciaConfiguracion extends Model
{
    protected $table = 'asistencia_configuraciones';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'jornada_dias' => 'array',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate([], [
            'minutos_antes_inicio' => 5,
            'tolerancia_tardanza' => 10,
            'umbral_salida_anticipada' => 1,
            'minutos_gracia_falta' => 0,
            'recordatorio_inicio' => 5,
            'recordatorio_salida' => 10,
            'max_minutos_offline' => 120,
            'jornada_hora_inicio' => '08:00',
            'jornada_hora_fin' => '18:00',
            'jornada_dias' => [1, 2, 3, 4, 5, 6],
        ]);
    }
}
