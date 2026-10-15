<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'coordinador_general' => [
                'nombre' => 'COORDINADOR GENERAL',
                'descripcion' => 'Responsable de la coordinación general y gestión integral del sistema.',
                'acceso_total' => true,
            ],
            'coordinador_area' => [
                'nombre' => 'COORDINADOR DE ÁREA',
                'descripcion' => 'Responsable de coordinar las actividades y al equipo de un área institucional.',
                'acceso_total' => false,
            ],
            'co_coordinador_area' => [
                'nombre' => 'CO-COORDINADOR DE ÁREA',
                'descripcion' => 'Responsable de apoyar la coordinación y gestión de un área institucional.',
                'acceso_total' => false,
            ],
            'integrante' => [
                'nombre' => 'INTEGRANTE',
                'descripcion' => 'Rol base sin acceso a módulos del sistema.',
                'acceso_total' => false,
            ],
            'lider_tecnologia' => [
                'nombre' => 'LIDER DE TECNOLOGIA',
                'descripcion' => 'Responsable del área de Tecnología con acceso total al sistema.',
                'acceso_total' => true,
            ],
        ];

        foreach ($roles as $codigo => $rol) {
            DB::table('roles')->updateOrInsert(
                ['codigo' => $codigo],
                [
                    ...$rol,
                    'activo' => true,
                    'updated_at' => now(),
                    'created_at' => DB::table('roles')->where('codigo', $codigo)->value('created_at') ?? now(),
                ]
            );
        }
    }
}
