<?php

namespace Tests\Feature\Areas;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AreaApiTest extends TestCase
{
    private User $user;

    private int $ownAreaId;

    private int $otherAreaId;

    private int $roleId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedIdentity();
        Sanctum::actingAs($this->user);
    }

    public function test_access_total_user_can_manage_areas_through_the_api(): void
    {
        $this->getJson('/api/areas')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $created = $this->postJson('/api/areas', [
            'nombre' => ' recursos humanos ',
            'descripcion' => '  Gestión del talento  ',
        ])->assertCreated()
            ->assertJsonPath('data.nombre', 'RECURSOS HUMANOS')
            ->assertJsonPath('data.descripcion', 'Gestión del talento')
            ->assertJsonPath('data.activo', true);

        $areaId = $created->json('data.id');

        $this->putJson("/api/areas/{$areaId}", [
            'nombre' => 'personas',
            'descripcion' => '',
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'PERSONAS')
            ->assertJsonPath('data.descripcion', null);

        $this->patchJson("/api/areas/{$areaId}/status", ['activo' => false])
            ->assertOk()
            ->assertJsonPath('data.activo', false);

        $this->assertDatabaseHas('areas', [
            'id' => $areaId,
            'nombre' => 'PERSONAS',
            'activo' => false,
        ]);
    }

    public function test_name_is_required_and_unique_ignoring_case(): void
    {
        $this->postJson('/api/areas', ['nombre' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('errors.nombre.0', 'El campo nombre es obligatorio.');

        $this->postJson('/api/areas', ['nombre' => 'administración'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.nombre.0', 'Ya existe un área con ese nombre.');
    }

    public function test_area_with_active_positions_cannot_be_deactivated(): void
    {
        $this->patchJson("/api/areas/{$this->ownAreaId}/status", ['activo' => false])
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.activo.0',
                'No puedes desactivar esta área porque tiene cargos activos asociados. Desactiva primero sus cargos activos.'
            );

        $this->assertDatabaseHas('areas', ['id' => $this->ownAreaId, 'activo' => true]);
    }

    public function test_area_scoped_permission_only_exposes_the_users_area(): void
    {
        Schema::getConnection()->table('roles')->where('id', $this->roleId)->update(['acceso_total' => false]);
        $permissionId = Schema::getConnection()->table('permisos')->insertGetId([
            'codigo' => 'areas.ver',
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

        $this->getJson('/api/areas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->ownAreaId);

        $this->getJson("/api/areas/{$this->otherAreaId}")->assertForbidden();
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
            'acceso_total' => true,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'Coordinador',
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
            'cargo_id' => $cargoId,
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
            $table->boolean('acceso_total');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('areas', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
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
