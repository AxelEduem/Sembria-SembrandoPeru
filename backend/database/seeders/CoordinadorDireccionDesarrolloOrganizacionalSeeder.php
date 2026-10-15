<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CoordinadorDireccionDesarrolloOrganizacionalSeeder extends Seeder
{
    private const ROLE_CODE = 'coordinador_direccion_desarrollo_organizacional';

    private const PERMISSIONS_BY_SCOPE = [
        'global' => [
            'integrantes.ver',
            'integrantes.crear',
            'integrantes.ver_detalle',
            'integrantes.editar',
            'integrantes.desactivar',
            'integrantes.descargar_excel',
            'integrantes.ver_metricas',
            'integrantes.ver_historial',
            'integrantes.recontratar',
            'integrantes.activar',
            'cumpleanos.ver',
            'cumpleanos.descargar_excel',
            'cumpleanos.imprimir_horario',
            'cumpleanos.ver_metricas',
            'areas.ver',
            'areas.descargar_excel',
            'cargos.ver',
            'cargos.descargar_excel',
            'solicitudes_horario.ver',
            'solicitudes_horario.descargar_excel',
            'asistencia.ver',
            'asistencia.gestionar_configuracion',
            'asistencia.gestionar_solicitudes',
            'asistencia.ver_historial_solicitudes',
            'asistencia.gestionar_amonestaciones',
            'asistencia.ver_metricas',
            'asistencia.descargar_excel',
        ],
        'area' => [
            'cargos.crear',
            'cargos.editar',
            'cargos.desactivar',
            'accesos.ver',
            'accesos.gestionar',
            'accesos.ver_metricas',
            'accesos.descargar_excel',
            'accesos.ver_inactivos',
            'aplicaciones.ver',
            'aplicaciones.crear',
            'aplicaciones.editar',
            'aplicaciones.desactivar',
            'aplicaciones.descargar_excel',
        ],
    ];

    public function run(): void
    {
        DB::transaction(function (): void {
            DB::table('roles')->updateOrInsert(
                ['codigo' => self::ROLE_CODE],
                [
                    'nombre' => 'COORDINADOR DE ÁREA DE DIRECCIÓN Y DESARROLLO ORGANIZACIONAL',
                    'descripcion' => 'Responsable de coordinar el área de Dirección y Desarrollo Organizacional.',
                    'acceso_total' => false,
                    'activo' => true,
                    'updated_at' => now(),
                    'created_at' => DB::table('roles')
                        ->where('codigo', self::ROLE_CODE)
                        ->value('created_at') ?? now(),
                ],
            );

            $roleId = DB::table('roles')->where('codigo', self::ROLE_CODE)->value('id');
            $permissionScopes = collect(self::PERMISSIONS_BY_SCOPE)
                ->flatMap(fn (array $codes, string $scope) => collect($codes)
                    ->mapWithKeys(fn (string $code): array => [$code => $scope]));
            $permissions = DB::table('permisos')
                ->whereIn('codigo', $permissionScopes->keys())
                ->pluck('id', 'codigo');
            $missingPermissions = $permissionScopes->keys()->diff($permissions->keys())->values();

            if ($missingPermissions->isNotEmpty()) {
                throw new RuntimeException(
                    'No existen los permisos requeridos: '.$missingPermissions->implode(', ').'.'
                );
            }

            DB::table('rol_permisos')
                ->where('rol_id', $roleId)
                ->whereNotIn('permiso_id', $permissions->values())
                ->delete();

            foreach ($permissionScopes as $code => $scope) {
                $permissionId = $permissions->get($code);

                DB::table('rol_permisos')->updateOrInsert(
                    ['rol_id' => $roleId, 'permiso_id' => $permissionId],
                    [
                        'alcance' => $scope,
                        'updated_at' => now(),
                        'created_at' => DB::table('rol_permisos')
                            ->where('rol_id', $roleId)
                            ->where('permiso_id', $permissionId)
                            ->value('created_at') ?? now(),
                    ],
                );
            }
        });
    }
}
