<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChangeTemporaryPasswordTest extends TestCase
{
    private User $user;

    private string $personId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createTables();

        $this->personId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Usuario temporal',
            'email' => 'temporal@example.com',
            'password' => 'Temporal-2026',
        ]);

        $now = now();

        Schema::getConnection()->table('personas')->insert([
            'id' => $this->personId,
            'nombres' => 'Usuario',
            'apellidos' => 'Temporal',
            'password_temporal_expira_en' => $now->copy()->addDay(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $this->user->id,
            'persona_id' => $this->personId,
            'activo' => true,
            'must_change_password' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function test_authenticated_user_can_complete_temporary_password_change(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/profile/password', [
            'password' => 'Nueva-Clave-2026',
            'password_confirmation' => 'Nueva-Clave-2026',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue(Hash::check('Nueva-Clave-2026', $this->user->fresh()->password));
        $this->assertDatabaseHas('cuentas_acceso', [
            'user_id' => $this->user->id,
            'must_change_password' => false,
        ]);
        $this->assertDatabaseHas('personas', [
            'id' => $this->personId,
            'password_temporal_expira_en' => null,
        ]);
    }

    public function test_password_confirmation_is_required(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/profile/password', [
            'password' => 'Nueva-Clave-2026',
            'password_confirmation' => 'Otra-Clave-2026',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_temporary_password_cannot_be_reused(): void
    {
        Sanctum::actingAs($this->user);

        $this->postJson('/api/profile/password', [
            'password' => 'Temporal-2026',
            'password_confirmation' => 'Temporal-2026',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->assertDatabaseHas('cuentas_acceso', [
            'user_id' => $this->user->id,
            'must_change_password' => true,
        ]);
    }

    public function test_expired_temporary_password_cannot_be_changed(): void
    {
        Schema::getConnection()->table('personas')
            ->where('id', $this->personId)
            ->update(['password_temporal_expira_en' => now()->subMinute()]);

        Sanctum::actingAs($this->user);

        $this->postJson('/api/profile/password', [
            'password' => 'Nueva-Clave-2026',
            'password_confirmation' => 'Nueva-Clave-2026',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->assertTrue(Hash::check('Temporal-2026', $this->user->fresh()->password));
    }

    public function test_unauthenticated_user_cannot_change_password(): void
    {
        $this->postJson('/api/profile/password', [
            'password' => 'Nueva-Clave-2026',
            'password_confirmation' => 'Nueva-Clave-2026',
        ])->assertUnauthorized();
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
            $table->timestamp('password_temporal_expira_en')->nullable();
            $table->timestamps();
        });

        Schema::create('cuentas_acceso', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique();
            $table->uuid('persona_id')->unique();
            $table->boolean('activo');
            $table->boolean('must_change_password');
            $table->timestamps();
        });
    }
}
