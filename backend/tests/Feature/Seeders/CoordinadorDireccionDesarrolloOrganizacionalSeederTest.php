<?php

namespace Tests\Feature\Seeders;

use Database\Seeders\CoordinadorDireccionDesarrolloOrganizacionalSeeder;
use Database\Seeders\PermisoSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CoordinadorDireccionDesarrolloOrganizacionalSeederTest extends TestCase
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

    public function test_seeder_creates_the_role_with_exact_scopes_and_is_idempotent(): void
    {
        (new PermisoSeeder)->run();
        (new CoordinadorDireccionDesarrolloOrganizacionalSeeder)->run();

        $assignmentCount = DB::table('rol_permisos')->count();

        (new CoordinadorDireccionDesarrolloOrganizacionalSeeder)->run();

        $this->assertDatabaseHas('roles', [
            'codigo' => 'coordinador_direccion_desarrollo_organizacional',
            'nombre' => 'COORDINADOR DE ÁREA DE DIRECCIÓN Y DESARROLLO ORGANIZACIONAL',
            'acceso_total' => false,
            'activo' => true,
        ]);
        $this->assertSame(40, $assignmentCount);
        $this->assertSame($assignmentCount, DB::table('rol_permisos')->count());

        $expected = [];

        foreach ($this->globalPermissions() as $code) {
            $expected[$code] = 'global';
        }

        foreach ($this->areaPermissions() as $code) {
            $expected[$code] = 'area';
        }

        $actual = DB::table('rol_permisos as role_permission')
            ->join('roles as role', 'role.id', '=', 'role_permission.rol_id')
            ->join('permisos as permission', 'permission.id', '=', 'role_permission.permiso_id')
            ->where('role.codigo', 'coordinador_direccion_desarrollo_organizacional')
            ->pluck('role_permission.alcance', 'permission.codigo')
            ->all();

        ksort($expected);
        ksort($actual);

        $this->assertSame($expected, $actual);
    }

    /** @return list<string> */
    private function globalPermissions(): array
    {
        return [
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
        ];
    }

    /** @return list<string> */
    private function areaPermissions(): array
    {
        return [
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
        ];
    }
}
