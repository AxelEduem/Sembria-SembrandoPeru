<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IntegranteHorarioSeeder extends Seeder
{
    public function run(): void
    {
        $correos = [
            'aescribano@sembrandoperu.org',
        ];

        $dias = [1, 2, 3, 4, 5];

        foreach ($correos as $correo) {
            $persona = DB::table('personas')
                ->where('correo', $correo)
                ->first();

            if (! $persona) {
                throw new \RuntimeException(
                    "No existe la persona con correo {$correo}."
                );
            }

            $integrante = DB::table('integrantes')
                ->where('persona_id', $persona->id)
                ->first();

            if (! $integrante) {
                throw new \RuntimeException(
                    "No existe el integrante de {$correo}."
                );
            }

            $historial = DB::table('integrantes_historial')
                ->where('integrante_id', $integrante->id)
                ->where('estado', 'Activo')
                ->first();

            if (! $historial) {
                throw new \RuntimeException(
                    "No existe historial activo para {$correo}."
                );
            }

            foreach ($dias as $dia) {
                DB::table('integrante_horarios')->updateOrInsert(
                    [
                        'historial_id' => $historial->id,
                        'dia_semana' => $dia,
                        'hora_inicio' => '08:00',
                        'hora_fin' => '12:00',
                    ],
                    [
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }
}
