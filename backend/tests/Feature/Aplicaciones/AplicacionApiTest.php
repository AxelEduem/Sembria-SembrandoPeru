<?php

namespace Tests\Feature\Aplicaciones;

use App\Models\User;
use DateTimeInterface;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class AplicacionApiTest extends TestCase
{
    private User $user;

    private int $ownAreaId;

    private int $otherAreaId;

    private int $roleId;

    protected function setUp(): void
    {
        parent::setUp();
        config(['filesystems.application_logo_disk' => 'application_logo_test']);
        Storage::fake('application_logo_test');
        $this->createSchema();
        $this->seedIdentity();
        Sanctum::actingAs($this->user);
    }

    public function test_access_total_user_can_manage_applications_and_logos(): void
    {
        $created = $this->post('/api/aplicaciones', [
            'nombre' => ' GitHub ',
            'descripcion' => ' Repositorios institucionales ',
            'licencias_total' => 12,
            'area_id' => $this->otherAreaId,
            'logo_file' => UploadedFile::fake()->create('github.png', 100, 'image/png'),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'GitHub')
            ->assertJsonPath('data.descripcion', 'Repositorios institucionales')
            ->assertJsonPath('data.licencias_total', 12)
            ->assertJsonPath('data.area', 'MARKETING')
            ->assertJsonPath('data.activo', true);

        $applicationId = $created->json('data.id');
        $firstPath = $created->json('data.imagen_path');
        Storage::disk('application_logo_test')->assertExists($firstPath);

        $updated = $this->post("/api/aplicaciones/{$applicationId}", [
            '_method' => 'PUT',
            'nombre' => 'GitHub Enterprise',
            'descripcion' => '',
            'licencias_total' => 15,
            'logo_file' => UploadedFile::fake()->create('enterprise.webp', 100, 'image/webp'),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.nombre', 'GitHub Enterprise')
            ->assertJsonPath('data.descripcion', '')
            ->assertJsonPath('data.area_id', $this->otherAreaId);

        Storage::disk('application_logo_test')->assertMissing($firstPath);
        Storage::disk('application_logo_test')->assertExists($updated->json('data.imagen_path'));

        $this->patchJson("/api/aplicaciones/{$applicationId}/status", ['activo' => false])
            ->assertOk()
            ->assertJsonPath('data.activo', false);

        $this->getJson('/api/aplicaciones')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $applicationId);
    }

    public function test_s3_logos_are_returned_with_a_temporary_signed_url(): void
    {
        config(['filesystems.application_logo_disk' => 's3']);
        $path = 'application-logos/1/logo.png';
        $applicationId = $this->insertApplication('Aplicación con logo', 1, $this->ownAreaId);
        Schema::getConnection()->table('aplicaciones')
            ->where('id', $applicationId)
            ->update(['imagen_path' => $path]);

        $disk = Mockery::mock();
        $disk->shouldReceive('temporaryUrl')
            ->once()
            ->with($path, Mockery::type(DateTimeInterface::class))
            ->andReturn('https://s3.example.test/logo.png?X-Amz-Signature=signed');
        Storage::shouldReceive('disk')->once()->with('s3')->andReturn($disk);

        $this->getJson("/api/aplicaciones/{$applicationId}")
            ->assertOk()
            ->assertJsonPath(
                'data.imagen_url',
                'https://s3.example.test/logo.png?X-Amz-Signature=signed',
            );
    }

    public function test_name_is_unique_ignoring_case_and_whitespace(): void
    {
        $this->insertApplication('Notion');

        $this->postJson('/api/aplicaciones', [
            'nombre' => '  NOTION  ',
            'licencias_total' => 1,
        ])->assertUnprocessable()
            ->assertJsonPath('errors.nombre.0', 'Ya existe una aplicación con ese nombre.');
    }

    public function test_licenses_cannot_be_reduced_below_active_assignments(): void
    {
        $applicationId = $this->insertApplication('Slack', 5, $this->ownAreaId);
        $historyId = Schema::getConnection()->table('integrantes_historial')->value('id');

        foreach (range(1, 2) as $index) {
            Schema::getConnection()->table('integrante_aplicaciones')->insert([
                'aplicacion_id' => $applicationId,
                'historial_id' => $historyId,
                'activo' => true,
                'created_at' => now()->addSeconds($index),
                'updated_at' => now()->addSeconds($index),
            ]);
        }

        $this->putJson("/api/aplicaciones/{$applicationId}", [
            'nombre' => 'Slack',
            'licencias_total' => 1,
        ])->assertUnprocessable()
            ->assertJsonPath(
                'errors.licencias_total.0',
                'No puedes reducir las licencias por debajo de las asignaciones actuales.'
            );
    }

    public function test_create_permission_does_not_allow_editing_or_changing_status(): void
    {
        Schema::getConnection()->table('roles')->where('id', $this->roleId)->update(['acceso_total' => false]);

        foreach (['aplicaciones.ver', 'aplicaciones.crear'] as $code) {
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

        $applicationId = $this->insertApplication('Slack', 5, $this->ownAreaId);

        $this->putJson("/api/aplicaciones/{$applicationId}", [
            'nombre' => 'Slack Enterprise',
            'licencias_total' => 5,
        ])->assertForbidden();

        $this->patchJson("/api/aplicaciones/{$applicationId}/status", ['activo' => false])
            ->assertForbidden();
    }

    public function test_area_scoped_permissions_only_expose_and_manage_the_own_area(): void
    {
        Schema::getConnection()->table('roles')->where('id', $this->roleId)->update(['acceso_total' => false]);

        foreach (['aplicaciones.ver', 'aplicaciones.crear', 'aplicaciones.editar', 'aplicaciones.desactivar'] as $code) {
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

        $ownId = $this->insertApplication('Aplicación propia', 2, $this->ownAreaId);
        $generalId = $this->insertApplication('Aplicación general');
        $otherId = $this->insertApplication('Aplicación externa', 2, $this->otherAreaId);

        $this->getJson('/api/aplicaciones')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $ownId])
            ->assertJsonMissing(['id' => $generalId])
            ->assertJsonMissing(['id' => $otherId]);
        $this->getJson("/api/aplicaciones/{$ownId}")->assertOk();
        $this->getJson("/api/aplicaciones/{$generalId}")->assertForbidden();
        $this->getJson("/api/aplicaciones/{$otherId}")->assertForbidden();

        $created = $this->postJson('/api/aplicaciones', [
            'nombre' => 'Aplicación asignada',
            'licencias_total' => 3,
            'area_id' => $this->otherAreaId,
        ])->assertCreated();
        $this->assertSame($this->ownAreaId, $created->json('data.area_id'));

        $createdId = $created->json('data.id');
        $this->putJson("/api/aplicaciones/{$createdId}", [
            'nombre' => 'Aplicación asignada actualizada',
            'licencias_total' => 4,
        ])->assertOk();
        $this->patchJson("/api/aplicaciones/{$createdId}/status", ['activo' => false])
            ->assertOk()
            ->assertJsonPath('data.activo', false);

        $this->putJson("/api/aplicaciones/{$otherId}", [
            'nombre' => 'Intento externo',
            'licencias_total' => 2,
        ])->assertForbidden();

        $this->patchJson("/api/aplicaciones/{$generalId}/status", ['activo' => false])
            ->assertForbidden();
    }

    private function insertApplication(string $name, int $licenses = 1, ?int $areaId = null): int
    {
        return Schema::getConnection()->table('aplicaciones')->insertGetId([
            'nombre' => $name,
            'licencias_total' => $licenses,
            'area_id' => $areaId,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
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
        $memberId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personaId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $memberId,
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
        Schema::create('aplicaciones', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->text('imagen_url')->nullable();
            $table->text('imagen_path')->nullable();
            $table->unsignedInteger('licencias_total');
            $table->unsignedBigInteger('area_id')->nullable();
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('integrante_aplicaciones', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('aplicacion_id');
            $table->unsignedBigInteger('historial_id');
            $table->boolean('activo');
            $table->timestamps();
        });
    }
}
