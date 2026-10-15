<?php

namespace Tests\Feature\Roles;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleApiTest extends TestCase
{
    private User $user;

    private int $adminRoleId;

    private int $targetRoleId;

    private int $areaId;

    /** @var array<string, int> */
    private array $permissionIds = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedIdentity();
        Sanctum::actingAs($this->user);
    }

    public function test_access_total_user_can_manage_roles_and_permissions(): void
    {
        $this->getJson('/api/roles')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/roles/permissions/catalog')
            ->assertOk()
            ->assertJsonCount(count($this->permissionIds), 'data');

        $created = $this->postJson('/api/roles', [
            'codigo' => ' supervisor_ti ',
            'nombre' => ' supervisor de ti ',
            'descripcion' => '  Supervisa los sistemas  ',
            'acceso_total' => false,
        ])->assertCreated()
            ->assertJsonPath('data.codigo', 'supervisor_ti')
            ->assertJsonPath('data.nombre', 'SUPERVISOR DE TI')
            ->assertJsonPath('data.descripcion', 'Supervisa los sistemas')
            ->assertJsonPath('data.activo', true);

        $roleId = $created->json('data.id');

        $this->putJson("/api/roles/{$roleId}", [
            'codigo' => 'supervisor_sistemas',
            'nombre' => 'supervisor de sistemas',
            'descripcion' => '',
            'acceso_total' => false,
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'SUPERVISOR DE SISTEMAS')
            ->assertJsonPath('data.descripcion', null);

        $this->putJson("/api/roles/{$roleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $this->permissionIds['roles.ver'], 'alcance' => 'global'],
                ['permiso_id' => $this->permissionIds['roles.editar'], 'alcance' => 'global'],
            ],
        ])->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson("/api/roles/{$roleId}/permissions")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->patchJson("/api/roles/{$roleId}/status", ['activo' => false])
            ->assertOk()
            ->assertJsonPath('data.activo', false);

    }

    public function test_permissions_version_changes_only_when_effective_authorization_changes(): void
    {
        $initialVersion = $this->getJson('/api/me/permissions-version')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('success', true)
            ->json('permissions_version');

        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $initialVersion);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('profile.permissions_version', $initialVersion);

        $this->getJson('/api/me/permissions-version')
            ->assertOk()
            ->assertJsonPath('permissions_version', $initialVersion);

        Schema::getConnection()->table('rol_permisos')->insert([
            'rol_id' => $this->adminRoleId,
            'permiso_id' => $this->permissionIds['roles.ver'],
            'alcance' => 'global',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $permissionVersion = $this->getJson('/api/me/permissions-version')
            ->assertOk()
            ->json('permissions_version');

        $this->assertNotSame($initialVersion, $permissionVersion);

        Schema::getConnection()->table('rol_permisos')
            ->where('rol_id', $this->adminRoleId)
            ->where('permiso_id', $this->permissionIds['roles.ver'])
            ->update(['alcance' => 'area', 'updated_at' => now()]);

        $scopeVersion = $this->getJson('/api/me/permissions-version')
            ->assertOk()
            ->json('permissions_version');

        $this->assertNotSame($permissionVersion, $scopeVersion);
    }

    public function test_role_code_and_name_are_unique_ignoring_case(): void
    {
        $this->postJson('/api/roles', [
            'codigo' => 'operador',
            'nombre' => 'otro nombre',
            'acceso_total' => false,
        ])->assertUnprocessable()
            ->assertJsonPath('errors.codigo.0', 'Ya existe un rol con ese código o nombre.');

        $this->postJson('/api/roles', [
            'codigo' => 'otro_codigo',
            'nombre' => 'operador',
            'acceso_total' => false,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('codigo');
    }

    public function test_permission_catalog_places_module_view_first_in_each_category(): void
    {
        $catalog = $this->getJson('/api/roles/permissions/catalog')
            ->assertOk()
            ->json('data');

        $permissionsByModule = collect($catalog)->groupBy('modulo');

        $this->assertSame('cargos.ver', $permissionsByModule->get('cargos')->first()['codigo']);
        $this->assertSame('roles.ver', $permissionsByModule->get('roles')->first()['codigo']);
    }

    public function test_project_permissions_are_internal_and_are_preserved_when_other_permissions_change(): void
    {
        $connection = Schema::getConnection();
        $teamPermissionId = $connection->table('permisos')->insertGetId([
            'codigo' => 'gp.equipos.ver',
            'nombre' => 'VER MÓDULO DE EQUIPOS',
            'modulo' => 'equipos',
            'accion' => 'ver',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $callPermissionId = $connection->table('permisos')->insertGetId([
            'codigo' => 'gp.convocatorias.ver',
            'nombre' => 'VER MÓDULO DE CONVOCATORIAS',
            'modulo' => 'convocatorias',
            'accion' => 'ver',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $connection->table('rol_permisos')->insert([
            'rol_id' => $this->targetRoleId,
            'permiso_id' => $teamPermissionId,
            'alcance' => 'area',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/roles/permissions/catalog')
            ->assertOk()
            ->assertJsonMissing(['modulo' => 'equipos'])
            ->assertJsonMissing(['modulo' => 'convocatorias']);
        $this->getJson("/api/roles/{$this->targetRoleId}/permissions")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $this->permissionIds['roles.ver'], 'alcance' => 'area'],
            ],
        ])->assertOk()->assertJsonCount(1, 'data');

        $this->assertDatabaseHas('rol_permisos', [
            'rol_id' => $this->targetRoleId,
            'permiso_id' => $teamPermissionId,
            'alcance' => 'area',
        ]);
        $this->assertDatabaseHas('rol_permisos', [
            'rol_id' => $this->targetRoleId,
            'permiso_id' => $this->permissionIds['roles.ver'],
            'alcance' => 'area',
        ]);

        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $callPermissionId, 'alcance' => 'area'],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors('permisos');
    }

    public function test_role_with_active_positions_cannot_be_deactivated(): void
    {
        Schema::getConnection()->table('cargos')->insert([
            'nombre' => 'Operador',
            'area_id' => $this->areaId,
            'rol_id' => $this->targetRoleId,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->patchJson("/api/roles/{$this->targetRoleId}/status", ['activo' => false])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('activo');

    }

    public function test_access_total_user_can_manage_cargos_from_a_role(): void
    {
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'ANALISTA',
            'area_id' => $this->areaId,
            'rol_id' => null,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson("/api/roles/{$this->targetRoleId}/cargos")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'id' => $cargoId,
                'nombre' => 'ANALISTA',
                'rol_id' => null,
            ]);

        $this->putJson("/api/roles/{$this->targetRoleId}/cargos", [
            'cargo_ids' => [$cargoId],
        ])->assertOk();

        $this->assertDatabaseHas('cargos', [
            'id' => $cargoId,
            'rol_id' => $this->targetRoleId,
        ]);

        $this->putJson("/api/roles/{$this->targetRoleId}/cargos", [
            'cargo_ids' => [],
        ])->assertOk();

        $this->assertDatabaseHas('cargos', ['id' => $cargoId, 'rol_id' => null]);

        $assignedCargoId = Schema::getConnection()->table('cargos')
            ->where('rol_id', $this->adminRoleId)
            ->value('id');

        $this->putJson("/api/roles/{$this->targetRoleId}/cargos", [
            'cargo_ids' => [$assignedCargoId],
        ])->assertUnprocessable()
            ->assertJsonPath(
                'errors.cargo_ids.0',
                'Uno o más cargos seleccionados ya pertenecen a otro rol.'
            );

        $this->assertDatabaseHas('cargos', [
            'id' => $assignedCargoId,
            'rol_id' => $this->adminRoleId,
        ]);
    }

    public function test_area_scoped_permission_can_list_but_cannot_mutate_institutional_roles(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->adminRoleId)
            ->update(['acceso_total' => false]);

        $now = now();
        Schema::getConnection()->table('rol_permisos')->insert([
            [
                'rol_id' => $this->adminRoleId,
                'permiso_id' => $this->permissionIds['roles.ver'],
                'alcance' => 'area',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'rol_id' => $this->adminRoleId,
                'permiso_id' => $this->permissionIds['roles.crear'],
                'alcance' => 'area',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'rol_id' => $this->adminRoleId,
                'permiso_id' => $this->permissionIds['roles.gestionar_cargos'],
                'alcance' => 'area',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $this->getJson('/api/roles')->assertOk();
        $this->getJson('/api/roles/permissions/catalog')->assertForbidden();
        $this->getJson("/api/roles/{$this->targetRoleId}/permissions")->assertForbidden();
        $this->getJson("/api/roles/{$this->targetRoleId}/cargos")->assertForbidden();
        $this->putJson("/api/roles/{$this->targetRoleId}/cargos", ['cargo_ids' => []])
            ->assertForbidden();

        $this->postJson('/api/roles', [
            'codigo' => 'sin_alcance',
            'nombre' => 'SIN ALCANCE',
            'acceso_total' => false,
        ])->assertForbidden();
    }

    public function test_permission_replacement_rejects_inactive_permissions(): void
    {
        Schema::getConnection()->table('permisos')
            ->where('id', $this->permissionIds['roles.editar'])
            ->update(['activo' => false]);

        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $this->permissionIds['roles.editar'], 'alcance' => 'global'],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('permisos');
    }

    public function test_permission_replacement_requires_module_view_permission_and_compatible_scope(): void
    {
        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $this->permissionIds['roles.editar'], 'alcance' => 'global'],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('permisos');

        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $this->permissionIds['roles.ver'], 'alcance' => 'area'],
                ['permiso_id' => $this->permissionIds['roles.editar'], 'alcance' => 'global'],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('permisos');

        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $this->permissionIds['roles.ver'], 'alcance' => 'global'],
                ['permiso_id' => $this->permissionIds['roles.editar'], 'alcance' => 'area'],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('permisos');
    }

    public function test_create_or_edit_cannot_grant_total_access_without_permission_management(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->adminRoleId)
            ->update(['acceso_total' => false]);

        $now = now();
        foreach (['roles.ver', 'roles.crear', 'roles.editar'] as $code) {
            Schema::getConnection()->table('rol_permisos')->insert([
                'rol_id' => $this->adminRoleId,
                'permiso_id' => $this->permissionIds[$code],
                'alcance' => 'global',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $created = $this->postJson('/api/roles', [
            'codigo' => 'rol_limitado',
            'nombre' => 'ROL LIMITADO',
            'acceso_total' => false,
        ])->assertCreated();

        $this->postJson('/api/roles', [
            'codigo' => 'rol_total',
            'nombre' => 'ROL TOTAL',
            'acceso_total' => true,
        ])->assertForbidden();

        $this->putJson('/api/roles/'.$created->json('data.id'), [
            'codigo' => 'rol_limitado',
            'nombre' => 'ROL LIMITADO',
            'acceso_total' => true,
        ])->assertForbidden();
    }

    public function test_permission_management_can_toggle_total_access_without_role_edit_permission(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->adminRoleId)
            ->update(['acceso_total' => false]);

        $now = now();
        foreach (['roles.ver', 'roles.gestionar_permisos'] as $code) {
            Schema::getConnection()->table('rol_permisos')->insert([
                'rol_id' => $this->adminRoleId,
                'permiso_id' => $this->permissionIds[$code],
                'alcance' => 'global',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [],
            'acceso_total' => true,
        ])->assertOk();

        $this->assertDatabaseHas('roles', [
            'id' => $this->targetRoleId,
            'acceso_total' => true,
        ]);

        $this->putJson("/api/roles/{$this->targetRoleId}/permissions", [
            'permisos' => [
                ['permiso_id' => $this->permissionIds['roles.ver'], 'alcance' => 'global'],
            ],
            'acceso_total' => false,
        ])->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertDatabaseHas('roles', [
            'id' => $this->targetRoleId,
            'acceso_total' => false,
        ]);
    }

    public function test_cargo_permission_does_not_grant_access_to_roles(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->adminRoleId)
            ->update(['acceso_total' => false]);
        Schema::getConnection()->table('rol_permisos')->insert([
            'rol_id' => $this->adminRoleId,
            'permiso_id' => $this->permissionIds['cargos.ver'],
            'alcance' => 'area',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/roles')->assertForbidden();
        $this->getJson('/api/roles/permissions/catalog')->assertForbidden();
    }

    private function seedIdentity(): void
    {
        $now = now();
        $personId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Administrador',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        $this->adminRoleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'admin',
            'nombre' => 'ADMINISTRADOR',
            'acceso_total' => true,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->targetRoleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'operador',
            'nombre' => 'OPERADOR',
            'acceso_total' => false,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'SISTEMAS',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'Administrador',
            'area_id' => $this->areaId,
            'rol_id' => $this->adminRoleId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        foreach ([
            'roles.ver',
            'roles.crear',
            'roles.editar',
            'roles.desactivar',
            'roles.gestionar_permisos',
            'roles.gestionar_cargos',
            'cargos.ver',
            'cargos.crear',
        ] as $code) {
            $this->permissionIds[$code] = Schema::getConnection()->table('permisos')->insertGetId([
                'codigo' => $code,
                'nombre' => mb_strtoupper($code),
                'modulo' => str_starts_with($code, 'cargos.') ? 'cargos' : 'roles',
                'accion' => explode('.', $code, 2)[1],
                'activo' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        Schema::getConnection()->table('personas')->insert([
            'id' => $personId,
            'nombres' => 'ADMINISTRADOR',
            'apellidos' => 'SEMBRIA',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $this->user->id,
            'persona_id' => $personId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $memberId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $memberId,
            'cargo_id' => $cargoId,
            'estado' => 'Activo',
            'fecha_inicio' => now()->toDateString(),
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
            $table->string('correo')->nullable();
            $table->timestamp('ultimo_envio_credenciales')->nullable();
            $table->timestamp('password_temporal_expira_en')->nullable();
            $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre')->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('acceso_total');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('permisos', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombre');
            $table->string('modulo');
            $table->string('accion');
            $table->text('descripcion')->nullable();
            $table->boolean('activo');
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
        Schema::create('areas', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
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
            $table->boolean('must_change_password')->default(false);
            $table->timestamps();
        });
        Schema::create('integrantes', function (Blueprint $table): void {
            $table->id();
            $table->uuid('persona_id');
            $table->string('estado');
            $table->boolean('accesos_pendientes_revision')->default(false);
            $table->date('fecha_nacimiento')->nullable();
            $table->string('avatar_path')->nullable();
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
            $table->string('tipo_integrante')->default('voluntario');
            $table->string('estado');
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->integer('periodo_meses')->nullable();
            $table->boolean('requiere_asistencia')->default(true);
            $table->string('institucion_educativa')->nullable();
            $table->integer('horas_practicas_requeridas')->nullable();
            $table->string('carrera')->nullable();
            $table->string('ciclo')->nullable();
            $table->string('modalidad')->nullable();
            $table->timestamps();
        });
    }
}
