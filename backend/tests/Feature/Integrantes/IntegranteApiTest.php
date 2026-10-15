<?php

namespace Tests\Feature\Integrantes;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IntegranteApiTest extends TestCase
{
    private User $user;

    private int $cargoId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedIdentity();
        Sanctum::actingAs($this->user);
    }

    public function test_it_lists_and_creates_integrantes_with_normalized_resource(): void
    {
        $this->getJson('/api/integrantes?inactive=0')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'ADMINISTRADOR SEMBRIA');

        $this->getJson('/api/integrantes/catalogs')
            ->assertOk()
            ->assertJsonCount(1, 'data.areas')
            ->assertJsonCount(1, 'data.cargos');

        $response = $this->postJson('/api/integrantes', $this->validPayload());

        $response
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'NUEVO INTEGRANTE')
            ->assertJsonPath('data.tipo_integrante', 'voluntario');

        $this->assertDatabaseHas('integrantes', ['documento_identidad' => '87654321', 'estado' => 'Activo']);
        $this->assertDatabaseHas('integrantes_historial', ['tipo_integrante' => 'voluntario', 'cargo_id' => $this->cargoId]);
    }

    public function test_list_filters_and_paginates_in_database_and_exports_separately(): void
    {
        $this->postJson('/api/integrantes', $this->validPayload())->assertCreated();

        $filters = http_build_query([
            'q' => 'nuevo integrante',
            'area' => Schema::getConnection()->table('cargos')->where('id', $this->cargoId)->value('area_id'),
            'cargo' => $this->cargoId,
            'tipo' => 'voluntario',
            'periodo' => 6,
            'estado' => 'activo',
            'fecha' => now()->toDateString(),
            'pagina' => 1,
            'por_pagina' => 1,
        ]);

        $this->getJson("/api/integrantes?{$filters}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'NUEVO INTEGRANTE')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/integrantes?pagina=2&por_pagina=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.total', 2);

        $this->getJson('/api/integrantes/exportar?tipo=voluntario&estado=activo')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonMissingPath('meta.current_page');
    }

    public function test_paginated_list_applies_area_scope_before_counting_results(): void
    {
        $connection = Schema::getConnection();
        $now = now();
        $roleId = $connection->table('roles')->value('id');
        $otherAreaId = $connection->table('areas')->insertGetId([
            'nombre' => 'Operaciones',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $otherPositionId = $connection->table('cargos')->insertGetId([
            'nombre' => 'Analista',
            'area_id' => $otherAreaId,
            'rol_id' => $roleId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $otherPersonId = (string) Str::uuid();
        $connection->table('personas')->insert([
            'id' => $otherPersonId,
            'nombres' => 'INTEGRANTE',
            'apellidos' => 'EXTERNO',
            'correo' => 'externo@example.com',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $otherMemberId = $connection->table('integrantes')->insertGetId([
            'persona_id' => $otherPersonId,
            'estado' => 'Activo',
            'accesos_pendientes_revision' => false,
            'accesos_retirados' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $connection->table('integrantes_historial')->insert([
            'integrante_id' => $otherMemberId,
            'tipo_integrante' => 'voluntario',
            'cargo_id' => $otherPositionId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);
        $this->grantPermission($roleId, 'integrantes.ver', 'area');

        $this->getJson('/api/integrantes?por_pagina=10')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissing(['nombre' => 'INTEGRANTE EXTERNO']);

        $this->getJson("/api/integrantes?area={$otherAreaId}&por_pagina=10")
            ->assertOk()
            ->assertJsonPath('meta.total', 0);

        $this->getJson('/api/integrantes/exportar')->assertForbidden();
    }

    public function test_expired_integrantes_are_processed_idempotently_by_the_command(): void
    {
        $connection = Schema::getConnection();
        $historyId = $connection->table('integrantes_historial')->value('id');
        $integranteId = $connection->table('integrantes')->value('id');
        $applicationId = $connection->table('aplicaciones')->insertGetId([
            'nombre' => 'Correo institucional',
            'licencias_total' => 10,
            'activo' => true,
            'area_id' => $connection->table('areas')->value('id'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $connection->table('integrantes_historial')->where('id', $historyId)->update([
            'fecha_fin' => '2026-01-01',
        ]);
        $connection->table('integrante_aplicaciones')->insert([
            'aplicacion_id' => $applicationId,
            'historial_id' => $historyId,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('integrantes:procesar-vencimientos', ['fecha' => '2026-01-02'])
            ->expectsOutput('Vencimientos de integrantes procesados: 1')
            ->assertSuccessful();

        $this->assertDatabaseHas('integrantes', [
            'id' => $integranteId,
            'estado' => 'Inactivo',
            'accesos_pendientes_revision' => true,
        ]);
        $this->assertDatabaseHas('integrantes_historial', [
            'id' => $historyId,
            'estado' => 'Inactivo',
            'tipo_desactivacion' => 'automatica',
            'desactivado_por' => null,
        ]);

        $this->artisan('integrantes:procesar-vencimientos', ['fecha' => '2026-01-02'])
            ->expectsOutput('Vencimientos de integrantes procesados: 0')
            ->assertSuccessful();
    }

    public function test_an_expired_old_period_does_not_deactivate_a_current_period(): void
    {
        $connection = Schema::getConnection();
        $integranteId = $connection->table('integrantes')->value('id');
        $oldHistoryId = $connection->table('integrantes_historial')->value('id');

        $connection->table('integrantes_historial')->where('id', $oldHistoryId)->update([
            'fecha_fin' => '2026-01-01',
        ]);
        $currentHistoryId = $connection->table('integrantes_historial')->insertGetId([
            'integrante_id' => $integranteId,
            'tipo_integrante' => 'voluntario',
            'cargo_id' => $this->cargoId,
            'fecha_inicio' => '2026-01-02',
            'fecha_fin' => '2026-12-31',
            'periodo_meses' => 12,
            'estado' => 'Activo',
            'modalidad' => 'presencial',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('integrantes:procesar-vencimientos', ['fecha' => '2026-01-02'])
            ->expectsOutput('Vencimientos de integrantes procesados: 1')
            ->assertSuccessful();

        $this->assertDatabaseHas('integrantes', ['id' => $integranteId, 'estado' => 'Activo']);
        $this->assertDatabaseHas('integrantes_historial', ['id' => $oldHistoryId, 'estado' => 'Inactivo']);
        $this->assertDatabaseHas('integrantes_historial', ['id' => $currentHistoryId, 'estado' => 'Activo']);
    }

    public function test_birthday_list_respects_global_and_area_permission_scopes(): void
    {
        $connection = Schema::getConnection();
        $now = now();
        $roleId = $connection->table('roles')->value('id');
        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);

        $this->getJson('/api/cumpleanos')->assertForbidden();
        $this->grantPermission($roleId, 'cumpleanos.ver', 'global');

        $otherAreaId = $connection->table('areas')->insertGetId([
            'nombre' => 'Operaciones', 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $otherCargoId = $connection->table('cargos')->insertGetId([
            'nombre' => 'Analista', 'area_id' => $otherAreaId, 'rol_id' => $roleId,
            'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $otherUser = User::query()->create([
            'name' => 'Integrante externo',
            'email' => 'externo@example.com',
            'password' => Hash::make('password'),
        ]);
        $otherPersonId = (string) Str::uuid();
        $connection->table('personas')->insert([
            'id' => $otherPersonId, 'nombres' => 'INTEGRANTE', 'apellidos' => 'EXTERNO',
            'correo' => 'externo@example.com', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $connection->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(), 'user_id' => $otherUser->id, 'persona_id' => $otherPersonId,
            'activo' => true, 'must_change_password' => false, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $otherMemberId = $connection->table('integrantes')->insertGetId([
            'persona_id' => $otherPersonId, 'estado' => 'Activo', 'fecha_nacimiento' => '1998-05-20',
            'accesos_pendientes_revision' => false, 'accesos_retirados' => false,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $connection->table('integrantes_historial')->insert([
            'integrante_id' => $otherMemberId, 'tipo_integrante' => 'voluntario',
            'cargo_id' => $otherCargoId, 'estado' => 'Activo',
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $this->getJson('/api/cumpleanos')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['area' => 'Operaciones']);

        $permissionId = $connection->table('permisos')->where('codigo', 'cumpleanos.ver')->value('id');
        $connection->table('rol_permisos')->where('permiso_id', $permissionId)->update(['alcance' => 'area']);

        $this->getJson('/api/cumpleanos')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonMissing(['area' => 'Operaciones']);
    }

    public function test_it_replaces_schedule_transactionally(): void
    {
        $historyId = Schema::getConnection()->table('integrantes_historial')->value('id');
        $blocks = collect(range(1, 5))->map(fn (int $day) => [
            'dia_semana' => $day, 'hora_inicio' => '08:00', 'hora_fin' => '10:00',
        ])->all();

        $this->putJson("/api/integrante-histories/{$historyId}/schedules", ['blocks' => $blocks])
            ->assertOk()
            ->assertJsonCount(5, 'data');

        $this->assertDatabaseCount('integrante_horarios', 5);
    }

    public function test_it_returns_completed_attendance_hours_for_an_authorized_integrante(): void
    {
        $integranteId = Schema::getConnection()->table('integrantes')->value('id');
        Schema::getConnection()->table('asistencias')->insert([
            [
                'integrante_id' => $integranteId,
                'minutos_realizados' => 90,
                'estado' => 'completada',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'integrante_id' => $integranteId,
                'minutos_realizados' => 30,
                'estado' => 'justificada',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'integrante_id' => $integranteId,
                'minutos_realizados' => 60,
                'estado' => 'pendiente',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->getJson("/api/integrantes/{$integranteId}/attendance-hours")
            ->assertOk()
            ->assertJsonPath('data.hours', 2);
    }

    public function test_it_returns_own_attendance_hours_without_integrante_permissions(): void
    {
        $connection = Schema::getConnection();
        $integranteId = $connection->table('integrantes')->value('id');
        $roleId = $connection->table('roles')->value('id');

        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);
        $connection->table('asistencias')->insert([
            'integrante_id' => $integranteId,
            'minutos_realizados' => 150,
            'estado' => 'completada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/integrantes/me/attendance-hours')
            ->assertOk()
            ->assertJsonPath('data.hours', 2.5);
    }

    public function test_it_creates_lists_and_approves_own_schedule_change_request(): void
    {
        $connection = Schema::getConnection();
        $roleId = $connection->table('roles')->value('id');
        $connection->table('integrantes')->update([
            'avatar_path' => 'avatars/administrador.webp',
        ]);
        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);
        $historyId = $connection->table('integrantes_historial')->value('id');
        $cargoId = $connection->table('integrantes_historial')->where('id', $historyId)->value('cargo_id');
        $areaId = $connection->table('cargos')->where('id', $cargoId)->value('area_id');
        $effectiveDate = now()->addWeek()->toDateString();
        $connection->table('integrantes_historial')->where('id', $historyId)->update([
            'fecha_inicio' => now()->subMonth()->toDateString(),
            'fecha_fin' => now()->addMonths(6)->toDateString(),
        ]);
        $blocks = collect(range(1, 5))->map(fn (int $day) => [
            'dia_semana' => $day, 'hora_inicio' => '08:00', 'hora_fin' => '10:00',
        ])->all();

        $created = $this->postJson('/api/schedule-change-requests', [
            'fecha_efectiva' => $effectiveDate,
            'motivo' => 'Cambio de disponibilidad',
            'blocks' => $blocks,
        ])->assertCreated()
            ->assertJsonPath('data.estado', 'PENDIENTE')
            ->assertJsonPath('data.fecha_efectiva', $effectiveDate)
            ->assertJsonCount(5, 'data.detalle');

        $requestId = $created->json('data.id');

        $this->postJson('/api/schedule-change-requests', [
            'fecha_efectiva' => now()->addWeeks(2)->toDateString(),
            'blocks' => $blocks,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('estado');

        $this->getJson('/api/schedule-change-requests/mine?estado=PENDIENTE')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('has_pending', true)
            ->assertJsonPath('creation_eligibility.can_create', false)
            ->assertJsonPath('creation_eligibility.reason', 'pending')
            ->assertJsonPath('creation_eligibility.available_from', null)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('data.0.integrante.nombre', 'ADMINISTRADOR SEMBRIA');

        $this->grantPermission($roleId, 'solicitudes_horario.ver');
        $this->grantPermission($roleId, 'integrantes.editar');

        $this->getJson('/api/schedule-change-requests?estado=PENDIENTE')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante.avatar_path', 'avatars/administrador.webp')
            ->assertJsonPath(
                'data.0.integrante.avatar_url',
                fn ($url) => is_string($url) && str_contains($url, 'avatars/administrador.webp'),
            )
            ->assertJsonPath('data.0.historial_anterior.cargo_id', $cargoId)
            ->assertJsonPath('data.0.historial_anterior.area_id', $areaId)
            ->assertJsonPath('data.0.historial_anterior.area', 'Administración');

        $this->patchJson("/api/schedule-change-requests/{$requestId}/resolve", [
            'accion' => 'APROBADA',
        ])->assertOk()
            ->assertJsonPath('data.estado', 'APROBADA');

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->user->id,
            'tipo' => 'cambio_horario_aprobado',
            'titulo' => 'Cambio de horario aprobado',
            'clave' => "cambio-horario:{$requestId}:APROBADA",
        ]);

        $this->assertDatabaseHas('integrantes_historial', [
            'id' => $historyId,
            'fecha_fin' => now()->addWeek()->subDay()->toDateString(),
        ]);
        $this->assertDatabaseHas('integrantes_historial', [
            'fecha_inicio' => $effectiveDate,
            'estado' => 'Activo',
        ]);
        $newHistoryId = $connection->table('solicitudes_cambio_horario')
            ->where('id', $requestId)
            ->value('historial_nuevo_id');
        $this->assertSame(5, $connection->table('integrante_horarios')
            ->where('historial_id', $newHistoryId)
            ->count());

        $this->getJson('/api/schedule-change-requests/mine?por_pagina=1')
            ->assertOk()
            ->assertJsonPath('has_pending', false)
            ->assertJsonPath('creation_eligibility.can_create', false)
            ->assertJsonPath('creation_eligibility.reason', 'cooldown')
            ->assertJsonPath(
                'creation_eligibility.available_from',
                now()->addWeek()->addDays(15)->toDateString(),
            );

        $this->postJson('/api/schedule-change-requests', [
            'fecha_efectiva' => now()->addWeeks(3)->toDateString(),
            'blocks' => $blocks,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('estado');

        $connection->table('solicitudes_cambio_horario')
            ->where('id', $requestId)
            ->update(['fecha_efectiva' => now()->subDays(15)->toDateString()]);

        $this->getJson('/api/schedule-change-requests/mine?por_pagina=1')
            ->assertOk()
            ->assertJsonPath('creation_eligibility.can_create', true)
            ->assertJsonPath('creation_eligibility.reason', null)
            ->assertJsonPath('creation_eligibility.available_from', null);

        $this->postJson('/api/schedule-change-requests', [
            'fecha_efectiva' => now()->addWeeks(3)->toDateString(),
            'blocks' => $blocks,
        ])->assertCreated();
    }

    public function test_it_filters_and_paginates_own_schedule_change_history_from_query_parameters(): void
    {
        $connection = Schema::getConnection();
        $historyId = $connection->table('integrantes_historial')->value('id');
        $integranteId = $connection->table('integrantes')->value('id');
        $accountId = $connection->table('cuentas_acceso')->value('id');

        foreach (range(1, 3) as $index) {
            $connection->table('solicitudes_cambio_horario')->insert([
                'integrante_id' => $integranteId,
                'historial_anterior_id' => $historyId,
                'estado' => 'RECHAZADA',
                'fecha_solicitud' => now()->subDays($index),
                'fecha_efectiva' => now()->addDays($index)->toDateString(),
                'motivo' => "Cambio remoto {$index}",
                'observacion_resolucion' => "Resolución {$index}",
                'created_by' => $accountId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->getJson('/api/schedule-change-requests/mine?q=CAMBIO%20REMOTO&estado=RECHAZADA&periodo=30&por_pagina=2&pagina=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('has_pending', false)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_it_requires_a_reason_to_reject_a_schedule_change_request(): void
    {
        $connection = Schema::getConnection();
        $historyId = $connection->table('integrantes_historial')->value('id');
        $integranteId = $connection->table('integrantes')->value('id');
        $accountId = $connection->table('cuentas_acceso')->value('id');
        $requestId = $connection->table('solicitudes_cambio_horario')->insertGetId([
            'integrante_id' => $integranteId,
            'historial_anterior_id' => $historyId,
            'estado' => 'PENDIENTE',
            'fecha_solicitud' => now(),
            'fecha_efectiva' => now()->addWeek()->toDateString(),
            'created_by' => $accountId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->patchJson("/api/schedule-change-requests/{$requestId}/resolve", [
            'accion' => 'RECHAZADA',
            'observacion' => '   ',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('observacion');

        $this->patchJson("/api/schedule-change-requests/{$requestId}/resolve", [
            'accion' => 'RECHAZADA',
            'observacion' => 'No es compatible con la cobertura requerida.',
        ])->assertOk()
            ->assertJsonPath('data.estado', 'RECHAZADA')
            ->assertJsonPath(
                'data.observacion_resolucion',
                'No es compatible con la cobertura requerida.',
            );

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->user->id,
            'tipo' => 'cambio_horario_rechazado',
            'titulo' => 'Cambio de horario rechazado',
            'clave' => "cambio-horario:{$requestId}:RECHAZADA",
        ]);
    }

    public function test_it_requests_schedule_corrections_and_notifies_the_member(): void
    {
        $connection = Schema::getConnection();
        $historyId = $connection->table('integrantes_historial')->value('id');
        $integranteId = $connection->table('integrantes')->value('id');
        $accountId = $connection->table('cuentas_acceso')->value('id');
        $requestId = $connection->table('solicitudes_cambio_horario')->insertGetId([
            'integrante_id' => $integranteId,
            'historial_anterior_id' => $historyId,
            'estado' => 'PENDIENTE',
            'fecha_solicitud' => now(),
            'fecha_efectiva' => now()->addWeek()->toDateString(),
            'created_by' => $accountId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $historyCount = $connection->table('integrantes_historial')->count();

        $this->patchJson("/api/schedule-change-requests/{$requestId}/resolve", [
            'accion' => 'REQUIERE_CORRECCION',
            'observacion' => '   ',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('observacion');

        $this->patchJson("/api/schedule-change-requests/{$requestId}/resolve", [
            'accion' => 'REQUIERE_CORRECCION',
            'observacion' => 'Ajusta el bloque del viernes antes de volver a enviarla.',
        ])->assertOk()
            ->assertJsonPath('data.estado', 'REQUIERE_CORRECCION')
            ->assertJsonPath(
                'data.observacion_resolucion',
                'Ajusta el bloque del viernes antes de volver a enviarla.',
            );

        $this->assertSame($historyCount, $connection->table('integrantes_historial')->count());
        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->user->id,
            'tipo' => 'cambio_horario_correccion',
            'titulo' => 'Tu solicitud requiere correcciones',
            'clave' => "cambio-horario:{$requestId}:REQUIERE_CORRECCION",
        ]);

        $this->getJson('/api/schedule-change-requests/mine?estado=REQUIERE_CORRECCION')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('has_pending', false)
            ->assertJsonPath('creation_eligibility.can_create', true);
    }

    public function test_practitioner_schedule_must_cover_required_period_hours(): void
    {
        $historyId = Schema::getConnection()->table('integrantes_historial')->value('id');
        Schema::getConnection()->table('integrantes_historial')->where('id', $historyId)->update([
            'tipo_integrante' => 'practicante',
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-31',
            'horas_practicas_requeridas' => 60,
        ]);

        $insufficientBlocks = collect(range(1, 5))->map(fn (int $day) => [
            'dia_semana' => $day, 'hora_inicio' => '08:00', 'hora_fin' => '10:00',
        ])->all();

        $this->putJson("/api/integrante-histories/{$historyId}/schedules", [
            'blocks' => $insufficientBlocks,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('blocks')
            ->assertJsonPath(
                'errors.blocks.0',
                'El horario del periodo suma 44 horas, pero el practicante requiere como mínimo 60 horas.'
            );

        $this->assertDatabaseCount('integrante_horarios', 0);

        $sufficientBlocks = collect(range(1, 5))->map(fn (int $day) => [
            'dia_semana' => $day, 'hora_inicio' => '08:00', 'hora_fin' => '12:00',
        ])->all();

        $this->putJson("/api/integrante-histories/{$historyId}/schedules", [
            'blocks' => $sufficientBlocks,
        ])->assertOk()->assertJsonCount(5, 'data');

        $this->assertDatabaseCount('integrante_horarios', 5);
    }

    public function test_it_returns_complete_history_with_its_schedules(): void
    {
        $integranteId = Schema::getConnection()->table('integrantes')->value('id');
        $historyId = Schema::getConnection()->table('integrantes_historial')->value('id');
        Schema::getConnection()->table('integrante_horarios')->insert([
            'historial_id' => $historyId,
            'dia_semana' => 1,
            'hora_inicio' => '08:00',
            'hora_fin' => '12:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson("/api/integrantes/{$integranteId}/history")
            ->assertOk()
            ->assertJsonPath('data.historiales.0.id', $historyId)
            ->assertJsonPath('data.historiales.0.cargo', 'Coordinador')
            ->assertJsonPath('data.historiales.0.area', 'Administración')
            ->assertJsonPath('data.historiales.0.horarios.0.dia_semana', 1)
            ->assertJsonPath('data.historiales.0.horarios.0.hora_inicio', '08:00');
    }

    public function test_it_filters_and_paginates_own_schedule_history(): void
    {
        $connection = Schema::getConnection();
        $integranteId = $connection->table('integrantes')->value('id');

        foreach (range(1, 2) as $index) {
            $historyId = $connection->table('integrantes_historial')->insertGetId([
                'integrante_id' => $integranteId,
                'tipo_integrante' => 'voluntario',
                'cargo_id' => $this->cargoId,
                'fecha_inicio' => now()->subDays($index * 10)->toDateString(),
                'fecha_fin' => now()->addDays($index * 10)->toDateString(),
                'periodo_meses' => 1,
                'estado' => 'Activo',
                'modalidad' => 'remoto',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $connection->table('integrante_horarios')->insert([
                'historial_id' => $historyId,
                'dia_semana' => $index,
                'hora_inicio' => '08:00',
                'hora_fin' => '12:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $otherPersonId = (string) Str::uuid();
        $connection->table('personas')->insert([
            'id' => $otherPersonId,
            'nombres' => 'OTRA',
            'apellidos' => 'PERSONA',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $otherMemberId = $connection->table('integrantes')->insertGetId([
            'persona_id' => $otherPersonId,
            'estado' => 'Activo',
            'accesos_pendientes_revision' => false,
            'accesos_retirados' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $otherHistoryId = $connection->table('integrantes_historial')->insertGetId([
            'integrante_id' => $otherMemberId,
            'tipo_integrante' => 'voluntario',
            'cargo_id' => $this->cargoId,
            'fecha_inicio' => now()->subDays(15)->toDateString(),
            'fecha_fin' => now()->addDays(15)->toDateString(),
            'periodo_meses' => 1,
            'estado' => 'Activo',
            'modalidad' => 'remoto',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/integrantes/me/schedule-history?q=REMOTO&estado=Activo&modalidad=remoto&periodo=90&por_pagina=1&pagina=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.modalidad', 'remoto')
            ->assertJsonPath('data.0.horarios.0.hora_inicio', '08:00')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonMissing(['id' => $otherHistoryId]);
    }

    public function test_personal_schedule_is_available_without_permission_while_administration_remains_protected(): void
    {
        $connection = Schema::getConnection();
        $roleId = $connection->table('roles')->value('id');
        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);

        $this->getJson('/api/integrantes/me')->assertOk();
        $this->getJson('/api/integrantes/me/schedule-history')->assertOk();
        $this->getJson('/api/schedule-change-requests/mine')->assertOk();
        $this->getJson('/api/schedule-change-requests')->assertForbidden();

        $this->grantPermission($roleId, 'solicitudes_horario.ver');

        $this->getJson('/api/schedule-change-requests')->assertOk();
    }

    public function test_integrante_module_detail_history_and_schedule_use_separate_permissions(): void
    {
        $connection = Schema::getConnection();
        $roleId = $connection->table('roles')->value('id');
        $integranteId = $connection->table('integrantes')->value('id');
        $historyId = $connection->table('integrantes_historial')->value('id');
        $blocks = collect(range(1, 5))->map(fn (int $day) => [
            'dia_semana' => $day,
            'hora_inicio' => '08:00',
            'hora_fin' => '10:00',
        ])->all();
        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);

        $this->grantPermission($roleId, 'integrantes.ver');

        $this->getJson('/api/integrantes')->assertOk();
        $this->getJson("/api/integrantes/{$integranteId}")->assertForbidden();
        $this->getJson("/api/integrantes/{$integranteId}/history")->assertForbidden();
        $this->getJson("/api/integrante-histories/{$historyId}/schedules")->assertOk();

        $this->grantPermission($roleId, 'integrantes.ver_detalle');

        $this->getJson("/api/integrantes/{$integranteId}")->assertOk();
        $this->putJson("/api/integrante-histories/{$historyId}/schedules", [
            'blocks' => $blocks,
        ])->assertForbidden();
        $this->getJson("/api/integrantes/{$integranteId}/history")->assertForbidden();

        $this->grantPermission($roleId, 'integrantes.editar');

        $this->putJson("/api/integrante-histories/{$historyId}/schedules", [
            'blocks' => $blocks,
        ])->assertOk();

        $this->grantPermission($roleId, 'integrantes.ver_historial');

        $this->getJson("/api/integrantes/{$integranteId}/history")->assertOk();
    }

    public function test_it_updates_a_volunteer_without_requiring_practice_hours(): void
    {
        $integranteId = Schema::getConnection()->table('integrantes')->value('id');
        $payload = $this->validPayload() + [
            'institucion_educativa' => '',
            'carrera' => '',
            'ciclo' => '',
            'horas_practicas_requeridas' => 0,
        ];

        $this->putJson("/api/integrantes/{$integranteId}", $payload)
            ->assertOk()
            ->assertJsonPath('data.tipo_integrante', 'voluntario')
            ->assertJsonPath('data.horas_practicas_requeridas', null);

        $this->assertDatabaseHas('integrantes_historial', [
            'integrante_id' => $integranteId,
            'tipo_integrante' => 'voluntario',
            'horas_practicas_requeridas' => null,
        ]);
    }

    public function test_validation_errors_are_returned_in_spanish(): void
    {
        $payload = $this->validPayload();
        $payload['nombres'] = '';

        $this->postJson('/api/integrantes', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('errors.nombres.0', 'El campo nombres es obligatorio.');
    }

    public function test_it_deactivates_integrante_with_active_applications_and_records_authenticated_account(): void
    {
        $integranteId = Schema::getConnection()->table('integrantes')->value('id');
        $historyId = Schema::getConnection()->table('integrantes_historial')->value('id');
        $accountId = Schema::getConnection()->table('cuentas_acceso')->value('id');
        $areaId = Schema::getConnection()->table('cargos')->value('area_id');
        $applicationId = Schema::getConnection()->table('aplicaciones')->insertGetId([
            'nombre' => 'Sistema activo', 'licencias_total' => 1, 'activo' => true,
            'area_id' => $areaId, 'created_at' => now(), 'updated_at' => now(),
        ]);
        Schema::getConnection()->table('integrante_aplicaciones')->insert([
            'aplicacion_id' => $applicationId, 'historial_id' => $historyId,
            'activo' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->postJson("/api/integrantes/{$integranteId}/deactivate", ['motivo' => 'Fin de participación'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'Inactivo');

        $this->assertDatabaseHas('integrantes_historial', [
            'integrante_id' => $integranteId,
            'desactivado_por' => $accountId,
            'tipo_desactivacion' => 'manual',
        ]);
        $this->assertDatabaseHas('integrante_aplicaciones', [
            'historial_id' => $historyId,
            'aplicacion_id' => $applicationId,
            'activo' => true,
        ]);
    }

    public function test_activating_an_integrante_requires_its_own_permission(): void
    {
        $connection = Schema::getConnection();
        $integranteId = $this->postJson('/api/integrantes', $this->validPayload())
            ->assertCreated()
            ->json('data.id');
        $roleId = $connection->table('roles')->value('id');
        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);

        $this->grantPermission($roleId, 'integrantes.desactivar');

        $this->postJson("/api/integrantes/{$integranteId}/deactivate", [
            'motivo' => 'Fin de participación',
        ])->assertOk();

        $this->postJson("/api/integrantes/{$integranteId}/restore")->assertForbidden();

        $this->grantPermission($roleId, 'integrantes.activar');

        $this->postJson("/api/integrantes/{$integranteId}/restore")
            ->assertOk()
            ->assertJsonPath('data.estado', 'Activo');
    }

    public function test_rehiring_an_integrante_requires_the_rehire_permission(): void
    {
        $connection = Schema::getConnection();
        $integranteId = $this->postJson('/api/integrantes', $this->validPayload())
            ->assertCreated()
            ->json('data.id');
        $roleId = $connection->table('roles')->value('id');
        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);

        $this->grantPermission($roleId, 'integrantes.desactivar');
        $this->postJson("/api/integrantes/{$integranteId}/deactivate", [
            'motivo' => 'Fin de participación',
        ])->assertOk();

        $this->grantPermission($roleId, 'integrantes.crear');
        $this->grantPermission($roleId, 'integrantes.editar');

        $this->postJson("/api/integrantes/{$integranteId}/rehire", $this->validPayload())
            ->assertForbidden();

        $this->grantPermission($roleId, 'integrantes.recontratar');

        $this->postJson("/api/integrantes/{$integranteId}/rehire", $this->validPayload())
            ->assertOk()
            ->assertJsonPath('data.estado', 'Activo');
    }

    public function test_it_assigns_and_revokes_application_access(): void
    {
        $connection = Schema::getConnection();
        $historyId = $connection->table('integrantes_historial')->value('id');
        $areaId = $connection->table('cargos')->value('area_id');
        $roleId = $connection->table('roles')->value('id');
        $applicationId = $connection->table('aplicaciones')->insertGetId([
            'nombre' => 'Sistema interno', 'licencias_total' => 1, 'activo' => true,
            'area_id' => $areaId, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);
        $this->postJson('/api/integrante-access-assignments', [
            'aplicacion_id' => $applicationId, 'historial_id' => $historyId,
        ])->assertForbidden();

        $this->grantPermission($roleId, 'accesos.gestionar');

        $response = $this->postJson('/api/integrante-access-assignments', [
            'aplicacion_id' => $applicationId, 'historial_id' => $historyId,
        ])->assertCreated()->assertJsonPath('data.activo', true);

        $assignmentId = $response->json('data.id');
        $this->deleteJson("/api/integrante-access-assignments/{$assignmentId}")->assertOk();
        $this->assertDatabaseHas('integrante_aplicaciones', ['id' => $assignmentId, 'activo' => false]);
    }

    public function test_it_filters_active_and_inactive_access_assignments_from_query_parameters(): void
    {
        $now = now();
        $connection = Schema::getConnection();
        $adminHistoryId = $connection->table('integrantes_historial')->value('id');
        $adminAreaId = $connection->table('cargos')->value('area_id');
        $roleId = $connection->table('roles')->value('id');
        $adminApplicationId = $connection->table('aplicaciones')->insertGetId([
            'nombre' => 'Sistema interno', 'licencias_total' => 5, 'activo' => true,
            'area_id' => $adminAreaId, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $connection->table('integrante_aplicaciones')->insert([
            'aplicacion_id' => $adminApplicationId, 'historial_id' => $adminHistoryId,
            'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);

        $operationsAreaId = $connection->table('areas')->insertGetId([
            'nombre' => 'Operaciones', 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $analystCargoId = $connection->table('cargos')->insertGetId([
            'nombre' => 'Analista', 'area_id' => $operationsAreaId, 'rol_id' => $roleId,
            'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $operationsApplicationId = $connection->table('aplicaciones')->insertGetId([
            'nombre' => 'CRM', 'licencias_total' => 5, 'activo' => true,
            'area_id' => $operationsAreaId, 'created_at' => $now, 'updated_at' => $now,
        ]);

        foreach ([
            ['name' => 'MARIA FLORES', 'email' => 'maria@example.com', 'state' => 'Activo', 'type' => 'practicante'],
            ['name' => 'LUIS RAMOS', 'email' => 'luis@example.com', 'state' => 'Inactivo', 'type' => 'voluntario'],
        ] as $personData) {
            [$firstName, $lastName] = explode(' ', $personData['name'], 2);
            $personId = (string) Str::uuid();
            $connection->table('personas')->insert([
                'id' => $personId, 'nombres' => $firstName, 'apellidos' => $lastName,
                'correo' => $personData['email'], 'created_at' => $now, 'updated_at' => $now,
            ]);
            $memberId = $connection->table('integrantes')->insertGetId([
                'persona_id' => $personId, 'estado' => $personData['state'],
                'accesos_pendientes_revision' => false, 'accesos_retirados' => false,
                'created_at' => $now, 'updated_at' => $now,
            ]);
            $historyId = $connection->table('integrantes_historial')->insertGetId([
                'integrante_id' => $memberId, 'tipo_integrante' => $personData['type'],
                'cargo_id' => $analystCargoId, 'estado' => $personData['state'],
                'created_at' => $now, 'updated_at' => $now,
            ]);
            $connection->table('integrante_aplicaciones')->insert([
                'aplicacion_id' => $operationsApplicationId, 'historial_id' => $historyId,
                'activo' => true, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        $activeFilters = http_build_query([
            'inactive' => 0,
            'area' => 'Operaciones',
            'cargo' => 'Analista',
            'tipo' => 'practicante',
            'app' => $operationsApplicationId,
        ]);

        $connection->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);
        $this->grantPermission($roleId, 'accesos.ver', 'global');

        $this->getJson("/api/integrante-access-assignments?{$activeFilters}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante.nombre', 'MARIA FLORES');

        $this->getJson('/api/integrante-access-assignments?inactive=0&q=admin%40example.com')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante.nombre', 'ADMINISTRADOR SEMBRIA');

        $this->getJson('/api/integrante-access-assignments?inactive=1&q=luis')
            ->assertForbidden();

        $this->grantPermission($roleId, 'accesos.ver_inactivos', 'global');

        $this->getJson('/api/integrante-access-assignments?inactive=1&q=luis')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante.nombre', 'LUIS RAMOS');

        $this->getJson('/api/integrante-access-assignments?inactive=1&q=maria')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    private function validPayload(): array
    {
        return [
            'tipo_integrante' => 'voluntario', 'nombres' => 'NUEVO', 'apellidos' => 'INTEGRANTE',
            'fecha_nacimiento' => '2000-01-01', 'documento_identidad' => '87654321',
            'tipo_documento' => 'dni', 'telefono' => '999888777', 'modalidad' => 'remoto',
            'cargo_id' => $this->cargoId, 'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-07-01', 'periodo_meses' => 6,
            'departamento' => 'Lima', 'ciudad' => 'Lima', 'distrito' => 'Lima',
        ];
    }

    private function grantPermission(int $roleId, string $code, string $scope = 'area'): void
    {
        $connection = Schema::getConnection();
        $permissionId = $connection->table('permisos')->insertGetId([
            'codigo' => $code,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $connection->table('rol_permisos')->insert([
            'rol_id' => $roleId,
            'permiso_id' => $permissionId,
            'alcance' => $scope,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedIdentity(): void
    {
        $now = now();
        $personaId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Administrador', 'email' => 'admin@example.com', 'password' => Hash::make('password'),
        ]);
        $areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'Administración', 'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $roleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'admin', 'nombre' => 'Administrador', 'acceso_total' => true,
            'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'Coordinador', 'area_id' => $areaId, 'rol_id' => $roleId,
            'activo' => true, 'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('personas')->insert([
            'id' => $personaId, 'nombres' => 'ADMINISTRADOR', 'apellidos' => 'SEMBRIA',
            'correo' => 'admin@example.com', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $accountId = (string) Str::uuid();
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => $accountId, 'user_id' => $this->user->id, 'persona_id' => $personaId,
            'activo' => true, 'must_change_password' => false, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $integranteId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personaId, 'estado' => 'Activo', 'accesos_pendientes_revision' => false,
            'accesos_retirados' => false, 'fecha_nacimiento' => '1995-01-01',
            'documento_identidad' => '12345678', 'tipo_documento' => 'dni', 'telefono' => '999999999',
            'created_at' => $now, 'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $integranteId, 'tipo_integrante' => 'voluntario', 'cargo_id' => $this->cargoId,
            'fecha_inicio' => '2026-01-01', 'fecha_fin' => '2027-01-01', 'periodo_meses' => 12,
            'estado' => 'Activo', 'modalidad' => 'presencial', 'created_at' => $now, 'updated_at' => $now,
        ]);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('email');
            $t->string('password');
            $t->rememberToken();
            $t->timestamps();
        });
        Schema::create('personas', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('nombres');
            $t->string('apellidos');
            $t->string('correo')->nullable();
            $t->timestamps();
        });
        Schema::create('roles', function (Blueprint $t) {
            $t->id();
            $t->string('codigo');
            $t->string('nombre');
            $t->text('descripcion')->nullable();
            $t->boolean('acceso_total');
            $t->boolean('activo');
            $t->timestamps();
        });
        Schema::create('permisos', function (Blueprint $t) {
            $t->id();
            $t->string('codigo');
            $t->boolean('activo');
            $t->timestamps();
        });
        Schema::create('rol_permisos', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('rol_id');
            $t->unsignedBigInteger('permiso_id');
            $t->string('alcance');
            $t->timestamps();
        });
        Schema::create('areas', function (Blueprint $t) {
            $t->id();
            $t->string('nombre');
            $t->text('descripcion')->nullable();
            $t->boolean('activo');
            $t->timestamps();
        });
        Schema::create('cargos', function (Blueprint $t) {
            $t->id();
            $t->string('nombre');
            $t->text('descripcion')->nullable();
            $t->unsignedBigInteger('area_id');
            $t->unsignedBigInteger('rol_id');
            $t->boolean('activo');
            $t->timestamps();
        });
        Schema::create('cuentas_acceso', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->unsignedBigInteger('user_id');
            $t->uuid('persona_id');
            $t->boolean('activo');
            $t->boolean('must_change_password');
            $t->timestamps();
        });
        Schema::create('integrantes', function (Blueprint $t) {
            $t->id();
            $t->string('estado');
            $t->boolean('accesos_pendientes_revision');
            $t->boolean('accesos_retirados');
            $t->timestamp('accesos_retirados_at')->nullable();
            $t->date('fecha_nacimiento')->nullable();
            $t->uuid('persona_id');
            $t->text('avatar_path')->nullable();
            $t->string('documento_identidad')->nullable();
            $t->string('telefono')->nullable();
            $t->string('tipo_documento')->nullable();
            $t->string('departamento')->nullable();
            $t->string('ciudad')->nullable();
            $t->string('distrito')->nullable();
            $t->timestamps();
        });
        Schema::create('integrantes_historial', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('integrante_id');
            $t->string('tipo_integrante');
            $t->unsignedBigInteger('cargo_id');
            $t->date('fecha_inicio')->nullable();
            $t->date('fecha_fin')->nullable();
            $t->integer('periodo_meses')->nullable();
            $t->string('estado');
            $t->boolean('requiere_asistencia')->default(true);
            $t->timestamp('fecha_desactivacion')->nullable();
            $t->uuid('desactivado_por')->nullable();
            $t->text('motivo_desactivacion')->nullable();
            $t->string('tipo_desactivacion')->nullable();
            $t->string('institucion_educativa')->nullable();
            $t->integer('horas_practicas_requeridas')->nullable();
            $t->string('carrera')->nullable();
            $t->string('ciclo')->nullable();
            $t->string('modalidad')->nullable();
            $t->timestamps();
        });
        Schema::create('integrante_horarios', function (Blueprint $t) {
            $t->id();
            $t->integer('dia_semana');
            $t->time('hora_inicio');
            $t->time('hora_fin');
            $t->unsignedBigInteger('historial_id');
            $t->timestamps();
        });
        Schema::create('asistencias', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('integrante_id');
            $t->integer('minutos_realizados')->default(0);
            $t->string('estado');
            $t->timestamps();
        });
        Schema::create('notificaciones_asistencia', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id');
            $t->unsignedBigInteger('asistencia_id')->nullable();
            $t->string('tipo', 50);
            $t->string('titulo');
            $t->text('mensaje');
            $t->string('clave')->unique();
            $t->timestamp('read_at')->nullable();
            $t->timestamp('dismissed_at')->nullable();
            $t->timestamps();
        });
        Schema::create('solicitudes_cambio_horario', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('integrante_id');
            $t->unsignedBigInteger('historial_anterior_id');
            $t->string('estado');
            $t->timestamp('fecha_solicitud');
            $t->date('fecha_efectiva');
            $t->text('motivo')->nullable();
            $t->timestamp('fecha_resolucion')->nullable();
            $t->uuid('resuelto_por')->nullable();
            $t->text('observacion_resolucion')->nullable();
            $t->unsignedBigInteger('historial_nuevo_id')->nullable();
            $t->uuid('created_by');
            $t->timestamps();
        });
        Schema::create('solicitudes_cambio_horario_detalle', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('solicitud_id');
            $t->integer('dia_semana');
            $t->time('hora_inicio');
            $t->time('hora_fin');
        });
        Schema::create('aplicaciones', function (Blueprint $t) {
            $t->id();
            $t->string('nombre');
            $t->text('descripcion')->nullable();
            $t->text('imagen_url')->nullable();
            $t->text('imagen_path')->nullable();
            $t->integer('licencias_total');
            $t->boolean('activo');
            $t->unsignedBigInteger('area_id')->nullable();
            $t->timestamps();
        });
        Schema::create('integrante_aplicaciones', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('aplicacion_id');
            $t->unsignedBigInteger('historial_id');
            $t->boolean('activo');
            $t->timestamp('fecha_retiro')->nullable();
            $t->uuid('retirado_por')->nullable();
            $t->timestamps();
        });
    }
}
