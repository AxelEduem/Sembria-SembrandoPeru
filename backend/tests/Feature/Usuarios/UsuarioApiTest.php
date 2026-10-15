<?php

namespace Tests\Feature\Usuarios;

use App\Mail\AccessCredentialsMail;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UsuarioApiTest extends TestCase
{
    private User $user;

    private int $ownAreaId;

    private int $otherAreaId;

    private int $roleId;

    private int $ownTargetId;

    private int $otherTargetId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedIdentityAndTargets();
        Sanctum::actingAs($this->user);
    }

    public function test_access_total_user_can_list_and_configure_an_access_account(): void
    {
        $this->getJson('/api/usuarios')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment([
                'integrante_id' => $this->ownTargetId,
                'nombre' => 'ANA TORRES',
                'avatar_path' => 'avatars/ana-torres.webp',
                'acceso_configurado' => false,
                'area' => 'ADMINISTRACIÓN',
                'cargo' => 'COORDINADOR',
            ]);

        $response = $this->postJson("/api/usuarios/{$this->ownTargetId}/access", [
            'correo' => '  ANA.TORRES@SEMBRANDOPERU.ORG ',
            'password' => 'Temporal-2026',
            'enviar_correo' => false,
        ])->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('email_sent', false)
            ->assertJsonPath('email_warning', null)
            ->assertJsonPath('user.correo', 'ana.torres@sembrandoperu.org')
            ->assertJsonPath('user.acceso_configurado', true)
            ->assertJsonPath('user.must_change_password', true);

        $createdUser = User::query()->where('email', 'ana.torres@sembrandoperu.org')->firstOrFail();

        $this->assertTrue(Hash::check('Temporal-2026', $createdUser->password));
        $this->assertNotNull($createdUser->email_verified_at);
        $this->assertDatabaseHas('cuentas_acceso', [
            'user_id' => $createdUser->id,
            'activo' => true,
            'must_change_password' => true,
        ]);
        $this->assertDatabaseHas('personas', [
            'id' => $response->json('user.persona_id'),
            'correo' => 'ana.torres@sembrandoperu.org',
        ]);
        $this->assertNotNull(
            Schema::getConnection()->table('personas')
                ->where('id', $response->json('user.persona_id'))
                ->value('password_temporal_expira_en')
        );
    }

    public function test_credentials_can_be_sent_by_email(): void
    {
        Mail::fake();
        config(['app.frontend_url' => 'https://sembria.test']);

        $this->postJson("/api/usuarios/{$this->ownTargetId}/access", [
            'correo' => 'ana.torres@sembrandoperu.org',
            'password' => 'Temporal-2026',
            'enviar_correo' => true,
        ])->assertCreated()
            ->assertJsonPath('email_sent', true)
            ->assertJsonPath('email_warning', null);

        Mail::assertSent(
            AccessCredentialsMail::class,
            fn (AccessCredentialsMail $mail) => $mail->hasTo('ana.torres@sembrandoperu.org')
                && $mail->temporaryPassword === 'Temporal-2026'
                && $mail->loginUrl === 'https://sembria.test'
        );

        $this->assertNotNull(
            Schema::getConnection()->table('personas')
                ->where('correo', 'ana.torres@sembrandoperu.org')
                ->value('ultimo_envio_credenciales')
        );
    }

    public function test_reset_credentials_can_be_copied_without_sending_email(): void
    {
        Mail::fake();

        $this->postJson("/api/usuarios/{$this->ownTargetId}/access", [
            'correo' => 'ana.torres@sembrandoperu.org',
            'password' => 'Temporal-2026',
            'enviar_correo' => false,
        ])->assertCreated();

        $response = $this->postJson("/api/usuarios/{$this->ownTargetId}/resend-credentials", [
            'enviar_correo' => false,
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('email_sent', false)
            ->assertJsonPath('email_warning', null);

        $password = $response->json('password');

        $this->assertIsString($password);
        $this->assertNotSame('', $password);
        $this->assertTrue(Hash::check(
            $password,
            User::query()->where('email', 'ana.torres@sembrandoperu.org')->firstOrFail()->password,
        ));
        Mail::assertNothingSent();
    }

    public function test_reset_credentials_can_also_be_sent_by_email(): void
    {
        Mail::fake();

        $this->postJson("/api/usuarios/{$this->ownTargetId}/access", [
            'correo' => 'ana.torres@sembrandoperu.org',
            'password' => 'Temporal-2026',
            'enviar_correo' => false,
        ])->assertCreated();

        $response = $this->postJson("/api/usuarios/{$this->ownTargetId}/resend-credentials", [
            'enviar_correo' => true,
        ])->assertOk()
            ->assertJsonPath('email_sent', true)
            ->assertJsonPath('email_warning', null);

        Mail::assertSent(
            AccessCredentialsMail::class,
            fn (AccessCredentialsMail $mail) => $mail->hasTo('ana.torres@sembrandoperu.org')
                && $mail->temporaryPassword === $response->json('password')
        );
    }

    public function test_area_scope_only_lists_and_manages_users_from_the_same_area(): void
    {
        Schema::getConnection()->table('roles')->where('id', $this->roleId)->update([
            'acceso_total' => false,
        ]);
        $this->grantPermission('usuarios.ver', 'area');
        $this->grantPermission('usuarios.configurar_acceso', 'area');

        $this->getJson('/api/usuarios')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['integrante_id' => $this->ownTargetId])
            ->assertJsonMissing(['integrante_id' => $this->otherTargetId]);

        $this->postJson("/api/usuarios/{$this->otherTargetId}/access", [
            'correo' => 'externo@sembrandoperu.org',
            'password' => 'Temporal-2026',
            'enviar_correo' => false,
        ])->assertForbidden();

        $this->assertDatabaseMissing('users', ['email' => 'externo@sembrandoperu.org']);
    }

    public function test_user_actions_require_their_specific_permissions(): void
    {
        $this->postJson("/api/usuarios/{$this->ownTargetId}/access", [
            'correo' => 'ana.torres@sembrandoperu.org',
            'password' => 'Temporal-2026',
            'enviar_correo' => false,
        ])->assertCreated();

        Schema::getConnection()->table('roles')->where('id', $this->roleId)->update([
            'acceso_total' => false,
        ]);
        $this->grantPermission('usuarios.ver', 'area');
        $this->grantPermission('usuarios.restablecer_contrasena', 'area');

        $this->postJson("/api/usuarios/{$this->ownTargetId}/resend-credentials", [
            'enviar_correo' => false,
        ])->assertOk();

        $this->patchJson("/api/usuarios/{$this->ownTargetId}/email", [
            'correo' => 'ana.actualizada@sembrandoperu.org',
        ])->assertForbidden();

        $this->postJson("/api/usuarios/{$this->otherTargetId}/access", [
            'correo' => 'luis.ramos@sembrandoperu.org',
            'password' => 'Temporal-2026',
            'enviar_correo' => false,
        ])->assertForbidden();

        $this->grantPermission('usuarios.editar_correo', 'area');

        $this->patchJson("/api/usuarios/{$this->ownTargetId}/email", [
            'correo' => 'ana.actualizada@sembrandoperu.org',
        ])->assertOk()
            ->assertJsonPath('data.correo', 'ana.actualizada@sembrandoperu.org');
    }

    public function test_access_data_and_email_uniqueness_are_validated(): void
    {
        $this->postJson("/api/usuarios/{$this->ownTargetId}/access", [
            'correo' => 'ana@gmail.com',
            'password' => 'short',
            'enviar_correo' => false,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['correo', 'password'])
            ->assertJsonPath('errors.correo.0', 'El correo debe usar el dominio @sembrandoperu.org.')
            ->assertJsonPath('errors.password.0', 'La contraseña debe tener entre 8 y 128 caracteres.');

        User::query()->create([
            'name' => 'Correo existente',
            'email' => 'ocupado@sembrandoperu.org',
            'password' => 'password-seguro',
        ]);

        $this->postJson("/api/usuarios/{$this->ownTargetId}/access", [
            'correo' => 'ocupado@sembrandoperu.org',
            'password' => 'Temporal-2026',
            'enviar_correo' => false,
        ])->assertUnprocessable()
            ->assertJsonPath('errors.correo.0', 'Ese correo institucional ya está en uso.');
    }

    private function grantPermission(string $code, string $scope): void
    {
        $permissionId = Schema::getConnection()->table('permisos')->insertGetId([
            'codigo' => $code,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Schema::getConnection()->table('rol_permisos')->insert([
            'rol_id' => $this->roleId,
            'permiso_id' => $permissionId,
            'alcance' => $scope,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedIdentityAndTargets(): void
    {
        $now = now();
        $adminPersonaId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Administrador',
            'email' => 'admin@example.com',
            'password' => 'password',
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
        $ownPositionId = $this->insertPosition('COORDINADOR', $this->ownAreaId);
        $otherPositionId = $this->insertPosition('ASISTENTE', $this->otherAreaId);

        Schema::getConnection()->table('personas')->insert([
            'id' => $adminPersonaId,
            'nombres' => 'ADMINISTRADOR',
            'apellidos' => 'SEMBRIA',
            'correo' => 'admin@example.com',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $this->user->id,
            'persona_id' => $adminPersonaId,
            'activo' => true,
            'must_change_password' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $adminMemberId = $this->insertMember($adminPersonaId, $ownPositionId, 'ADMINISTRADOR', 'SEMBRIA');

        $this->ownTargetId = $this->insertTarget('ANA', 'TORRES', $ownPositionId);
        Schema::getConnection()->table('integrantes')->where('id', $this->ownTargetId)->update([
            'avatar_path' => 'avatars/ana-torres.webp',
        ]);
        $this->otherTargetId = $this->insertTarget('LUIS', 'RAMOS', $otherPositionId);

        $this->assertGreaterThan(0, $adminMemberId);
    }

    private function insertPosition(string $name, int $areaId): int
    {
        return Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => $name,
            'area_id' => $areaId,
            'rol_id' => $this->roleId,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function insertTarget(string $firstNames, string $lastNames, int $positionId): int
    {
        return $this->insertMember((string) Str::uuid(), $positionId, $firstNames, $lastNames);
    }

    private function insertMember(
        string $personId,
        int $positionId,
        string $firstNames,
        string $lastNames,
    ): int {
        $now = now();

        if (! Schema::getConnection()->table('personas')->where('id', $personId)->exists()) {
            Schema::getConnection()->table('personas')->insert([
                'id' => $personId,
                'nombres' => $firstNames,
                'apellidos' => $lastNames,
                'correo' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $memberId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $memberId,
            'tipo_integrante' => 'voluntario',
            'cargo_id' => $positionId,
            'estado' => 'Activo',
            'fecha_inicio' => now()->toDateString(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $memberId;
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable();
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
            $table->unsignedBigInteger('user_id')->unique();
            $table->uuid('persona_id')->unique();
            $table->boolean('activo');
            $table->boolean('must_change_password');
            $table->timestamps();
        });
        Schema::create('integrantes', function (Blueprint $table): void {
            $table->id();
            $table->uuid('persona_id');
            $table->string('estado');
            $table->string('avatar_path')->nullable();
            $table->timestamps();
        });
        Schema::create('integrantes_historial', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('integrante_id');
            $table->string('tipo_integrante')->nullable();
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
