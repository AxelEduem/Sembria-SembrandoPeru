<?php

namespace Tests\Feature\Inicio;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InicioApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });

        Schema::create('integrantes', function (Blueprint $table): void {
            $table->id();
            $table->string('estado');
            $table->timestamps();
        });

        Schema::create('areas', function (Blueprint $table): void {
            $table->id();
            $table->boolean('activo');
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable();
            $table->integer('last_activity')->index();
        });
    }

    public function test_authenticated_user_can_get_inicio_summary_from_backend(): void
    {
        $user = User::query()->create([
            'name' => 'Usuario activo',
            'email' => 'activo@example.com',
            'password' => Hash::make('password'),
        ]);
        $otherUser = User::query()->create([
            'name' => 'Otro usuario',
            'email' => 'otro@example.com',
            'password' => Hash::make('password'),
        ]);

        Schema::getConnection()->table('integrantes')->insert([
            ['estado' => 'Activo'],
            ['estado' => 'Activo'],
            ['estado' => 'Inactivo'],
        ]);
        Schema::getConnection()->table('areas')->insert([
            ['activo' => true],
            ['activo' => false],
        ]);
        Schema::getConnection()->table('sessions')->insert([
            ['id' => 'active-1', 'user_id' => $user->id, 'last_activity' => now()->getTimestamp()],
            ['id' => 'active-2', 'user_id' => $user->id, 'last_activity' => now()->getTimestamp()],
            ['id' => 'active-3', 'user_id' => $otherUser->id, 'last_activity' => now()->getTimestamp()],
            [
                'id' => 'expired',
                'user_id' => $otherUser->id,
                'last_activity' => now()->subMinutes(config('session.lifetime') + 1)->getTimestamp(),
            ],
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/inicio')
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'integrantes_activos' => 2,
                    'areas_activas' => 1,
                    'usuarios_conectados' => 2,
                ],
            ]);
    }

    public function test_inicio_summary_requires_authentication(): void
    {
        $this->getJson('/api/inicio')->assertUnauthorized();
    }
}
