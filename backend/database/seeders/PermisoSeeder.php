<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermisoSeeder extends Seeder
{
    private const OBSOLETE_CODES = [
        'integrantes.ver_horario',
        'integrantes.gestionar_horario',
        'areas.eliminar',
        'cargos.eliminar',
        'agenda.ver',
        'mi_horario.ver',
        'horario.ver',
        'mi_asistencia.ver',
        'dashboard.ver',
        'mi_perfil.ver',
        'mi_perfil.editar',
        'asistencia.gestionar',
        'asistencia.justificar',
        'asistencia.observar',
        'asistencia.corregir',
        'accesos.asignar',
        'accesos.retirar',
        'aplicaciones.eliminar',
        'usuarios.crear',
        'usuarios.editar',
        'usuarios.desactivar',
        'roles.eliminar',
        'roles.permisos',
        'gp.equipos.gestionar',
        'gp.proyectos.ver',
        'gp.proyectos.gestionar',
        'gp.proyectos.descargar_excel',
    ];

    private const MODULES = [
        'bitacora' => [
            'bitacora.ver' => 'Ver módulo de bitácora',
            'bitacora.descargar_excel' => 'Descargar Excel de bitácora',
            'bitacora.ver_metricas' => 'Ver métricas de bitácora',
        ],
        'mi_periodo' => [
            'mi_periodo.ver' => 'Ver mi periodo',
        ],
        'solicitudes_horario' => [
            'solicitudes_horario.ver' => 'Ver módulo de solicitudes de horario',
            'solicitudes_horario.descargar_excel' => 'Descargar Excel',
        ],
        'cumpleanos' => [
            'cumpleanos.ver' => 'Ver módulo de cumpleaños',
            'cumpleanos.descargar_excel' => 'Descargar Excel',
            'cumpleanos.ver_metricas' => 'Ver métricas',
            'cumpleanos.imprimir_horario' => 'Imprimir horario',
        ],
        'integrantes' => [
            'integrantes.ver' => 'Ver módulo de integrantes',
            'integrantes.crear' => 'Crear integrante',
            'integrantes.ver_detalle' => 'Ver integrante',
            'integrantes.editar' => 'Editar integrante',
            'integrantes.desactivar' => 'Desactivar integrante',
            'integrantes.descargar_excel' => 'Descargar Excel',
            'integrantes.ver_metricas' => 'Ver métricas',
            'integrantes.ver_historial' => 'Ver historial de integrante',
            'integrantes.recontratar' => 'Recontratar integrante',
            'integrantes.activar' => 'Activar integrante',
        ],
        'voluntarios' => [
            'voluntarios.ver' => 'Ver voluntarios',
            'voluntarios.crear' => 'Crear voluntarios',
            'voluntarios.editar' => 'Editar voluntarios',
            'voluntarios.desactivar' => 'Desactivar voluntarios',
            'voluntarios.recontratar' => 'Recontratar voluntarios',
            'voluntarios.gestionar_horario' => 'Gestionar horarios de voluntarios',
            'voluntarios.ver_horario' => 'Ver horarios de voluntarios',
        ],
        'practicantes' => [
            'practicantes.ver' => 'Ver practicantes',
            'practicantes.crear' => 'Crear practicantes',
            'practicantes.editar' => 'Editar practicantes',
            'practicantes.desactivar' => 'Desactivar practicantes',
        ],
        'aplicaciones' => [
            'aplicaciones.ver' => 'Ver módulo de aplicaciones',
            'aplicaciones.crear' => 'Crear aplicaciones',
            'aplicaciones.editar' => 'Editar aplicaciones',
            'aplicaciones.desactivar' => 'Desactivar aplicaciones',
            'aplicaciones.descargar_excel' => 'Descargar Excel',
        ],
        'accesos' => [
            'accesos.ver' => 'Ver módulo de accesos',
            'accesos.gestionar' => 'Gestionar accesos',
            'accesos.ver_metricas' => 'Ver métricas',
            'accesos.descargar_excel' => 'Descargar Excel',
            'accesos.ver_inactivos' => 'Ver integrantes inactivos con acceso',
        ],
        'areas' => [
            'areas.ver' => 'Ver módulo de áreas',
            'areas.crear' => 'Crear áreas',
            'areas.editar' => 'Editar áreas',
            'areas.desactivar' => 'Desactivar áreas',
            'areas.descargar_excel' => 'Descargar Excel',
        ],
        'cargos' => [
            'cargos.ver' => 'Ver módulo de cargos',
            'cargos.crear' => 'Crear cargos',
            'cargos.editar' => 'Editar cargos',
            'cargos.desactivar' => 'Desactivar cargos',
            'cargos.descargar_excel' => 'Descargar Excel',
        ],
        'usuarios' => [
            'usuarios.ver' => 'Ver módulo de usuarios',
            'usuarios.restablecer_contrasena' => 'Restablecer contraseña',
            'usuarios.editar_correo' => 'Editar correo',
            'usuarios.configurar_acceso' => 'Configurar acceso',
            'usuarios.descargar_excel' => 'Descargar Excel',
        ],
        'roles' => [
            'roles.ver' => 'Ver módulo de roles y permisos',
            'roles.crear' => 'Crear roles',
            'roles.editar' => 'Editar roles',
            'roles.desactivar' => 'Desactivar roles',
            'roles.gestionar_permisos' => 'Gestionar permisos',
            'roles.gestionar_cargos' => 'Gestionar cargos',
        ],
        'asistencia' => [
            'asistencia.ver' => 'Ver módulo de gestión de asistencia',
            'asistencia.gestionar_configuracion' => 'Gestionar configuración',
            'asistencia.gestionar_solicitudes' => 'Gestionar solicitudes',
            'asistencia.ver_historial_solicitudes' => 'Ver historial de solicitudes',
            'asistencia.gestionar_amonestaciones' => 'Gestionar amonestaciones',
            'asistencia.ver_metricas' => 'Ver métricas',
            'asistencia.descargar_excel' => 'Descargar Excel',
        ],
        'equipos' => [
            'gp.equipos.ver' => 'Ver módulo de equipos',
            'gp.equipos.crear' => 'Crear equipo',
            'gp.equipos.editar' => 'Editar equipo',
            'gp.equipos.descargar_excel' => 'Descargar Excel',
            'gp.equipos.ver_metricas' => 'Ver métricas',
        ],
        'convocatorias' => [
            'gp.convocatorias.ver' => 'Ver convocatorias',
            'gp.convocatorias.crear' => 'Crear convocatorias',
            'gp.convocatorias.editar' => 'Editar convocatorias',
            'gp.convocatorias.evaluar' => 'Evaluar convocatorias',
            'gp.convocatorias.revisar' => 'Revisar convocatorias',
            'gp.convocatorias.aprobar' => 'Aprobar convocatorias',
            'gp.convocatorias.postular' => 'Gestionar postulaciones',
            'gp.convocatorias.archivar' => 'Archivar convocatorias',
            'gp.convocatorias.ver_aprobacion' => 'Ver aprobación',
            'gp.convocatorias.ver_postulacion' => 'Ver postulación',
            'gp.convocatorias.ver_envio' => 'Ver envío',
            'gp.convocatorias.ver_seguimiento' => 'Ver seguimiento',
            'gp.convocatorias.ver_cierre' => 'Ver cierre',
            'gp.convocatorias.descargar_excel' => 'Descargar Excel',
        ],
        'capacitaciones' => [
            'gp.capacitaciones.ver' => 'Ver capacitación de proyectos',
            'gp.capacitaciones.gestionar' => 'Gestionar capacitación de proyectos',
        ],
    ];

    public function run(): void
    {
        foreach (self::MODULES as $module => $permissions) {
            foreach ($permissions as $code => $name) {
                DB::table('permisos')->updateOrInsert(
                    ['codigo' => $code],
                    [
                        'nombre' => $name,
                        'modulo' => $module,
                        'accion' => str($code)->afterLast('.')->toString(),
                        'descripcion' => "Permite {$name}.",
                        'activo' => true,
                        'updated_at' => now(),
                        'created_at' => DB::table('permisos')->where('codigo', $code)->value('created_at') ?? now(),
                    ],
                );
            }
        }

        $obsoletePermissionIds = DB::table('permisos')
            ->whereIn('codigo', self::OBSOLETE_CODES)
            ->pluck('id');

        DB::table('rol_permisos')->whereIn('permiso_id', $obsoletePermissionIds)->delete();
        DB::table('permisos')->whereIn('codigo', self::OBSOLETE_CODES)->delete();
    }
}
