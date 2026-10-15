<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            [
                'nombre' => 'GERENCIA',
                'descripcion' => 'Área encargada de la dirección general, el análisis institucional y la toma de decisiones estratégicas.',
                'activo' => true,
            ],
            [
                'nombre' => 'DESARROLLO Y DIRECCIÓN ORGANIZACIONAL',
                'descripcion' => 'Área encargada del desarrollo institucional, la dirección estratégica y la gestión organizacional.',
                'activo' => true,
            ],
            [
                'nombre' => 'GESTIÓN DE PROYECTOS',
                'descripcion' => 'Área encargada de planificar, gestionar y dar seguimiento a proyectos y convocatorias.',
                'activo' => true,
            ],
            [
                'nombre' => 'MARKETING',
                'descripcion' => 'Área encargada de la comunicación, promoción y posicionamiento institucional.',
                'activo' => true,
            ],
            [
                'nombre' => 'FUNDRAISING',
                'descripcion' => 'Área encargada de la búsqueda y gestión de oportunidades de financiamiento y alianzas.',
                'activo' => true,
            ],
            [
                'nombre' => 'SENSIBILIZACIÓN',
                'descripcion' => 'Área encargada de promover la sensibilización y participación sobre las iniciativas institucionales.',
                'activo' => true,
            ],
            [
                'nombre' => 'TECNOLOGÍA DE LA INFORMACIÓN',
                'descripcion' => 'Área encargada de los sistemas, infraestructura tecnológica, soporte y desarrollo de soluciones digitales.',
                'activo' => true,
            ],
        ];

        foreach ($areas as $area) {
            DB::table('areas')->updateOrInsert(
                ['nombre' => $area['nombre']],
                [
                    'descripcion' => $area['descripcion'],
                    'activo' => $area['activo'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
