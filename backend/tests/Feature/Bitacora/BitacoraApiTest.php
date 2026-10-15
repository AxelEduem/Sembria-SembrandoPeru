<?php

namespace Tests\Feature\Bitacora;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BitacoraApiTest extends TestCase
{
    private User $user;

    private int $roleId;

    private int $areaId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedIdentity();
        Sanctum::actingAs($this->user);
    }

    public function test_authorized_user_can_filter_and_export_the_audit_log(): void
    {
        Schema::getConnection()->table('bitacora')->insert([
            [
                'actor_nombre' => 'ANA ADMIN',
                'actor_correo' => 'ana@example.com',
                'area_id' => $this->areaId,
                'area_nombre' => 'ADMINISTRACIÓN',
                'modulo' => 'areas',
                'accion' => 'store',
                'descripcion' => 'Creó un registro en el módulo areas.',
                'metodo' => 'POST',
                'ruta' => 'areas',
                'estado_http' => 201,
                'resultado' => 'exitoso',
                'campos_modificados' => json_encode(['nombre']),
                'contexto' => json_encode([]),
                'created_at' => now(),
            ],
            [
                'actor_nombre' => 'ANA ADMIN',
                'actor_correo' => 'ana@example.com',
                'area_id' => $this->areaId,
                'area_nombre' => 'ADMINISTRACIÓN',
                'modulo' => 'cargos',
                'accion' => 'update',
                'descripcion' => 'Actualizó un registro en el módulo cargos.',
                'metodo' => 'PUT',
                'ruta' => 'cargos/4',
                'estado_http' => 422,
                'resultado' => 'error',
                'campos_modificados' => json_encode(['nombre']),
                'contexto' => json_encode(['cargo' => 4]),
                'created_at' => now(),
            ],
        ]);

        $this->getJson('/api/bitacora?modulo=areas&resultado=exitoso')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.modulo', 'areas')
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.exitosos', 1)
            ->assertJsonPath('summary.errores', 0);

        $this->getJson('/api/bitacora/exportar?resultado=error')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.resultado', 'error')
            ->assertJsonPath('meta.truncated', false);

        $this->getJson('/api/bitacora/metricas')
            ->assertOk()
            ->assertJsonPath('data.summary.total', 2)
            ->assertJsonPath('data.summary.tasa_exito', 50)
            ->assertJsonCount(2, 'data.por_modulo');
    }

    public function test_mutating_requests_are_logged_without_sensitive_values(): void
    {
        $response = $this->postJson('/api/areas', [
            'nombre' => 'Talento',
            'descripcion' => 'Gestión institucional',
            'password' => 'secreto-que-no-debe-guardarse',
        ])->assertCreated();

        $record = Schema::getConnection()->table('bitacora')->latest('id')->first();

        $this->assertNotNull($record);
        $this->assertSame('areas', $record->modulo);
        $this->assertSame('store', $record->accion);
        $this->assertSame('exitoso', $record->resultado);
        $this->assertSame(201, $record->estado_http);
        $this->assertSame('avatars/ana.webp', $record->actor_avatar_path);
        $this->assertSame(['nombre', 'descripcion'], json_decode($record->campos_modificados, true));
        $this->assertSame('area', $record->entidad_tipo);
        $this->assertSame((string) $response->json('data.id'), $record->entidad_id);
        $this->assertSame('Creó el área TALENTO en el módulo areas.', $record->descripcion);
        $this->assertSame('TALENTO', json_decode($record->contexto, true)['entidad_nombre']);
        $this->assertStringNotContainsString('secreto-que-no-debe-guardarse', json_encode($record));
        $this->assertSame('TALENTO', $response->json('data.nombre'));

        $this->getJson('/api/bitacora')
            ->assertOk()
            ->assertJsonPath('data.0.entidad.nombre', 'TALENTO');
    }

    public function test_permissions_are_enforced_separately_for_viewing_and_exporting(): void
    {
        Schema::getConnection()->table('roles')->where('id', $this->roleId)->update(['acceso_total' => false]);
        $permissionId = Schema::getConnection()->table('permisos')->insertGetId([
            'codigo' => 'bitacora.ver',
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

        $this->getJson('/api/bitacora')->assertOk();
        $this->getJson('/api/bitacora/exportar')->assertForbidden();
        $this->getJson('/api/bitacora/metricas')->assertForbidden();
    }

    private function seedIdentity(): void
    {
        $now = now();
        $personaId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Ana Admin',
            'email' => 'ana@example.com',
            'password' => Hash::make('password'),
        ]);
        $this->areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'ADMINISTRACIÓN', 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->roleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'admin', 'nombre' => 'Administrador', 'acceso_total' => true, 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'Coordinador', 'area_id' => $this->areaId, 'rol_id' => $this->roleId, 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('personas')->insert([
            'id' => $personaId, 'nombres' => 'ANA', 'apellidos' => 'ADMIN', 'correo' => 'ana@example.com', 'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(), 'user_id' => $this->user->id, 'persona_id' => $personaId, 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $integranteId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personaId, 'estado' => 'Activo', 'avatar_path' => 'avatars/ana.webp', 'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $integranteId, 'cargo_id' => $cargoId, 'estado' => 'Activo', 'fecha_inicio' => today(), 'created_at' => $now, 'updated_at' => $now,
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
        Schema::create('bitacora', function (Blueprint $table): void {
            $table->id();
            $table->uuid('cuenta_acceso_id')->nullable();
            $table->unsignedBigInteger('area_id')->nullable();
            $table->string('actor_nombre');
            $table->string('actor_correo')->nullable();
            $table->text('actor_avatar_path')->nullable();
            $table->string('area_nombre')->nullable();
            $table->string('modulo');
            $table->string('accion');
            $table->text('descripcion');
            $table->string('entidad_tipo')->nullable();
            $table->string('entidad_id')->nullable();
            $table->string('metodo');
            $table->string('ruta');
            $table->unsignedSmallInteger('estado_http');
            $table->string('resultado');
            $table->json('campos_modificados')->nullable();
            $table->json('contexto')->nullable();
            $table->string('ip')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }
}
