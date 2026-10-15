<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IntegranteHistorialSeeder extends Seeder
{
    public function run(): void
    {
        $asignaciones = [
            'aescribano@sembrandoperu.org' => [
                'cargo' => 'LÍDER DE TECNOLOGÍA',
                'area' => 'TECNOLOGÍA DE LA INFORMACIÓN',
                'modalidad' => 'Remoto',
                'fecha_inicio' => '2026-08-10',
                'fecha_fin' => '2027-02-10',
            ],
        ];

        foreach ($asignaciones as $correo => $asignacion) {
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
                    "No existe el integrante asociado a {$correo}."
                );
            }

            $cargo = DB::table('cargos')
                ->where('nombre', $asignacion['cargo'])
                ->where('area_id', function ($query) use ($asignacion) {
                    $query->select('id')
                        ->from('areas')
                        ->where('nombre', $asignacion['area'])
                        ->limit(1);
                })
                ->first();

            if (! $cargo) {
                throw new \RuntimeException(
                    "No existe el cargo {$asignacion['cargo']} en el área {$asignacion['area']}."
                );
            }

            $activeHistory = DB::table('integrantes_historial')
                ->where('integrante_id', $integrante->id)
                ->where('tipo_integrante', 'voluntario')
                ->where('estado', 'Activo')
                ->latest('id')
                ->first();

            $values = [
                'integrante_id' => $integrante->id,
                'cargo_id' => $cargo->id,
                'tipo_integrante' => 'voluntario',
                'fecha_inicio' => $asignacion['fecha_inicio'] ?? now()->toDateString(),
                'fecha_fin' => $asignacion['fecha_fin'] ?? null,
                'periodo_meses' => 6,
                'estado' => 'Activo',
                'fecha_desactivacion' => null,
                'desactivado_por' => null,
                'motivo_desactivacion' => null,
                'tipo_desactivacion' => null,
                'institucion_educativa' => null,
                'horas_practicas_requeridas' => null,
                'carrera' => null,
                'ciclo' => null,
                'modalidad' => $asignacion['modalidad'] ?? null,
                'updated_at' => now(),
            ];

            if ($activeHistory) {
                DB::table('integrantes_historial')->where('id', $activeHistory->id)->update($values);
            } else {
                DB::table('integrantes_historial')->insert([...$values, 'created_at' => now()]);
            }
        }
    }
}
