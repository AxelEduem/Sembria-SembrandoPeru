<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CargoSeeder extends Seeder
{
    public function run(): void
    {
        $roles = DB::table('roles')
            ->whereIn('codigo', [
                'coordinador_general',
                'coordinador_area',
                'co_coordinador_area',
                'integrante',
                'lider_tecnologia',
            ])
            ->pluck('id', 'codigo');

        foreach ([
            'coordinador_general',
            'coordinador_area',
            'co_coordinador_area',
            'integrante',
            'lider_tecnologia',
        ] as $codigo) {
            if (! $roles->has($codigo)) {
                throw new \RuntimeException("No existe el rol {$codigo}.");
            }
        }

        $operationalAreas = [
            'DESARROLLO Y DIRECCIÓN ORGANIZACIONAL',
            'GESTIÓN DE PROYECTOS',
            'MARKETING',
            'FUNDRAISING',
            'SENSIBILIZACIÓN',
            'TECNOLOGÍA DE LA INFORMACIÓN',
        ];

        $cargos = [
            [
                'area' => 'GERENCIA',
                'nombre' => 'GERENTE GENERAL',
                'descripcion' => 'Responsable de la dirección general y de las decisiones estratégicas de la organización.',
                'rol' => 'coordinador_general',
            ],
            [
                'area' => 'GERENCIA',
                'nombre' => 'GERENTE ANALISTA',
                'descripcion' => 'Responsable del análisis institucional y del apoyo a la gestión estratégica de la organización.',
                'rol' => 'coordinador_general',
            ],
            [
                'area' => 'TECNOLOGÍA DE LA INFORMACIÓN',
                'nombre' => 'LÍDER DE TECNOLOGÍA',
                'descripcion' => 'Responsable de liderar el área de Tecnología de la Información y administrar integralmente el sistema.',
                'rol' => 'lider_tecnologia',
            ],
        ];

        foreach ($operationalAreas as $areaName) {
            $cargos[] = [
                'area' => $areaName,
                'nombre' => "COORDINADOR DE {$areaName}",
                'descripcion' => "Responsable de coordinar las actividades y al equipo del área de {$areaName}.",
                'rol' => 'coordinador_area',
            ];
            $cargos[] = [
                'area' => $areaName,
                'nombre' => "CO-COORDINADOR DE {$areaName}",
                'descripcion' => "Responsable de apoyar la coordinación y gestión del área de {$areaName}.",
                'rol' => 'co_coordinador_area',
            ];
        }

        $cargos[] = [
            'area' => 'GESTIÓN DE PROYECTOS',
            'nombre' => 'LÍDER DE GESTIÓN DE PROYECTOS',
            'descripcion' => 'Responsable de liderar un equipo y realizar el primer filtro de sus convocatorias.',
            'rol' => 'integrante',
        ];
        $cargos[] = [
            'area' => 'GESTIÓN DE PROYECTOS',
            'nombre' => 'MIEMBRO DE GESTIÓN DE PROYECTOS',
            'descripcion' => 'Integrante de un equipo responsable del registro de convocatorias.',
            'rol' => 'integrante',
        ];

        $areas = DB::table('areas')
            ->whereIn('nombre', ['GERENCIA', ...$operationalAreas])
            ->pluck('id', 'nombre');

        foreach (['GERENCIA', ...$operationalAreas] as $areaName) {
            if (! $areas->has($areaName)) {
                throw new \RuntimeException("No existe el área {$areaName}.");
            }
        }

        foreach ($cargos as $cargo) {
            $areaId = $areas->get($cargo['area']);

            DB::table('cargos')->updateOrInsert(
                [
                    'nombre' => $cargo['nombre'],
                    'area_id' => $areaId,
                ],
                [
                    'descripcion' => $cargo['descripcion'],
                    'rol_id' => $roles->get($cargo['rol']),
                    'activo' => true,
                    'updated_at' => now(),
                    'created_at' => DB::table('cargos')
                        ->where('nombre', $cargo['nombre'])
                        ->where('area_id', $areaId)
                        ->value('created_at') ?? now(),
                ]
            );
        }

        $memberCargoId = DB::table('cargos')
            ->where('nombre', 'MIEMBRO DE GESTIÓN DE PROYECTOS')
            ->where('area_id', $areas->get('GESTIÓN DE PROYECTOS'))
            ->value('id');
        $obsoleteRoleIds = DB::table('roles')
            ->whereIn('codigo', [
                'asistente',
                'coordinador_gestion_proyectos',
                'lider_gestion_proyectos',
                'miembro_gestion_proyectos',
            ])
            ->pluck('id');
        $assistantRoleId = DB::table('roles')->where('codigo', 'asistente')->value('id');
        $projectCoordinatorRoleId = DB::table('roles')
            ->where('codigo', 'coordinador_gestion_proyectos')
            ->value('id');
        $assistantCargoIds = DB::table('cargos')
            ->where(function ($query) use ($assistantRoleId): void {
                $query->where('nombre', 'like', 'ASISTENTE DE %');
                if ($assistantRoleId !== null) {
                    $query->orWhere('rol_id', $assistantRoleId);
                }
            })
            ->pluck('id');

        if ($assistantCargoIds->isNotEmpty()) {
            DB::table('integrantes_historial')
                ->whereIn('cargo_id', $assistantCargoIds)
                ->update(['cargo_id' => $memberCargoId, 'updated_at' => now()]);
            DB::table('cargos')->whereIn('id', $assistantCargoIds)->delete();
        }

        if ($obsoleteRoleIds->isNotEmpty()) {
            if ($projectCoordinatorRoleId !== null) {
                DB::table('cargos')
                    ->where('rol_id', $projectCoordinatorRoleId)
                    ->update(['rol_id' => $roles->get('coordinador_area'), 'updated_at' => now()]);
            }

            DB::table('cargos')
                ->whereIn('rol_id', $obsoleteRoleIds)
                ->update(['rol_id' => $roles->get('integrante'), 'updated_at' => now()]);
            DB::table('rol_permisos')->whereIn('rol_id', $obsoleteRoleIds)->delete();
            DB::table('roles')->whereIn('id', $obsoleteRoleIds)->delete();
        }
    }
}
