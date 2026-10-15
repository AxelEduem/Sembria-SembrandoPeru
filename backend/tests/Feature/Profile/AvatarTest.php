<?php

namespace Tests\Feature\Profile;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AvatarTest extends TestCase
{
    private User $user;

    private string $personaId;

    protected function setUp(): void
    {
        parent::setUp();

        config(['filesystems.avatar_disk' => 'avatar_test']);
        Storage::fake('avatar_test');
        $this->createTables();

        $this->personaId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Usuario de prueba',
            'email' => 'avatar@example.com',
            'password' => Hash::make('password'),
        ]);

        $now = now();

        Schema::getConnection()->table('personas')->insert([
            'id' => $this->personaId,
            'nombres' => 'Usuario',
            'apellidos' => 'Prueba',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $this->user->id,
            'persona_id' => $this->personaId,
            'activo' => true,
            'must_change_password' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::getConnection()->table('integrantes')->insert([
            'persona_id' => $this->personaId,
            'estado' => 'Activo',
            'avatar_path' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_authenticated_user_can_store_avatar_on_active_integrante(): void
    {
        $response = $this->post('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg'),
        ], ['Accept' => 'application/json']);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['avatar_path', 'avatar_url']]);

        $path = $response->json('data.avatar_path');

        $this->assertStringStartsWith("avatars/{$this->personaId}/", $path);
        $this->assertDatabaseHas('integrantes', [
            'persona_id' => $this->personaId,
            'avatar_path' => $path,
        ]);
        Storage::disk('avatar_test')->assertExists($path);
    }

    public function test_authenticated_user_can_update_own_names(): void
    {
        $this->patchJson('/api/profile', [
            'nombres' => 'María Fernanda',
            'apellidos' => 'Torres Ruiz',
        ])
            ->assertOk()
            ->assertJsonPath('data.nombres', 'María Fernanda')
            ->assertJsonPath('data.apellidos', 'Torres Ruiz');

        $this->assertDatabaseHas('personas', [
            'id' => $this->personaId,
            'nombres' => 'María Fernanda',
            'apellidos' => 'Torres Ruiz',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'name' => 'María Fernanda Torres Ruiz',
        ]);
    }

    public function test_profile_names_are_validated_by_laravel(): void
    {
        $this->patchJson('/api/profile', [
            'nombres' => 'Usuario 123',
            'apellidos' => '',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nombres', 'apellidos']);
    }

    public function test_replacing_avatar_removes_previous_laravel_file(): void
    {
        $oldPath = "avatars/{$this->personaId}/old.jpg";
        Storage::disk('avatar_test')->put($oldPath, 'old image');
        Schema::getConnection()->table('integrantes')
            ->where('persona_id', $this->personaId)
            ->update(['avatar_path' => $oldPath]);

        $response = $this->post('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('new.png', 100, 'image/png'),
        ], ['Accept' => 'application/json']);

        $response->assertOk();
        Storage::disk('avatar_test')->assertMissing($oldPath);
        Storage::disk('avatar_test')->assertExists($response->json('data.avatar_path'));
    }

    public function test_avatar_validation_rejects_invalid_file_type(): void
    {
        $this->post('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');
    }

    public function test_authenticated_user_can_delete_managed_avatar(): void
    {
        $path = "avatars/{$this->personaId}/current.jpg";
        Storage::disk('avatar_test')->put($path, 'current image');
        Schema::getConnection()->table('integrantes')
            ->where('persona_id', $this->personaId)
            ->update(['avatar_path' => $path]);

        $this->deleteJson('/api/profile/avatar')
            ->assertOk()
            ->assertJsonPath('data.avatar_path', null);

        $this->assertDatabaseHas('integrantes', [
            'persona_id' => $this->personaId,
            'avatar_path' => null,
        ]);
        Storage::disk('avatar_test')->assertMissing($path);
    }

    private function createTables(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
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

        Schema::create('cuentas_acceso', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id');
            $table->uuid('persona_id');
            $table->boolean('activo');
            $table->boolean('must_change_password');
            $table->timestamps();
        });

        Schema::create('integrantes', function (Blueprint $table): void {
            $table->id();
            $table->uuid('persona_id');
            $table->string('estado');
            $table->text('avatar_path')->nullable();
            $table->timestamps();
        });
    }
}
