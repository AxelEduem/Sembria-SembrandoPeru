<?php

namespace Tests\Feature\Tareas;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TareaApiTest extends TestCase
{
    private User $creator;

    private User $assignee;

    private User $outsider;

    private string $creatorAccountId;

    private string $assigneeAccountId;

    private string $outsiderAccountId;

    private string $otherAreaAccountId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedDirectory();
        Sanctum::actingAs($this->creator);
    }

    public function test_active_member_can_list_same_area_directory_and_assign_a_task(): void
    {
        $this->getJson('/api/tareas/integrantes')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.area', 'TECNOLOGÍA')
            ->assertJsonMissing(['nombre' => 'ANA CREADORA'])
            ->assertJsonMissing(['nombre' => 'DIEGO OTRA AREA']);

        $response = $this->postJson('/api/tareas', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.titulo', 'PREPARAR REPORTE')
            ->assertJsonPath('data.estado', 'pendiente')
            ->assertJsonPath('data.soy_creador', true)
            ->assertJsonPath('data.soy_responsable', false)
            ->assertJsonPath('data.responsable.nombre', 'BRUNO RESPONSABLE');

        $taskId = $response->json('data.id');
        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->assignee->id,
            'tipo' => 'tarea_asignada',
            'clave' => "institucional-{$this->assignee->id}-tarea-{$taskId}-asignada-{$this->assigneeAccountId}",
        ]);
        Sanctum::actingAs($this->assignee);

        $this->getJson('/api/tareas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $taskId)
            ->assertJsonPath('data.0.soy_responsable', true);
    }

    public function test_tasks_are_private_to_creator_and_assignee(): void
    {
        $taskId = $this->postJson('/api/tareas', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->outsider);
        $this->getJson('/api/tareas')->assertOk()->assertJsonCount(0, 'data');
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'completada'])
            ->assertForbidden();
        $this->postJson("/api/tareas/{$taskId}/notas", ['contenido' => 'Nota ajena'])
            ->assertForbidden();
    }

    public function test_task_can_be_assigned_to_multiple_members(): void
    {
        $payload = $this->validPayload();
        unset($payload['asignada_a']);
        $payload['asignadas_a'] = [
            $this->assigneeAccountId,
            $this->outsiderAccountId,
        ];

        $response = $this->postJson('/api/tareas', $payload)
            ->assertCreated()
            ->assertJsonCount(2, 'data.responsables')
            ->assertJsonPath('data.responsables.0.nombre', 'BRUNO RESPONSABLE')
            ->assertJsonPath('data.responsables.1.nombre', 'CARLA TERCERA');

        $taskId = $response->json('data.id');
        $this->assertDatabaseCount('tarea_responsables', 2);
        $this->assertDatabaseHas('tarea_responsables', [
            'tarea_id' => $taskId,
            'cuenta_id' => $this->assigneeAccountId,
        ]);
        $this->assertDatabaseHas('tarea_responsables', [
            'tarea_id' => $taskId,
            'cuenta_id' => $this->outsiderAccountId,
        ]);
        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->outsider->id,
            'tipo' => 'tarea_asignada',
            'clave' => "institucional-{$this->outsider->id}-tarea-{$taskId}-asignada-{$this->outsiderAccountId}",
        ]);

        Sanctum::actingAs($this->outsider);
        $this->getJson('/api/tareas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.soy_responsable', true);
    }

    public function test_task_cannot_be_assigned_to_member_from_another_area(): void
    {
        $payload = $this->validPayload();
        $payload['asignada_a'] = $this->otherAreaAccountId;

        $this->postJson('/api/tareas', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('asignadas_a')
            ->assertJsonPath(
                'errors.asignadas_a.0',
                'Selecciona integrantes activos de tu misma área con acceso institucional.',
            );
    }

    public function test_task_cannot_be_assigned_to_the_authenticated_member(): void
    {
        $taskId = $this->postJson('/api/tareas', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        $payload = $this->validPayload();
        $payload['asignada_a'] = $this->creatorAccountId;

        $this->postJson('/api/tareas', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('asignadas_a');

        $this->putJson("/api/tareas/{$taskId}", $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('asignadas_a');
    }

    public function test_assignee_can_progress_complete_and_comment_the_task(): void
    {
        $taskId = $this->postJson('/api/tareas', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->assignee);
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'en_progreso'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'en_progreso');

        $this->postJson("/api/tareas/{$taskId}/notas", ['contenido' => 'Avancé con el primer borrador.'])
            ->assertOk()
            ->assertJsonPath('data.notas.0.contenido', 'Avancé con el primer borrador.')
            ->assertJsonPath('data.notas.0.es_mia', true);

        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'completada'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'completada')
            ->assertJsonPath('data.completada_at', fn ($value) => is_string($value));
    }

    public function test_only_creator_can_edit_or_cancel_a_task(): void
    {
        $taskId = $this->postJson('/api/tareas', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->assignee);
        $this->putJson("/api/tareas/{$taskId}", $this->validPayload())
            ->assertForbidden();
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'cancelada'])
            ->assertForbidden();

        Sanctum::actingAs($this->creator);
        $payload = $this->validPayload();
        $payload['titulo'] = 'REPORTE ACTUALIZADO';
        $this->putJson("/api/tareas/{$taskId}", $payload)
            ->assertOk()
            ->assertJsonPath('data.titulo', 'REPORTE ACTUALIZADO');
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'cancelada'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'cancelada');
    }

    public function test_in_progress_task_cannot_be_edited_and_completed_task_cannot_be_reopened(): void
    {
        $taskId = $this->postJson('/api/tareas', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->assignee);
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'en_progreso'])
            ->assertOk();

        Sanctum::actingAs($this->creator);
        $payload = $this->validPayload();
        $payload['titulo'] = 'CAMBIO NO PERMITIDO';
        $this->putJson("/api/tareas/{$taskId}", $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('estado');

        Sanctum::actingAs($this->assignee);
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'completada'])
            ->assertOk();
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'pendiente'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('estado');
        $this->patchJson("/api/tareas/{$taskId}/estado", ['estado' => 'en_progreso'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('estado');

        $this->assertDatabaseHas('tareas', [
            'id' => $taskId,
            'titulo' => 'PREPARAR REPORTE',
            'estado' => 'completada',
        ]);
    }

    private function validPayload(): array
    {
        return [
            'titulo' => 'PREPARAR REPORTE',
            'descripcion' => 'Consolidar los avances del mes.',
            'asignada_a' => $this->assigneeAccountId,
            'prioridad' => 'alta',
            'fecha_limite' => now()->addWeek()->toDateString(),
        ];
    }

    private function seedDirectory(): void
    {
        $now = now();
        $areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'TECNOLOGÍA', 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'INTEGRANTE', 'area_id' => $areaId, 'activo' => true,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        [$this->creator, $this->creatorAccountId] = $this->createMember('ana@example.com', 'ANA', 'CREADORA', $cargoId);
        [$this->assignee, $this->assigneeAccountId] = $this->createMember('bruno@example.com', 'BRUNO', 'RESPONSABLE', $cargoId);
        [$this->outsider, $this->outsiderAccountId] = $this->createMember('carla@example.com', 'CARLA', 'TERCERA', $cargoId);

        $otherAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'GESTIÓN DE PROYECTOS', 'activo' => true,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $otherCargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'INTEGRANTE', 'area_id' => $otherAreaId, 'activo' => true,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        [, $this->otherAreaAccountId] = $this->createMember(
            'diego@example.com',
            'DIEGO',
            'OTRA AREA',
            $otherCargoId,
        );
    }

    private function createMember(string $email, string $firstName, string $lastName, int $cargoId): array
    {
        $now = now();
        $personId = (string) Str::uuid();
        $accountId = (string) Str::uuid();
        $user = User::query()->create([
            'name' => $firstName,
            'email' => $email,
            'password' => Hash::make('password'),
        ]);
        Schema::getConnection()->table('personas')->insert([
            'id' => $personId, 'nombres' => $firstName, 'apellidos' => $lastName,
            'correo' => $email, 'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => $accountId, 'user_id' => $user->id, 'persona_id' => $personId,
            'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $memberId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personId, 'estado' => 'Activo', 'avatar_path' => null,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $memberId, 'cargo_id' => $cargoId, 'estado' => 'Activo',
            'created_at' => $now, 'updated_at' => $now,
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
        Schema::create('personas', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('correo')->nullable();
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
            $table->timestamps();
        });
        Schema::create('tareas', function (Blueprint $table): void {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->uuid('asignada_por');
            $table->uuid('asignada_a');
            $table->string('prioridad');
            $table->string('estado');
            $table->date('fecha_limite')->nullable();
            $table->timestamp('completada_at')->nullable();
            $table->timestamps();
        });
        Schema::create('tarea_notas', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tarea_id');
            $table->uuid('autor_id');
            $table->text('contenido');
            $table->timestamps();
        });
        Schema::create('tarea_responsables', function (Blueprint $table): void {
            $table->unsignedBigInteger('tarea_id');
            $table->uuid('cuenta_id');
            $table->timestamps();
            $table->primary(['tarea_id', 'cuenta_id']);
        });
        Schema::create('notificaciones_asistencia', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('asistencia_id')->nullable();
            $table->string('tipo', 50);
            $table->string('titulo');
            $table->text('mensaje');
            $table->string('clave')->unique();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();
        });
    }
}
