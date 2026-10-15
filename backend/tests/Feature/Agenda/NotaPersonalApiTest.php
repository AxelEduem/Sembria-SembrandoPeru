<?php

namespace Tests\Feature\Agenda;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotaPersonalApiTest extends TestCase
{
    private User $owner;

    private User $otherUser;

    private string $ownerAccountId;

    private string $otherAccountId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        [$this->owner, $this->ownerAccountId] = $this->createAccount('owner@example.com');
        [$this->otherUser, $this->otherAccountId] = $this->createAccount('other@example.com');
        Sanctum::actingAs($this->owner);
    }

    public function test_user_can_manage_only_their_personal_notes(): void
    {
        Schema::getConnection()->table('notas_personales')->insert([
            'cuenta_id' => $this->otherAccountId,
            'titulo' => 'NOTA AJENA',
            'contenido' => null,
            'color' => 'azul',
            'fijada' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $created = $this->postJson('/api/agenda/notas', [
            'titulo' => 'MI RECORDATORIO',
            'contenido' => 'Revisar el avance del equipo.',
            'color' => 'verde',
            'fijada' => true,
        ])->assertCreated()
            ->assertJsonPath('data.titulo', 'MI RECORDATORIO')
            ->assertJsonPath('data.fijada', true);

        $noteId = $created->json('data.id');

        $this->getJson('/api/agenda/notas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $noteId)
            ->assertJsonMissing(['titulo' => 'NOTA AJENA']);

        $this->putJson("/api/agenda/notas/{$noteId}", [
            'titulo' => 'RECORDATORIO ACTUALIZADO',
            'contenido' => 'Revisar y enviar el avance.',
            'color' => 'violeta',
            'fijada' => false,
        ])->assertOk()
            ->assertJsonPath('data.titulo', 'RECORDATORIO ACTUALIZADO');

        $this->deleteJson("/api/agenda/notas/{$noteId}")->assertNoContent();
        $this->assertDatabaseMissing('notas_personales', ['id' => $noteId]);
    }

    public function test_user_cannot_update_or_delete_another_users_note(): void
    {
        $noteId = Schema::getConnection()->table('notas_personales')->insertGetId([
            'cuenta_id' => $this->otherAccountId,
            'titulo' => 'PRIVADA',
            'contenido' => 'Contenido privado.',
            'color' => 'amarillo',
            'fijada' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $payload = [
            'titulo' => 'INTENTO',
            'contenido' => null,
            'color' => 'rosa',
            'fijada' => false,
        ];

        $this->putJson("/api/agenda/notas/{$noteId}", $payload)->assertForbidden();
        $this->deleteJson("/api/agenda/notas/{$noteId}")->assertForbidden();
    }

    private function createAccount(string $email): array
    {
        $user = User::query()->create([
            'name' => $email,
            'email' => $email,
            'password' => Hash::make('password'),
        ]);
        $accountId = (string) Str::uuid();
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => $accountId,
            'user_id' => $user->id,
            'persona_id' => (string) Str::uuid(),
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$user, $accountId];
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
        Schema::create('cuentas_acceso', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->uuid('persona_id');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('notas_personales', function (Blueprint $table): void {
            $table->id();
            $table->uuid('cuenta_id');
            $table->string('titulo');
            $table->text('contenido')->nullable();
            $table->string('color');
            $table->boolean('fijada');
            $table->timestamps();
        });
    }
}
