<?php

namespace Tests\Feature\Cargos;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CargoApiTest extends TestCase
{
    private User $user;

    private int $ownAreaId;

    private int $otherAreaId;

    private int $roleId;

    private int $identityCargoId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedIdentity();
        Sanctum::actingAs($this->user);
    }

    public function test_access_total_user_can_manage_cargos_through_the_api(): void
    {
        $this->getJson('/api/cargos')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.area', 'ADMINISTRACIÓN')
            ->assertJsonPath('data.0.rol.nombre', 'Administrador');

        $created = $this->postJson('/api/cargos', [
            'nombre' => ' analista ',
            'descripcion' => '  Análisis institucional  ',
            'area_id' => $this->otherAreaId,
            'rol_id' => $this->roleId,
        ])->assertCreated()
            ->assertJsonPath('data.nombre', 'ANALISTA')
            ->assertJsonPath('data.descripcion', 'Análisis institucional')
            ->assertJsonPath('data.area', 'MARKETING')
            ->assertJsonPath('data.rol_id', null)
            ->assertJsonPath('data.activo', true);

        $cargoId = $created->json('data.id');

        $this->putJson("/api/cargos/{$cargoId}", [
            'nombre' => 'especialista',
            'descripcion' => '',
            'area_id' => $this->ownAreaId,
            'rol_id' => $this->roleId,
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'ESPECIALISTA')
            ->assertJsonPath('data.descripcion', '')
            ->assertJsonPath('data.area_id', $this->ownAreaId)
            ->assertJsonPath('data.rol_id', null);

        $this->patchJson("/api/cargos/{$cargoId}/status", ['activo' => false])
            ->assertOk()
            ->assertJsonPath('data.activo', false);

        $this->assertDatabaseHas('cargos', [
            'id' => $cargoId,
            'nombre' => 'ESPECIALISTA',
            'activo' => false,
        ]);
    }

    public function test_active_cargo_name_is_unique_per_area_ignoring_case(): void
    {
        $this->postJson('/api/cargos', [
            'nombre' => 'coordinador',
            'area_id' => $this->ownAreaId,
            'rol_id' => $this->roleId,
        ])->assertUnprocessable()
            ->assertJsonPath('errors.nombre.0', 'Ya existe un cargo con ese nombre en esta área.');

        $inactiveCargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'COORDINADOR',
            'area_id' => $this->ownAreaId,
            'rol_id' => $this->roleId,
            'activo' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->patchJson("/api/cargos/{$inactiveCargoId}/status", ['activo' => true])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.nombre.0',
                'No se puede activar el cargo porque ya existe otro cargo activo con el mismo nombre en esta área.'
            );
    }

    public function test_active_area_is_required(): void
    {
        Schema::getConnection()->table('areas')->where('id', $this->otherAreaId)->update(['activo' => false]);

        $this->postJson('/api/cargos', [
            'nombre' => 'DISEÑADOR',
            'area_id' => $this->otherAreaId,
            'rol_id' => $this->roleId,
        ])->assertUnprocessable()
            ->assertJsonPath('errors.area_id.0', 'No puedes asignar un área inactiva al cargo.');

    }

    public function test_cargo_assigned_to_an_inactive_role_cannot_be_activated(): void
    {
        $inactiveRoleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'inactivo',
            'nombre' => 'Inactivo',
            'acceso_total' => false,
            'activo' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'DISEÑADOR',
            'area_id' => $this->otherAreaId,
            'rol_id' => $inactiveRoleId,
            'activo' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->patchJson("/api/cargos/{$cargoId}/status", ['activo' => true])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.rol_id.0',
                'No puedes activar un cargo asignado a un rol inactivo.'
            );
    }

    public function test_area_scoped_permission_only_exposes_and_manages_its_area(): void
    {
        Schema::getConnection()->table('roles')->where('id', $this->roleId)->update(['acceso_total' => false]);

        foreach (['cargos.ver', 'cargos.crear'] as $code) {
            $permissionId = Schema::getConnection()->table('permisos')->insertGetId([
                'codigo' => $code,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            Schema::getConnection()->table('rol_permisos')->insert([
                'rol_id' => $this->roleId,
                'permiso_id' => $permissionId,
                'alcance' => 'area',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Schema::getConnection()->table('cargos')->insert([
            'nombre' => 'DISEÑADOR',
            'area_id' => $this->otherAreaId,
            'rol_id' => $this->roleId,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/cargos')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->identityCargoId);

        $this->postJson('/api/cargos', [
            'nombre' => 'ANALISTA',
            'area_id' => $this->otherAreaId,
            'rol_id' => $this->roleId,
        ])->assertForbidden();
    }

    private function seedIdentity(): void
    {
        $now = now();
        $personaId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Administrador',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);
        $this->ownAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'ADMINISTRACIÓN',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->otherAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'MARKETING',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->roleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'admin',
            'nombre' => 'Administrador',
            'descripcion' => 'Administración total',
            'acceso_total' => true,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->identityCargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'COORDINADOR',
            'area_id' => $this->ownAreaId,
            'rol_id' => $this->roleId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('personas')->insert([
            'id' => $personaId,
            'nombres' => 'ADMINISTRADOR',
            'apellidos' => 'SEMBRIA',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $this->user->id,
            'persona_id' => $personaId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $integranteId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personaId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $integranteId,
            'cargo_id' => $this->identityCargoId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
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
            $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo');
            $table->string('nombre');
            $table->text('descripcion')->nullable();
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
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('area_id');
            $table->unsignedBigInteger('rol_id')->nullable();
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
    }
}
