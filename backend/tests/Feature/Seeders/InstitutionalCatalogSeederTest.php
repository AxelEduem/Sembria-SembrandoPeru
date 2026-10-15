<?php

namespace Tests\Feature\Seeders;

use Database\Seeders\AreaSeeder;
use Database\Seeders\CargoSeeder;
use Database\Seeders\IntegranteHistorialSeeder;
use Database\Seeders\IntegranteSeeder;
use Database\Seeders\RolSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class InstitutionalCatalogSeederTest extends TestCase
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

        Schema::create('areas', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('cargos', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('area_id');
            $table->unsignedBigInteger('rol_id');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('personas', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('correo')->unique();
        });

        Schema::create('integrantes', function (Blueprint $table): void {
            $table->id();
            $table->string('persona_id');
            $table->string('estado');
            $table->boolean('accesos_pendientes_revision')->default(false);
            $table->date('fecha_nacimiento')->nullable();
            $table->text('avatar_path')->nullable();
            $table->string('documento_identidad')->nullable();
            $table->string('telefono')->nullable();
            $table->string('tipo_documento')->nullable();
            $table->string('departamento')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('distrito')->nullable();
            $table->timestamps();
        });

        Schema::create('integrantes_historial', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('integrante_id');
            $table->unsignedBigInteger('cargo_id');
            $table->string('tipo_integrante');
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->unsignedInteger('periodo_meses')->nullable();
            $table->string('estado');
            $table->timestamp('fecha_desactivacion')->nullable();
            $table->string('desactivado_por')->nullable();
            $table->text('motivo_desactivacion')->nullable();
            $table->string('tipo_desactivacion')->nullable();
            $table->string('institucion_educativa')->nullable();
            $table->unsignedInteger('horas_practicas_requeridas')->nullable();
            $table->string('carrera')->nullable();
            $table->string('ciclo')->nullable();
            $table->string('modalidad')->nullable();
            $table->timestamps();
        });
    }

    public function test_catalog_seeders_create_the_expected_hierarchy_and_are_idempotent(): void
    {
        $this->seedCatalog();
        $this->seedCatalog();

        $this->assertDatabaseCount('areas', 7);
        $this->assertDatabaseCount('roles', 5);
        $this->assertDatabaseCount('cargos', 17);

        $coordinadorGeneralId = DB::table('roles')->where('codigo', 'coordinador_general')->value('id');
        $coordinadorAreaId = DB::table('roles')->where('codigo', 'coordinador_area')->value('id');
        $coCoordinadorAreaId = DB::table('roles')->where('codigo', 'co_coordinador_area')->value('id');
        $integranteId = DB::table('roles')->where('codigo', 'integrante')->value('id');
        $technologyLeaderId = DB::table('roles')->where('codigo', 'lider_tecnologia')->value('id');
        $gerenciaId = DB::table('areas')->where('nombre', 'GERENCIA')->value('id');

        $this->assertDatabaseHas('roles', [
            'id' => $integranteId,
            'nombre' => 'INTEGRANTE',
            'acceso_total' => false,
        ]);
        $this->assertDatabaseHas('roles', [
            'id' => $technologyLeaderId,
            'nombre' => 'LIDER DE TECNOLOGIA',
            'acceso_total' => true,
        ]);
        $this->assertDatabaseMissing('roles', ['codigo' => 'coordinador_gestion_proyectos']);
        $this->assertDatabaseMissing('roles', ['codigo' => 'lider_gestion_proyectos']);
        $this->assertDatabaseMissing('roles', ['codigo' => 'miembro_gestion_proyectos']);
        $this->assertDatabaseMissing('roles', ['codigo' => 'asistente']);

        $this->assertDatabaseHas('cargos', [
            'nombre' => 'GERENTE GENERAL',
            'area_id' => $gerenciaId,
            'rol_id' => $coordinadorGeneralId,
        ]);
        $this->assertDatabaseHas('cargos', [
            'nombre' => 'GERENTE ANALISTA',
            'area_id' => $gerenciaId,
            'rol_id' => $coordinadorGeneralId,
        ]);

        $technologyAreaId = DB::table('areas')->where('nombre', 'TECNOLOGÍA DE LA INFORMACIÓN')->value('id');
        $this->assertDatabaseHas('cargos', [
            'nombre' => 'LÍDER DE TECNOLOGÍA',
            'area_id' => $technologyAreaId,
            'rol_id' => $technologyLeaderId,
        ]);

        $operationalAreas = [
            'DESARROLLO Y DIRECCIÓN ORGANIZACIONAL',
            'GESTIÓN DE PROYECTOS',
            'MARKETING',
            'FUNDRAISING',
            'SENSIBILIZACIÓN',
            'TECNOLOGÍA DE LA INFORMACIÓN',
        ];

        foreach ($operationalAreas as $areaName) {
            $areaId = DB::table('areas')->where('nombre', $areaName)->value('id');

            $this->assertDatabaseHas('cargos', [
                'nombre' => "COORDINADOR DE {$areaName}",
                'area_id' => $areaId,
                'rol_id' => $coordinadorAreaId,
            ]);
            $this->assertDatabaseHas('cargos', [
                'nombre' => "CO-COORDINADOR DE {$areaName}",
                'area_id' => $areaId,
                'rol_id' => $coCoordinadorAreaId,
            ]);
            $this->assertDatabaseMissing('cargos', [
                'nombre' => "ASISTENTE DE {$areaName}",
                'area_id' => $areaId,
            ]);
        }

        $projectAreaId = DB::table('areas')->where('nombre', 'GESTIÓN DE PROYECTOS')->value('id');
        $this->assertDatabaseHas('cargos', [
            'nombre' => 'LÍDER DE GESTIÓN DE PROYECTOS',
            'area_id' => $projectAreaId,
            'rol_id' => $integranteId,
        ]);
        $this->assertDatabaseHas('cargos', [
            'nombre' => 'MIEMBRO DE GESTIÓN DE PROYECTOS',
            'area_id' => $projectAreaId,
            'rol_id' => $integranteId,
        ]);
    }

    public function test_axel_is_assigned_the_full_access_technology_leader_role(): void
    {
        $this->seedCatalog();
        $this->seedMembers();

        $axelId = DB::table('integrantes')
            ->join('personas', 'personas.id', '=', 'integrantes.persona_id')
            ->where('personas.correo', 'aescribano@sembrandoperu.org')
            ->value('integrantes.id');
        $technologyCoordinatorId = DB::table('cargos')
            ->where('nombre', 'COORDINADOR DE TECNOLOGÍA DE LA INFORMACIÓN')
            ->value('id');

        DB::table('integrantes_historial')->insert([
            'integrante_id' => $axelId,
            'cargo_id' => $technologyCoordinatorId,
            'tipo_integrante' => 'voluntario',
            'fecha_inicio' => now()->toDateString(),
            'periodo_meses' => 6,
            'estado' => 'Activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        (new IntegranteHistorialSeeder)->run();
        (new IntegranteHistorialSeeder)->run();

        $this->assertDatabaseCount('integrantes_historial', 1);

        $this->assertDatabaseHas('integrantes', [
            'id' => $axelId,
            'tipo_documento' => 'dni',
            'documento_identidad' => null,
            'telefono' => '907702056',
        ]);

        $axel = DB::table('integrantes_historial as historial')
            ->join('integrantes', 'integrantes.id', '=', 'historial.integrante_id')
            ->join('personas', 'personas.id', '=', 'integrantes.persona_id')
            ->join('cargos', 'cargos.id', '=', 'historial.cargo_id')
            ->join('areas', 'areas.id', '=', 'cargos.area_id')
            ->join('roles', 'roles.id', '=', 'cargos.rol_id')
            ->where('personas.correo', 'aescribano@sembrandoperu.org')
            ->where('historial.estado', 'Activo')
            ->select(
                'cargos.nombre as cargo',
                'areas.nombre as area',
                'roles.codigo as rol',
                'roles.acceso_total',
                'historial.modalidad',
                'historial.fecha_inicio',
                'historial.fecha_fin',
            )
            ->first();

        $this->assertSame('LÍDER DE TECNOLOGÍA', $axel->cargo);
        $this->assertSame('TECNOLOGÍA DE LA INFORMACIÓN', $axel->area);
        $this->assertSame('lider_tecnologia', $axel->rol);
        $this->assertSame(1, (int) $axel->acceso_total);
        $this->assertSame('Remoto', $axel->modalidad);
        $this->assertSame('2026-08-10', $axel->fecha_inicio);
        $this->assertSame('2027-02-10', $axel->fecha_fin);
    }

    private function seedCatalog(): void
    {
        (new AreaSeeder)->run();
        (new RolSeeder)->run();
        (new CargoSeeder)->run();
    }

    private function seedMembers(): void
    {
        $emails = [
            'aescribano@sembrandoperu.org',
        ];

        foreach ($emails as $index => $email) {
            $personaId = 'persona-'.($index + 1);
            DB::table('personas')->insert(['id' => $personaId, 'correo' => $email]);
        }

        (new IntegranteSeeder)->run();
    }
}
