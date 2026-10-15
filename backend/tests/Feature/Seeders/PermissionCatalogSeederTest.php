<?php

namespace Tests\Feature\Seeders;

use Database\Seeders\PermisoSeeder;
use Database\Seeders\RolPermisoSeeder;
use Database\Seeders\RolSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PermissionCatalogSeederTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('acceso_total')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
        Schema::create('permisos', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
            $table->string('modulo');
            $table->string('accion');
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
        Schema::create('rol_permisos', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('rol_id');
            $table->unsignedBigInteger('permiso_id');
            $table->string('alcance');
            $table->timestamps();
            $table->unique(['rol_id', 'permiso_id']);
        });
    }

    public function test_permission_and_role_permission_seeders_are_complete_and_idempotent(): void
    {
        $this->seedCatalog();
        $permissionCount = DB::table('permisos')->count();
        $assignmentCount = DB::table('rol_permisos')->count();

        $this->seedCatalog();

        $this->assertSame($permissionCount, DB::table('permisos')->count());
        $this->assertSame($assignmentCount, DB::table('rol_permisos')->count());
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'integrantes.ver',
            'nombre' => 'Ver módulo de integrantes',
        ]);
        $this->assertDatabaseHas('permisos', ['codigo' => 'integrantes.ver_detalle']);
        $this->assertDatabaseHas('permisos', ['codigo' => 'integrantes.descargar_excel']);
        $this->assertDatabaseHas('permisos', ['codigo' => 'integrantes.ver_metricas']);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'cumpleanos.ver_metricas',
            'nombre' => 'Ver métricas',
        ]);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'cumpleanos.ver',
            'nombre' => 'Ver módulo de cumpleaños',
        ]);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'cumpleanos.descargar_excel',
            'nombre' => 'Descargar Excel',
        ]);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'cumpleanos.imprimir_horario',
            'nombre' => 'Imprimir horario',
        ]);
        $this->assertDatabaseHas('permisos', ['codigo' => 'integrantes.ver_historial']);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'integrantes.activar',
            'nombre' => 'Activar integrante',
        ]);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'integrantes.ver_horario']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'integrantes.gestionar_horario']);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'areas.ver',
            'nombre' => 'Ver módulo de áreas',
        ]);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'areas.descargar_excel',
            'nombre' => 'Descargar Excel',
        ]);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'areas.eliminar']);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'cargos.ver',
            'nombre' => 'Ver módulo de cargos',
        ]);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'cargos.descargar_excel',
            'nombre' => 'Descargar Excel',
        ]);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'cargos.eliminar']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'agenda.ver']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'mi_horario.ver']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'horario.ver']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'mi_asistencia.ver']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'dashboard.ver']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'mi_perfil.ver']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'mi_perfil.editar']);
        foreach (['asistencia.gestionar', 'asistencia.justificar', 'asistencia.observar', 'asistencia.corregir'] as $obsoleteCode) {
            $this->assertDatabaseMissing('permisos', ['codigo' => $obsoleteCode]);
        }
        foreach ([
            'asistencia.ver' => 'Ver módulo de gestión de asistencia',
            'asistencia.gestionar_configuracion' => 'Gestionar configuración',
            'asistencia.gestionar_solicitudes' => 'Gestionar solicitudes',
            'asistencia.ver_historial_solicitudes' => 'Ver historial de solicitudes',
            'asistencia.gestionar_amonestaciones' => 'Gestionar amonestaciones',
            'asistencia.ver_metricas' => 'Ver métricas',
            'asistencia.descargar_excel' => 'Descargar Excel',
        ] as $code => $name) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'nombre' => $name,
                'modulo' => 'asistencia',
            ]);
        }
        $this->assertSame(7, DB::table('permisos')->where('modulo', 'asistencia')->count());
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'solicitudes_horario.ver',
            'nombre' => 'Ver módulo de solicitudes de horario',
        ]);
        $this->assertDatabaseHas('permisos', [
            'codigo' => 'solicitudes_horario.descargar_excel',
            'nombre' => 'Descargar Excel',
        ]);
        $this->assertSame(
            2,
            DB::table('permisos')->where('modulo', 'solicitudes_horario')->count(),
        );
        foreach ([
            'accesos.ver' => 'Ver módulo de accesos',
            'accesos.gestionar' => 'Gestionar accesos',
            'accesos.ver_metricas' => 'Ver métricas',
            'accesos.descargar_excel' => 'Descargar Excel',
            'accesos.ver_inactivos' => 'Ver integrantes inactivos con acceso',
        ] as $code => $name) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'nombre' => $name,
                'modulo' => 'accesos',
            ]);
        }
        $this->assertSame(5, DB::table('permisos')->where('modulo', 'accesos')->count());
        $this->assertDatabaseMissing('permisos', ['codigo' => 'accesos.asignar']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'accesos.retirar']);
        foreach ([
            'aplicaciones.ver' => 'Ver módulo de aplicaciones',
            'aplicaciones.crear' => 'Crear aplicaciones',
            'aplicaciones.editar' => 'Editar aplicaciones',
            'aplicaciones.desactivar' => 'Desactivar aplicaciones',
            'aplicaciones.descargar_excel' => 'Descargar Excel',
        ] as $code => $name) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'nombre' => $name,
                'modulo' => 'aplicaciones',
            ]);
        }
        $this->assertSame(5, DB::table('permisos')->where('modulo', 'aplicaciones')->count());
        $this->assertDatabaseMissing('permisos', ['codigo' => 'aplicaciones.eliminar']);
        foreach ([
            'usuarios.ver' => 'Ver módulo de usuarios',
            'usuarios.restablecer_contrasena' => 'Restablecer contraseña',
            'usuarios.editar_correo' => 'Editar correo',
            'usuarios.configurar_acceso' => 'Configurar acceso',
            'usuarios.descargar_excel' => 'Descargar Excel',
        ] as $code => $name) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'nombre' => $name,
                'modulo' => 'usuarios',
            ]);
        }
        $this->assertSame(5, DB::table('permisos')->where('modulo', 'usuarios')->count());
        foreach (['usuarios.crear', 'usuarios.editar', 'usuarios.desactivar'] as $obsoleteCode) {
            $this->assertDatabaseMissing('permisos', ['codigo' => $obsoleteCode]);
        }
        foreach ([
            'roles.ver' => 'Ver módulo de roles y permisos',
            'roles.crear' => 'Crear roles',
            'roles.editar' => 'Editar roles',
            'roles.desactivar' => 'Desactivar roles',
            'roles.gestionar_permisos' => 'Gestionar permisos',
            'roles.gestionar_cargos' => 'Gestionar cargos',
        ] as $code => $name) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'nombre' => $name,
                'modulo' => 'roles',
            ]);
        }
        $this->assertSame(6, DB::table('permisos')->where('modulo', 'roles')->count());
        $this->assertDatabaseMissing('permisos', ['codigo' => 'roles.eliminar']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'roles.permisos']);

        foreach ([
            'integrantes.ver' => 'integrantes',
            'cumpleanos.ver' => 'cumpleanos',
            'areas.ver' => 'areas',
            'cargos.ver' => 'cargos',
            'solicitudes_horario.ver' => 'solicitudes_horario',
            'asistencia.ver' => 'asistencia',
            'gp.equipos.ver' => 'equipos',
            'gp.convocatorias.ver' => 'convocatorias',
            'gp.capacitaciones.ver' => 'capacitaciones',
            'accesos.ver' => 'accesos',
            'aplicaciones.ver' => 'aplicaciones',
            'usuarios.ver' => 'usuarios',
            'roles.ver' => 'roles',
        ] as $code => $module) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'modulo' => $module,
                'activo' => true,
            ]);
        }

        foreach ([
            'gp.equipos.ver' => 'Ver módulo de equipos',
            'gp.equipos.crear' => 'Crear equipo',
            'gp.equipos.editar' => 'Editar equipo',
            'gp.equipos.descargar_excel' => 'Descargar Excel',
            'gp.equipos.ver_metricas' => 'Ver métricas',
        ] as $code => $name) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'nombre' => $name,
                'modulo' => 'equipos',
                'activo' => true,
            ]);
        }
        $this->assertSame(5, DB::table('permisos')->where('modulo', 'equipos')->count());
        $this->assertDatabaseMissing('permisos', ['codigo' => 'gp.equipos.gestionar']);

        foreach ([
            'gp.capacitaciones.ver' => 'Ver capacitación de proyectos',
            'gp.capacitaciones.gestionar' => 'Gestionar capacitación de proyectos',
        ] as $code => $name) {
            $this->assertDatabaseHas('permisos', [
                'codigo' => $code,
                'nombre' => $name,
                'modulo' => 'capacitaciones',
                'activo' => true,
            ]);
        }

        $this->assertDatabaseMissing('permisos', ['codigo' => 'gp.proyectos.ver']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'gp.proyectos.gestionar']);
        $this->assertDatabaseMissing('permisos', ['codigo' => 'gp.proyectos.descargar_excel']);

        $this->assertRolePermissions('coordinador_area', []);
        $this->assertRolePermissions('co_coordinador_area', []);
        $this->assertDatabaseMissing('roles', ['codigo' => 'coordinador_gestion_proyectos']);
        $this->assertRolePermissions('integrante', []);
        $this->assertRolePermissions('lider_tecnologia', []);
        $this->assertDatabaseMissing('roles', ['codigo' => 'lider_gestion_proyectos']);
        $this->assertDatabaseMissing('roles', ['codigo' => 'miembro_gestion_proyectos']);
    }

    public function test_remove_projects_module_migration_drops_table_and_permissions(): void
    {
        Schema::create('gp_proyectos', function (Blueprint $table): void {
            $table->id();
        });

        $roleId = DB::table('roles')->insertGetId([
            'codigo' => 'coordinador_area',
            'nombre' => 'Coordinador',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (['ver', 'gestionar', 'descargar_excel'] as $action) {
            $permissionId = DB::table('permisos')->insertGetId([
                'codigo' => "gp.proyectos.{$action}",
                'nombre' => $action,
                'modulo' => 'proyectos',
                'accion' => $action,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('rol_permisos')->insert([
                'rol_id' => $roleId,
                'permiso_id' => $permissionId,
                'alcance' => 'area',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $migration = require database_path('migrations/2026_10_09_120000_remove_gp_proyectos_module.php');
        $migration->up();

        $this->assertFalse(Schema::hasTable('gp_proyectos'));
        $this->assertSame(0, DB::table('permisos')->where('modulo', 'proyectos')->count());
        $this->assertSame(0, DB::table('rol_permisos')->count());
    }

    private function seedCatalog(): void
    {
        (new RolSeeder)->run();
        (new PermisoSeeder)->run();
        (new RolPermisoSeeder)->run();
    }

    /** @param list<string> $expected */
    private function assertRolePermissions(string $roleCode, array $expected): void
    {
        $actual = DB::table('rol_permisos as role_permission')
            ->join('roles as role', 'role.id', '=', 'role_permission.rol_id')
            ->join('permisos as permission', 'permission.id', '=', 'role_permission.permiso_id')
            ->where('role.codigo', $roleCode)
            ->orderBy('permission.codigo')
            ->pluck('permission.codigo')
            ->all();

        sort($expected);
        $this->assertSame($expected, $actual);
    }
}
