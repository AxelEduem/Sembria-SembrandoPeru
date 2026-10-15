<?php

namespace Tests\Feature\GestionProyectos;

use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CapacitacionApiTest extends TestCase
{
    private int $areaId;

    private User $coordinator;

    private User $member;

    private User $coCoordinator;

    private int $memberId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedData();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_coordinator_sees_only_project_management_members(): void
    {
        Sanctum::actingAs($this->coordinator);

        $this->getJson('/api/gestion-proyectos/capacitaciones')
            ->assertOk()
            ->assertJsonPath('meta.can_manage', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante_id', $this->memberId)
            ->assertJsonPath('data.0.estado', 'sin_iniciar')
            ->assertJsonPath('data.0.etapa_actual', 1)
            ->assertJsonPath('data.0.habilitado_registro_proyectos', false);
    }

    public function test_member_sees_only_their_progress_and_cannot_manage_it(): void
    {
        Sanctum::actingAs($this->member);

        $this->getJson('/api/gestion-proyectos/capacitaciones')
            ->assertOk()
            ->assertJsonPath('meta.can_manage', false)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante_id', $this->memberId);

        $this->patchJson("/api/gestion-proyectos/capacitaciones/{$this->memberId}/etapas/1")
            ->assertForbidden();
    }

    public function test_co_coordinator_and_access_total_can_manage_without_being_trainees(): void
    {
        Sanctum::actingAs($this->coCoordinator);
        $this->getJson('/api/gestion-proyectos/capacitaciones')
            ->assertOk()
            ->assertJsonPath('meta.can_manage', true)
            ->assertJsonCount(1, 'data');

        $accessTotalRole = $this->role('administrador', true);
        $otherAreaId = Schema::getConnection()->table('areas')->where('nombre', 'COMUNICACIONES')->value('id');
        $accessTotalCargo = $this->cargo('ADMINISTRADOR', $otherAreaId, $accessTotalRole);
        [$accessTotal] = $this->identity('Acceso total', $accessTotalCargo);

        Sanctum::actingAs($accessTotal);
        $this->getJson('/api/gestion-proyectos/capacitaciones')
            ->assertOk()
            ->assertJsonPath('meta.can_manage', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_stages_must_be_completed_in_order_and_enable_project_registration(): void
    {
        Sanctum::actingAs($this->coordinator);

        $this->patchJson("/api/gestion-proyectos/capacitaciones/{$this->memberId}/etapas/2")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['etapa']);

        foreach ([1, 2, 3] as $stage) {
            $response = $this->patchJson(
                "/api/gestion-proyectos/capacitaciones/{$this->memberId}/etapas/{$stage}"
            )->assertOk();
        }

        $response
            ->assertJsonPath('data.estado', 'completada')
            ->assertJsonPath('data.etapa_actual', null)
            ->assertJsonPath('data.habilitado_registro_proyectos', true)
            ->assertJsonPath('data.mostrar_celebracion', true);

        $this->assertDatabaseHas('gp_capacitaciones', [
            'integrante_id' => $this->memberId,
        ]);
        $this->assertNotNull(Schema::getConnection()->table('gp_capacitaciones')
            ->where('integrante_id', $this->memberId)->value('fase_3_completada_at'));
    }

    public function test_member_loses_training_access_after_the_24_hour_completion_window(): void
    {
        CarbonImmutable::setTestNow('2026-10-15 10:00:00');
        Sanctum::actingAs($this->coordinator);

        foreach ([1, 2, 3] as $stage) {
            $this->patchJson(
                "/api/gestion-proyectos/capacitaciones/{$this->memberId}/etapas/{$stage}"
            )->assertOk();
        }

        Sanctum::actingAs($this->member);
        $this->getJson('/api/gestion-proyectos/capacitaciones')
            ->assertOk()
            ->assertJsonPath('data.0.mostrar_celebracion', true)
            ->assertJsonPath('data.0.celebracion_hasta', '2026-10-16T10:00:00+00:00');

        CarbonImmutable::setTestNow('2026-10-16 10:01:00');

        $this->getJson('/api/gestion-proyectos/capacitaciones')->assertForbidden();

        $permissions = app(InstitutionalAuthorizationService::class)
            ->automaticPermissionCodes(
                Schema::getConnection()->table('cuentas_acceso')->where('user_id', $this->member->id)->value('id'),
                'integrante',
                'GESTIÓN DE PROYECTOS',
                'MIEMBRO DE GESTIÓN DE PROYECTOS',
            );

        $this->assertNotContains('gp.capacitaciones.ver', $permissions);

        Sanctum::actingAs($this->coordinator);
        $this->getJson('/api/gestion-proyectos/capacitaciones')
            ->assertOk()
            ->assertJsonPath('data.0.estado', 'completada');
    }

    private function seedData(): void
    {
        $now = now();
        $this->areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'GESTIÓN DE PROYECTOS', 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $otherAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'COMUNICACIONES', 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $coordinatorRole = $this->role('coordinador_area', false);
        $coCoordinatorRole = $this->role('co_coordinador_area', false);
        $memberRole = $this->role('integrante', false);
        $coordinatorCargo = $this->cargo('COORDINADOR DE GESTIÓN DE PROYECTOS', $this->areaId, $coordinatorRole);
        $coCoordinatorCargo = $this->cargo('CO-COORDINADOR DE GESTIÓN DE PROYECTOS', $this->areaId, $coCoordinatorRole);
        $memberCargo = $this->cargo('MIEMBRO DE GESTIÓN DE PROYECTOS', $this->areaId, $memberRole);
        $otherCargo = $this->cargo('MIEMBRO DE COMUNICACIONES', $otherAreaId, $memberRole);

        [$this->coordinator] = $this->identity('Coordinadora', $coordinatorCargo);
        [$this->coCoordinator] = $this->identity('Co coordinadora', $coCoordinatorCargo);
        [$this->member, $this->memberId] = $this->identity('Miembro', $memberCargo);
        $this->identity('Otra area', $otherCargo);
    }

    /** @return array{User, int} */
    private function identity(string $name, int $cargoId): array
    {
        $now = now();
        $user = User::query()->create([
            'name' => $name,
            'email' => Str::slug($name).Str::random(5).'@example.test',
            'password' => Hash::make('password'),
        ]);
        $personaId = (string) Str::uuid();
        Schema::getConnection()->table('personas')->insert([
            'id' => $personaId, 'nombres' => $name, 'apellidos' => 'Prueba',
            'correo' => $user->email, 'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(), 'user_id' => $user->id, 'persona_id' => $personaId,
            'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $integranteId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personaId, 'estado' => 'Activo', 'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $integranteId, 'cargo_id' => $cargoId, 'estado' => 'Activo',
            'fecha_inicio' => today(), 'created_at' => $now, 'updated_at' => $now,
        ]);

        return [$user, $integranteId];
    }

    private function role(string $code, bool $accessTotal): int
    {
        return Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => $code, 'nombre' => $code, 'acceso_total' => $accessTotal,
            'activo' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function cargo(string $name, int $areaId, int $roleId): int
    {
        return Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => $name, 'area_id' => $areaId, 'rol_id' => $roleId,
            'activo' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('personas', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('correo')->nullable();
            $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo');
            $table->string('nombre');
            $table->boolean('acceso_total');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('areas', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('cargos', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre');
            $table->unsignedBigInteger('area_id');
            $table->unsignedBigInteger('rol_id');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('cuentas_acceso', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->uuid('persona_id');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('integrantes', function (Blueprint $table): void {
            $table->id();
            $table->uuid('persona_id');
            $table->string('estado');
            $table->text('avatar_path')->nullable();
            $table->timestamps();
        });
        Schema::create('integrantes_historial', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('integrante_id');
            $table->unsignedBigInteger('cargo_id');
            $table->string('estado');
            $table->date('fecha_inicio')->nullable();
            $table->timestamps();
        });
        Schema::create('permisos', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('rol_permisos', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('rol_id');
            $table->unsignedBigInteger('permiso_id');
            $table->string('alcance');
            $table->timestamps();
        });
        Schema::create('gp_capacitaciones', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('integrante_id')->unique();
            $table->timestamp('fase_1_completada_at')->nullable();
            $table->timestamp('fase_2_completada_at')->nullable();
            $table->timestamp('fase_3_completada_at')->nullable();
            $table->uuid('actualizado_por')->nullable();
            $table->timestamps();
        });
    }
}
