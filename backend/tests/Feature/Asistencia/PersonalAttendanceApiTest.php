<?php

namespace Tests\Feature\Asistencia;

use App\Models\User;
use App\Services\Notifications\InstitutionalNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PersonalAttendanceApiTest extends TestCase
{
    private User $user;

    private int $historyId;

    private int $scheduleId;

    private int $roleId;

    private int $cargoId;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:15:00', 'America/Lima'));
        $this->createSchema();
        $this->seedParticipant('voluntario');
        Sanctum::actingAs($this->user);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_access_total_role_can_use_personal_attendance(): void
    {
        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.horario_id', $this->scheduleId)
            ->assertJsonPath('data.0.estado', 'pendiente');

        $started = $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'Retraso por transporte público.',
        ])->assertOk()
            ->assertJsonPath('data.estado', 'en_jornada')
            ->assertJsonPath('data.minutos_tardanza', 75);

        $attendanceId = $started->json('data.id');

        $this->assertDatabaseHas('asistencia_justificaciones', [
            'asistencia_id' => $attendanceId,
            'tipo' => 'tardanza',
            'estado' => 'pendiente',
        ]);

        $this->getJson('/api/asistencia/flujos?seccion=solicitudes')
            ->assertOk()
            ->assertJsonPath('data.justificaciones.0.tipo', 'tardanza')
            ->assertJsonPath('data.justificaciones.0.area', 'Operaciones')
            ->assertJsonPath('data.justificaciones.0.cargo', 'Coordinador')
            ->assertJsonPath('data.justificaciones.0.avatar_path', 'avatars/ana-torres.webp')
            ->assertJsonPath(
                'data.justificaciones.0.avatar_url',
                Storage::disk('public')->url('avatars/ana-torres.webp'),
            );

        $lateJustificationId = Schema::getConnection()->table('asistencia_justificaciones')
            ->where('tipo', 'tardanza')
            ->value('id');
        $this->patchJson("/api/asistencia/justificaciones/{$lateJustificationId}/resolver", [
            'estado' => 'aprobada',
            'observacion' => 'Motivo de tardanza validado.',
        ])->assertOk();
        $this->assertDatabaseHas('asistencia_justificaciones', [
            'id' => $lateJustificationId,
            'estado' => 'aprobada',
        ]);
        $this->assertDatabaseHas('asistencia_auditoria', [
            'asistencia_id' => $attendanceId,
            'accion' => 'justificacion_aprobada',
        ]);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:30:00', 'America/Lima'));

        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar", [
            'descripcion' => 'Preparé el reporte operativo del bloque.',
            'motivo_salida' => 'Salida coordinada por una cita personal.',
        ])->assertOk()
            ->assertJsonPath('data.estado', 'completada')
            ->assertJsonPath('data.minutos_realizados', 15)
            ->assertJsonPath('data.minutos_salida_anticipada', 30)
            ->assertJsonPath('data.descripcion_jornada', 'Preparé el reporte operativo del bloque.')
            ->assertJsonPath('data.evidencia_url', null);

        $this->getJson('/api/mi-asistencia/historial')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $attendanceId);

        $this->assertDatabaseHas('asistencia_auditoria', [
            'asistencia_id' => $attendanceId,
            'accion' => 'salida_registrada',
        ]);
    }

    public function test_late_entry_requires_a_reason(): void
    {
        $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('motivo');
    }

    public function test_late_entry_keeps_the_time_when_the_justification_modal_was_opened(): void
    {
        $occurredAt = CarbonImmutable::parse('2026-09-24 09:17:00', 'America/Lima');
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:18:00', 'America/Lima'));

        $response = $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'El transporte público tuvo una demora inesperada.',
            'ocurrido_en' => $occurredAt->toISOString(),
            'recuperaciones' => [[
                'fecha' => '2026-09-25',
                'hora_inicio' => '08:00',
                'hora_fin' => '09:17',
            ]],
        ])->assertOk()
            ->assertJsonPath('data.minutos_tardanza', 77)
            ->assertJsonPath('data.fuente_entrada', 'online');

        $attendanceId = $response->json('data.id');
        $this->assertDatabaseHas('asistencia_incidencias', [
            'asistencia_id' => $attendanceId,
            'tipo' => 'tardanza',
            'minutos' => 77,
        ]);
        $this->assertDatabaseHas('asistencia_recuperaciones', [
            'minutos' => 77,
        ]);
    }

    public function test_server_rejects_entry_before_window_and_after_block_end(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 07:54:00', 'America/Lima'));
        $this->postJson('/api/mi-asistencia/iniciar', ['horario_id' => $this->scheduleId])
            ->assertUnprocessable()->assertJsonValidationErrors('horario_id');

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));
        $this->postJson('/api/mi-asistencia/iniciar', ['horario_id' => $this->scheduleId])
            ->assertUnprocessable()->assertJsonValidationErrors('horario_id');
    }

    public function test_early_finish_requires_work_description_and_exit_reason(): void
    {
        $attendanceId = $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'Retraso por transporte público.',
        ])->assertOk()->json('data.id');

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:30:00', 'America/Lima'));

        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('descripcion');

        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar", [
            'descripcion' => 'Preparé el reporte operativo del bloque.',
        ])->assertUnprocessable()->assertJsonValidationErrors('motivo_salida');

        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar", [
            'descripcion' => 'Preparé el reporte operativo del bloque.',
            'motivo_salida' => 'Tengo una cita médica previamente coordinada.',
        ])->assertOk()
            ->assertJsonPath('data.estado', 'completada')
            ->assertJsonPath('data.minutos_salida_anticipada', 30);

        $this->assertDatabaseHas('asistencias', [
            'id' => $attendanceId,
            'estado' => 'completada',
            'evidencia_path' => null,
        ]);
        $this->assertDatabaseHas('asistencia_incidencias', [
            'asistencia_id' => $attendanceId,
            'tipo' => 'salida_anticipada',
            'descripcion' => 'Tengo una cita médica previamente coordinada.',
        ]);
        $this->assertDatabaseHas('asistencia_justificaciones', [
            'asistencia_id' => $attendanceId,
            'tipo' => 'salida_anticipada',
            'estado' => 'pendiente',
        ]);
    }

    public function test_regular_finish_requires_work_description(): void
    {
        $attendanceId = $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'Retraso por transporte público.',
        ])->assertOk()->json('data.id');

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:00:00', 'America/Lima'));

        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('descripcion');

        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar", [
            'descripcion' => 'Completé las tareas planificadas y actualicé el reporte.',
        ])
            ->assertOk()
            ->assertJsonPath('data.estado', 'completada')
            ->assertJsonPath('data.minutos_salida_anticipada', 0)
            ->assertJsonPath('data.observacion', 'Retraso por transporte público.');
    }

    public function test_early_exit_accepts_optional_evidence_and_manual_recovery_plan(): void
    {
        Storage::fake('public');
        config(['filesystems.attendance_evidence_disk' => 'public']);
        $attendanceId = $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'Retraso por transporte público.',
        ])->assertOk()->json('data.id');

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:30:00', 'America/Lima'));
        $this->post("/api/mi-asistencia/{$attendanceId}/terminar", [
            '_method' => 'PATCH',
            'descripcion' => 'Preparé el reporte operativo del bloque.',
            'motivo_salida' => 'Debo atender una emergencia familiar.',
            'adjunto' => UploadedFile::fake()->create('evidencia.png', 120, 'image/png'),
            'recuperaciones' => [[
                'fecha' => '2026-09-25',
                'hora_inicio' => '10:00',
                'hora_fin' => '10:30',
            ]],
        ], ['Accept' => 'application/json'])->assertOk();

        $justification = Schema::getConnection()->table('asistencia_justificaciones')
            ->where('asistencia_id', $attendanceId)
            ->where('tipo', 'salida_anticipada')
            ->first();
        $this->assertNotNull($justification->adjunto_path);
        Storage::disk('public')->assertExists($justification->adjunto_path);
        $this->assertDatabaseHas('asistencia_recuperaciones', [
            'justificacion_id' => $justification->id,
            'permiso_id' => null,
            'minutos' => 30,
            'estado' => 'programada',
        ]);
    }

    public function test_late_entry_creates_the_required_recovery_plan(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 08:30:00', 'America/Lima'));

        $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'Retraso por una emergencia de transporte.',
            'recuperaciones' => [[
                'fecha' => '2026-09-25',
                'hora_inicio' => '08:00',
                'hora_fin' => '08:30',
            ]],
        ])->assertOk()->assertJsonPath('data.minutos_tardanza', 30);

        $justificationId = Schema::getConnection()->table('asistencia_justificaciones')
            ->where('tipo', 'tardanza')
            ->value('id');
        $this->assertDatabaseHas('asistencia_recuperaciones', [
            'justificacion_id' => $justificationId,
            'minutos' => 30,
        ]);
    }

    public function test_manager_can_reject_early_exit_and_member_receives_warning_notification(): void
    {
        $attendanceId = $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'Retraso por transporte público.',
        ])->assertOk()->json('data.id');
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:30:00', 'America/Lima'));
        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar", [
            'descripcion' => 'Preparé el reporte operativo del bloque.',
            'motivo_salida' => 'Necesito atender una gestión personal.',
        ])->assertOk();
        $justificationId = Schema::getConnection()->table('asistencia_justificaciones')
            ->where('tipo', 'salida_anticipada')
            ->value('id');

        $this->patchJson("/api/asistencia/justificaciones/{$justificationId}/resolver", [
            'estado' => 'rechazada',
            'observacion' => 'El motivo no fue coordinado ni acreditado.',
            'gravedad_amonestacion' => 'grave',
        ])->assertOk();

        $this->assertDatabaseHas('asistencia_amonestaciones', [
            'asistencia_id' => $attendanceId,
            'justificacion_id' => $justificationId,
            'gravedad' => 'grave',
        ]);
        $this->assertDatabaseHas('asistencia_recuperaciones', [
            'justificacion_id' => $justificationId,
            'estado' => 'cancelada',
        ]);
        $this->assertDatabaseHas('asistencia_auditoria', [
            'asistencia_id' => $attendanceId,
            'accion' => 'justificacion_rechazada',
        ]);
        $this->getJson('/api/asistencia/amonestaciones')
            ->assertOk()
            ->assertJsonPath('data.0.integrante', 'ANA TORRES')
            ->assertJsonPath('data.0.amonestaciones_total', 1)
            ->assertJsonPath('data.0.amonestaciones_bajas', 0)
            ->assertJsonPath('data.0.amonestaciones_medias', 0)
            ->assertJsonPath('data.0.amonestaciones_graves', 1)
            ->assertJsonPath('data.0.avatar_path', 'avatars/ana-torres.webp')
            ->assertJsonPath(
                'data.0.avatar_url',
                Storage::disk('public')->url('avatars/ana-torres.webp'),
            );
        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'salida_rechazada']);

        Storage::fake('public');
        config(['filesystems.attendance_evidence_disk' => 'public']);
        $warningId = Schema::getConnection()->table('asistencia_amonestaciones')->value('id');
        $appealId = $this->post('/api/mi-asistencia/amonestaciones/'.$warningId.'/apelaciones', [
            'tipo' => 'medica',
            'motivo' => 'La salida fue necesaria por una atención médica urgente.',
            'adjunto' => UploadedFile::fake()->create('certificado.jpg', 100, 'image/jpeg'),
        ], ['Accept' => 'application/json'])->assertCreated()->json('data.id');

        $this->patchJson("/api/asistencia/apelaciones/{$appealId}/resolver", [
            'estado' => 'aprobada', 'observacion' => 'Certificado médico validado.',
        ])->assertOk()->assertJsonPath('data.estado', 'aprobada');
        $this->assertDatabaseHas('asistencia_amonestaciones', ['id' => $warningId, 'estado' => 'retirada']);
    }

    public function test_practitioner_can_access_personal_attendance(): void
    {
        Schema::getConnection()->table('integrantes_historial')
            ->where('id', $this->historyId)
            ->update(['tipo_integrante' => 'practicante']);

        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_notification_endpoint_lists_and_manages_institutional_notifications(): void
    {
        Schema::getConnection()->table('integrantes')->update([
            'fecha_nacimiento' => '1995-09-29',
        ]);
        Schema::getConnection()->table('integrantes_historial')
            ->where('id', $this->historyId)
            ->update(['fecha_fin' => '2026-10-24']);

        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonMissing(['tipo' => 'periodo_vence_30_dias'])
            ->assertJsonMissing(['tipo' => 'cumpleanos_proximo']);

        $this->artisan('notifications:generate-institutional')->assertSuccessful();
        $service = app(InstitutionalNotificationService::class);
        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'periodo_vence_30_dias'])
            ->assertJsonMissing(['tipo' => 'cumpleanos_proximo']);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-28 09:15:00', 'America/Lima'));
        $service->generateForUser($this->user);
        $response = $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment([
                'tipo' => 'cumpleanos_proximo',
                'titulo' => 'Cumpleaños mañana',
                'mensaje' => 'Mañana es el cumpleaños de ANA TORRES.',
            ]);
        $this->assertCount(1, collect($response->json('data'))->where('tipo', 'cumpleanos_proximo'));

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-29 09:15:00', 'America/Lima'));
        $service->generateForUser($this->user);
        $response = $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment([
                'tipo' => 'cumpleanos_proximo',
                'titulo' => 'Cumpleaños hoy',
                'mensaje' => 'Hoy es el cumpleaños de ANA TORRES.',
            ]);
        $this->assertCount(2, collect($response->json('data'))->where('tipo', 'cumpleanos_proximo'));

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-09 09:15:00', 'America/Lima'));
        $service->generateForUser($this->user);
        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'periodo_vence_15_dias']);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-17 09:15:00', 'America/Lima'));
        $service->generateForUser($this->user);
        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'periodo_vence_7_dias']);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-23 09:15:00', 'America/Lima'));
        $service->generateForUser($this->user);
        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'periodo_vence_1_dia']);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-25 09:15:00', 'America/Lima'));
        $service->generateForUser($this->user);

        $response = $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'periodo_vencido']);
        $notifications = collect($response->json('data'));
        foreach ([
            'periodo_vence_30_dias',
            'periodo_vence_15_dias',
            'periodo_vence_7_dias',
            'periodo_vence_1_dia',
            'periodo_vencido',
        ] as $type) {
            $this->assertCount(1, $notifications->where('tipo', $type));
        }
        $notificationId = collect($response->json('data'))
            ->firstWhere('tipo', 'periodo_vence_30_dias')['id'];

        $this->patchJson("/api/notificaciones/{$notificationId}/leer")
            ->assertOk()
            ->assertJsonPath('data.id', $notificationId);

        $this->deleteJson("/api/notificaciones/{$notificationId}")->assertOk();

        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonMissing(['id' => $notificationId]);
    }

    public function test_notification_endpoint_lists_all_non_deleted_notifications(): void
    {
        $now = now();
        $notifications = collect(range(1, 55))->map(fn (int $number) => [
            'user_id' => $this->user->id,
            'asistencia_id' => null,
            'tipo' => 'prueba',
            'titulo' => "Notificación {$number}",
            'mensaje' => "Mensaje {$number}",
            'clave' => "prueba-notificacion-{$number}",
            'read_at' => null,
            'dismissed_at' => null,
            'created_at' => $now->copy()->addSeconds($number),
            'updated_at' => $now->copy()->addSeconds($number),
        ])->all();

        Schema::getConnection()
            ->table('notificaciones_asistencia')
            ->insert($notifications);

        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonCount(55, 'data')
            ->assertJsonPath('data.0.titulo', 'Notificación 55')
            ->assertJsonPath('data.54.titulo', 'Notificación 1');
    }

    public function test_institutional_notifications_respect_current_module_permissions(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->roleId)
            ->update(['acceso_total' => false]);
        Schema::getConnection()->table('integrantes')->update([
            'fecha_nacimiento' => '1995-09-29',
        ]);
        Schema::getConnection()->table('integrantes_historial')
            ->where('id', $this->historyId)
            ->update(['fecha_fin' => '2026-10-24']);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-28 09:15:00', 'America/Lima'));

        $service = app(InstitutionalNotificationService::class);
        $service->generateForUser($this->user);

        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonMissing(['tipo' => 'cumpleanos_proximo'])
            ->assertJsonMissing(['tipo' => 'periodo_vence_30_dias']);

        $this->grantRolePermission('cumpleanos.ver');
        $service->generateForUser($this->user);
        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'cumpleanos_proximo'])
            ->assertJsonMissing(['tipo' => 'periodo_vence_30_dias']);

        $this->grantRolePermission('integrantes.ver');
        $service->generateForUser($this->user);
        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonFragment(['tipo' => 'cumpleanos_proximo'])
            ->assertJsonFragment(['tipo' => 'periodo_vence_30_dias']);
    }

    public function test_member_requests_leave_with_exact_recovery_plan_and_management_approves_it(): void
    {
        $this->getJson('/api/mi-asistencia/permisos/estimar?fechas%5B0%5D=2026-10-01&fechas%5B1%5D=2026-10-15')
            ->assertOk()->assertJsonPath('data.minutos', 240);

        $permissionId = $this->postJson('/api/mi-asistencia/permisos', [
            'tipo' => 'personal',
            'fechas' => ['2026-10-01', '2026-10-15'],
            'motivo' => 'Trámite personal previamente programado.',
            'recuperaciones' => [[
                'fecha' => '2026-10-16', 'hora_inicio' => '08:00', 'hora_fin' => '12:00',
            ]],
        ])->assertCreated()
            ->assertJsonPath('data.minutos_a_recuperar', 240)
            ->assertJsonPath('data.fechas.0.fecha', '2026-10-01')
            ->assertJsonPath('data.fechas.1.fecha', '2026-10-15')
            ->json('data.id');

        $this->patchJson("/api/asistencia/permisos/{$permissionId}/resolver", [
            'estado' => 'aprobada', 'observacion' => 'Plan de recuperación conforme.',
        ])->assertOk()->assertJsonPath('data.estado', 'aprobada');

        $this->assertDatabaseHas('asistencias', [
            'fecha' => '2026-10-01', 'horario_id' => $this->scheduleId, 'estado' => 'permiso',
        ]);
        $this->assertDatabaseHas('asistencias', [
            'fecha' => '2026-10-15', 'horario_id' => $this->scheduleId, 'estado' => 'permiso',
        ]);
        $this->assertDatabaseMissing('asistencias', [
            'fecha' => '2026-10-08', 'horario_id' => $this->scheduleId, 'estado' => 'permiso',
        ]);
    }

    public function test_leave_dates_cannot_be_before_today(): void
    {
        $this->getJson('/api/mi-asistencia/permisos/estimar?fechas%5B0%5D=2026-09-23')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('fechas.0');

        $this->getJson('/api/mi-asistencia/permisos/proponer-recuperacion?fechas%5B0%5D=2026-09-23&dias=1')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('fechas.0');

        $this->postJson('/api/mi-asistencia/permisos', [
            'tipo' => 'personal',
            'fechas' => ['2026-09-23'],
            'motivo' => 'Trámite personal registrado fuera de fecha.',
            'recuperaciones' => [[
                'fecha' => '2026-09-25', 'hora_inicio' => '08:00', 'hora_fin' => '10:00',
            ]],
        ])->assertUnprocessable()->assertJsonValidationErrors('fechas.0');
    }

    public function test_recovery_plan_cannot_overlap_member_schedule(): void
    {
        $this->postJson('/api/mi-asistencia/permisos', [
            'tipo' => 'personal',
            'fechas' => ['2026-10-01'],
            'motivo' => 'Trámite personal previamente programado.',
            'recuperaciones' => [[
                'fecha' => '2026-10-08', 'hora_inicio' => '08:00', 'hora_fin' => '10:00',
            ]],
        ])->assertUnprocessable()->assertJsonValidationErrors('recuperaciones');
    }

    public function test_non_selected_days_between_permission_dates_remain_available(): void
    {
        $this->postJson('/api/mi-asistencia/permisos', [
            'tipo' => 'personal',
            'fechas' => ['2026-10-08'],
            'motivo' => 'Trámite personal para una fecha puntual.',
            'recuperaciones' => [[
                'fecha' => '2026-10-09', 'hora_inicio' => '08:00', 'hora_fin' => '10:00',
            ]],
        ])->assertCreated();

        $this->postJson('/api/mi-asistencia/permisos', [
            'tipo' => 'personal',
            'fechas' => ['2026-10-01', '2026-10-15'],
            'motivo' => 'Trámite personal para dos fechas no consecutivas.',
            'recuperaciones' => [[
                'fecha' => '2026-10-16', 'hora_inicio' => '08:00', 'hora_fin' => '12:00',
            ]],
        ])->assertCreated();
    }

    public function test_member_can_generate_recovery_plan_without_schedule_conflicts(): void
    {
        Schema::getConnection()->table('asistencia_configuraciones')->insert([
            'jornada_hora_inicio' => '08:00',
            'jornada_hora_fin' => '18:00',
            'jornada_dias' => json_encode([4], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/mi-asistencia/permisos/proponer-recuperacion?fechas%5B0%5D=2026-10-01&dias=1')
            ->assertOk()
            ->assertJsonPath('data.minutos', 120)
            ->assertJsonCount(1, 'data.recuperaciones')
            ->assertJsonPath('data.recuperaciones.0.fecha', '2026-10-08')
            ->assertJsonPath('data.recuperaciones.0.hora_inicio', '10:00')
            ->assertJsonPath('data.recuperaciones.0.hora_fin', '12:00');

        $this->postJson('/api/mi-asistencia/permisos', [
            'tipo' => 'personal',
            'fechas' => ['2026-10-01'],
            'motivo' => 'Trámite personal previamente programado.',
            'recuperaciones' => $response->json('data.recuperaciones'),
        ])->assertCreated();
    }

    public function test_incident_recovery_plan_is_always_scheduled_after_today(): void
    {
        Schema::getConnection()->table('asistencia_configuraciones')->insert([
            'jornada_hora_inicio' => '08:00',
            'jornada_hora_fin' => '18:00',
            'jornada_dias' => json_encode([5], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/mi-asistencia/recuperaciones/proponer?minutos=60&desde=2026-09-20&dias=1')
            ->assertOk()
            ->assertJsonPath('data.recuperaciones.0.fecha', '2026-09-25');

        $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'Retraso por una emergencia de transporte.',
            'recuperaciones' => [[
                'fecha' => '2026-09-24',
                'hora_inicio' => '10:00',
                'hora_fin' => '11:15',
            ]],
        ])->assertUnprocessable()->assertJsonValidationErrors('recuperaciones.0.fecha');
    }

    public function test_approved_recovery_is_managed_as_an_attendance_block(): void
    {
        $connection = Schema::getConnection();
        $memberId = $connection->table('integrantes')->value('id');
        $accountId = $connection->table('cuentas_acceso')->value('id');
        $permissionId = $connection->table('asistencia_permisos')->insertGetId([
            'integrante_id' => $memberId,
            'tipo' => 'personal',
            'fecha_inicio' => '2026-09-23',
            'fecha_fin' => '2026-09-23',
            'motivo' => 'Trámite personal previamente aprobado.',
            'minutos_a_recuperar' => 120,
            'estado' => 'aprobada',
            'solicitado_por' => $accountId,
            'resuelto_por' => $accountId,
            'fecha_resolucion' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $recoveryId = $connection->table('asistencia_recuperaciones')->insertGetId([
            'permiso_id' => $permissionId,
            'fecha' => '2026-09-24',
            'hora_inicio' => '10:00',
            'hora_fin' => '12:00',
            'minutos' => 120,
            'estado' => 'programada',
            'minutos_realizados' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.1.tipo_bloque', 'recuperacion')
            ->assertJsonPath('data.1.recuperacion_id', $recoveryId)
            ->assertJsonPath('data.1.estado', 'pendiente')
            ->assertJsonPath('data.1.hora_inicio_programada', '10:00');

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:54:00', 'America/Lima'));
        $this->postJson("/api/mi-asistencia/recuperaciones/{$recoveryId}/iniciar")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('recuperacion');

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 09:55:00', 'America/Lima'));
        $started = $this->postJson("/api/mi-asistencia/recuperaciones/{$recoveryId}/iniciar")
            ->assertOk()
            ->assertJsonPath('data.tipo_bloque', 'recuperacion')
            ->assertJsonPath('data.recuperacion_id', $recoveryId)
            ->assertJsonPath('data.estado', 'en_jornada')
            ->assertJsonPath('data.horario_id', null);

        $attendanceId = $started->json('data.id');

        $this->assertDatabaseHas('asistencia_recuperaciones', [
            'id' => $recoveryId,
            'asistencia_id' => $attendanceId,
            'estado' => 'en_curso',
        ]);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 12:00:00', 'America/Lima'));
        $this->patchJson("/api/mi-asistencia/{$attendanceId}/terminar", [
            'descripcion' => 'Completé las actividades previstas para la recuperación.',
        ])->assertOk()
            ->assertJsonPath('data.tipo_bloque', 'recuperacion')
            ->assertJsonPath('data.estado', 'completada')
            ->assertJsonPath('data.minutos_realizados', 120);

        $this->assertDatabaseHas('asistencia_recuperaciones', [
            'id' => $recoveryId,
            'estado' => 'completada',
            'minutos_realizados' => 120,
        ]);
    }

    public function test_medical_leave_requires_certificate_and_license_type_is_not_allowed(): void
    {
        $payload = [
            'fechas' => ['2026-10-01'],
            'motivo' => 'Atención médica previamente programada.',
            'recuperaciones' => [[
                'fecha' => '2026-10-02', 'hora_inicio' => '08:00', 'hora_fin' => '10:00',
            ]],
        ];

        $this->postJson('/api/mi-asistencia/permisos', $payload + ['tipo' => 'licencia'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('tipo');

        $this->postJson('/api/mi-asistencia/permisos', $payload + ['tipo' => 'medico'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('adjunto');

        Storage::fake('public');
        config(['filesystems.attendance_evidence_disk' => 'public']);
        $this->post('/api/mi-asistencia/permisos', $payload + [
            'tipo' => 'medico',
            'adjunto' => UploadedFile::fake()->create('certificado-medico.pdf', 120, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.tipo', 'medico');
    }

    public function test_justification_is_only_allowed_for_absences(): void
    {
        $attendanceId = $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId, 'motivo' => 'Retraso por transporte público.',
        ])->assertOk()->json('data.id');

        $this->postJson("/api/mi-asistencia/{$attendanceId}/justificaciones", [
            'motivo' => 'No debería aceptarse para una jornada iniciada.',
            'recuperaciones' => [[
                'fecha' => '2026-09-25', 'hora_inicio' => '08:00', 'hora_fin' => '09:15',
            ]],
        ])->assertUnprocessable()->assertJsonValidationErrors('asistencia');
    }

    public function test_member_can_attach_optional_document_to_absence_justification(): void
    {
        Storage::fake('public');
        config(['filesystems.attendance_evidence_disk' => 'public']);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));
        $this->artisan('attendance:process-absences')->assertSuccessful();
        $attendanceId = Schema::getConnection()->table('asistencias')->value('id');

        $this->postJson("/api/mi-asistencia/{$attendanceId}/justificaciones", [
            'motivo' => 'Tuve una emergencia médica y adjunto el certificado.',
        ])->assertUnprocessable()->assertJsonValidationErrors('recuperaciones');

        $response = $this->post("/api/mi-asistencia/{$attendanceId}/justificaciones", [
            'motivo' => 'Tuve una emergencia médica y adjunto el certificado.',
            'adjunto' => UploadedFile::fake()->create('certificado.pdf', 120, 'application/pdf'),
            'recuperaciones' => [[
                'fecha' => '2026-09-25',
                'hora_inicio' => '08:00',
                'hora_fin' => '10:00',
            ]],
        ], ['Accept' => 'application/json'])->assertOk();

        $path = Schema::getConnection()->table('asistencia_justificaciones')->value('adjunto_path');
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
        $this->assertDatabaseHas('asistencia_recuperaciones', [
            'justificacion_id' => Schema::getConnection()->table('asistencia_justificaciones')->value('id'),
            'minutos' => 120,
        ]);
        $response->assertJsonPath(
            'data.asistencia_justificaciones.0.adjunto_url',
            Storage::disk('public')->url($path),
        );

        $this->getJson('/api/mi-asistencia/solicitudes')
            ->assertOk()
            ->assertJsonPath('data.justificaciones.0.recuperaciones.0.fecha', '2026-09-25')
            ->assertJsonPath('data.justificaciones.0.recuperaciones.0.minutos', 120);

        $justificationId = Schema::getConnection()->table('asistencia_justificaciones')->value('id');
        $this->getJson('/api/asistencia/flujos?seccion=solicitudes')
            ->assertOk()
            ->assertJsonPath('data.justificaciones.0.correo', 'participante@example.com')
            ->assertJsonPath('data.justificaciones.0.estado', 'pendiente');

        $this->patchJson("/api/asistencia/justificaciones/{$justificationId}/resolver", [
            'estado' => 'aprobada',
            'observacion' => 'Documento validado por coordinaciÃ³n.',
        ])->assertOk();

        $this->assertDatabaseHas('asistencias', [
            'id' => $attendanceId,
            'estado' => 'justificada',
        ]);
    }

    public function test_management_can_update_attendance_rules(): void
    {
        $this->patchJson('/api/asistencia/configuracion', [
            'minutos_antes_inicio' => 10,
            'tolerancia_tardanza' => 15,
            'umbral_salida_anticipada' => 5,
            'minutos_gracia_falta' => 20,
            'recordatorio_inicio' => 10,
            'recordatorio_salida' => 15,
            'max_minutos_offline' => 180,
            'jornada_hora_inicio' => '08:00',
            'jornada_hora_fin' => '18:00',
            'jornada_dias' => [1, 2, 3, 4, 5, 6],
        ])->assertOk()->assertJsonPath('data.tolerancia_tardanza', 15);

        $this->getJson('/api/asistencia/flujos?seccion=configuracion')
            ->assertOk()->assertJsonPath('data.configuracion.tolerancia_tardanza', 15);
    }

    public function test_previous_open_shift_is_returned_so_member_can_close_it(): void
    {
        $memberId = Schema::getConnection()->table('integrantes')->value('id');
        $attendanceId = Schema::getConnection()->table('asistencias')->insertGetId([
            'integrante_id' => $memberId,
            'historial_id' => $this->historyId,
            'horario_id' => $this->scheduleId,
            'fecha' => '2026-09-23',
            'hora_inicio_programada' => '08:00:00',
            'hora_fin_programada' => '10:00:00',
            'hora_entrada' => CarbonImmutable::parse('2026-09-23 08:00:00', 'America/Lima'),
            'minutos_programados' => 120,
            'minutos_realizados' => 0,
            'minutos_tardanza' => 0,
            'minutos_salida_anticipada' => 0,
            'minutos_incumplidos' => 120,
            'estado' => 'en_jornada',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonPath('data.0.id', $attendanceId)
            ->assertJsonPath('data.0.fecha', '2026-09-23')
            ->assertJsonPath('data.0.estado', 'en_jornada');
    }

    public function test_scheduler_registers_an_expired_block_without_read_side_effects(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));

        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.estado', 'pendiente');

        $this->assertDatabaseMissing('asistencias', ['fecha' => '2026-09-24']);

        $this->artisan('attendance:process-absences')->assertSuccessful();

        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->assertDatabaseHas('asistencias', [
            'historial_id' => $this->historyId,
            'horario_id' => $this->scheduleId,
            'fecha' => '2026-09-24',
            'estado' => 'falta',
            'minutos_incumplidos' => 120,
        ]);
        $this->assertDatabaseHas('asistencia_incidencias', [
            'tipo' => 'inasistencia',
            'minutos' => 120,
        ]);
    }

    public function test_non_working_day_hides_blocks_and_rejects_attendance_registration(): void
    {
        $this->insertNonWorkingDay('2026-09-24', 'Cierre institucional');

        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->postJson('/api/mi-asistencia/iniciar', [
            'horario_id' => $this->scheduleId,
            'motivo' => 'No debería registrarse.',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('horario_id');

        $this->getJson('/api/asistencia/seguimiento?fecha=2026-09-24')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->assertDatabaseMissing('asistencias', ['fecha' => '2026-09-24']);
    }

    public function test_registering_a_retroactive_non_working_day_annuls_generated_absences(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));
        $this->artisan('attendance:process-absences')->assertSuccessful();

        $this->postJson('/api/asistencia/dias-no-laborables', [
            'fecha' => '2026-09-24',
            'nombre' => 'Cierre institucional extraordinario',
        ])->assertCreated();

        $this->assertDatabaseHas('asistencias', [
            'fecha' => '2026-09-24',
            'estado' => 'anulada',
            'minutos_incumplidos' => 0,
        ]);
        $this->assertDatabaseHas('asistencia_auditoria', ['accion' => 'anulada_feriado']);

        $this->getJson('/api/asistencia/metricas?desde=2026-09-24&hasta=2026-09-24')
            ->assertOk()
            ->assertJsonPath('data.jornadas', 0)
            ->assertJsonPath('data.faltas', 0);
    }

    public function test_official_holiday_can_be_configured_as_laborable_without_losing_its_origin(): void
    {
        $holidayId = $this->insertNonWorkingDay('2026-09-24', 'Feriado oficial de prueba', true);

        $this->patchJson("/api/asistencia/dias-no-laborables/{$holidayId}/tratamiento", [
            'requiere_asistencia' => true,
            'motivo' => 'La organización mantendrá operaciones.',
        ])->assertOk()
            ->assertJsonPath('data.day.es_oficial', 1)
            ->assertJsonPath('data.day.requiere_asistencia', 1);

        $this->getJson('/api/mi-asistencia')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.estado', 'pendiente');

        $this->getJson('/api/asistencia/calendario?desde=2026-09-01&hasta=2026-09-30')
            ->assertOk()
            ->assertJsonPath('data.0.nombre', 'Feriado oficial de prueba')
            ->assertJsonPath('data.0.requiere_asistencia', 1);
    }

    public function test_marking_a_retroactive_non_working_day_as_working_restores_its_absences(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));
        $this->artisan('attendance:process-absences')->assertSuccessful();

        $response = $this->postJson('/api/asistencia/dias-no-laborables', [
            'fecha' => '2026-09-24',
            'nombre' => 'Cierre institucional temporal',
        ])->assertCreated();
        $holidayId = $response->json('data.id');

        $this->assertDatabaseHas('asistencias', [
            'fecha' => '2026-09-24',
            'estado' => 'anulada',
            'minutos_incumplidos' => 0,
        ]);

        $this->patchJson("/api/asistencia/dias-no-laborables/{$holidayId}/tratamiento", [
            'requiere_asistencia' => true,
            'motivo' => 'Se restableció la jornada laboral.',
        ])->assertOk()
            ->assertJsonPath('data.reconciliation.asistencias_restauradas', 1);

        $this->assertDatabaseHas('asistencias', [
            'fecha' => '2026-09-24',
            'estado' => 'falta',
            'minutos_incumplidos' => 120,
            'observacion' => 'Bloque vencido sin registro de entrada.',
        ]);
        $this->assertDatabaseHas('asistencia_auditoria', [
            'accion' => 'corregida',
            'motivo' => 'La fecha fue habilitada nuevamente como día laborable.',
        ]);
        $this->getJson('/api/asistencia/metricas?desde=2026-09-24&hasta=2026-09-24')
            ->assertOk()
            ->assertJsonPath('data.jornadas', 1)
            ->assertJsonPath('data.faltas', 1);
    }

    public function test_peru_holiday_command_syncs_the_official_annual_calendar(): void
    {
        $this->artisan('attendance:sync-peru-holidays', ['year' => '2026'])
            ->assertSuccessful();

        $this->assertDatabaseCount('asistencia_dias_no_laborables', 16);
        $this->assertDatabaseHas('asistencia_dias_no_laborables', [
            'fecha' => '2026-07-23',
            'nombre' => 'Día de la Fuerza Aérea del Perú',
            'tipo' => 'feriado_nacional',
            'es_oficial' => true,
            'requiere_asistencia' => false,
        ]);
        $this->assertDatabaseHas('asistencia_dias_no_laborables', [
            'fecha' => '2026-04-02',
            'nombre' => 'Jueves Santo',
        ]);

        Schema::getConnection()->table('asistencia_dias_no_laborables')
            ->where('fecha', '2026-07-23')
            ->update(['requiere_asistencia' => true]);
        $this->artisan('attendance:sync-peru-holidays', ['year' => '2026'])->assertSuccessful();
        $this->assertDatabaseHas('asistencia_dias_no_laborables', [
            'fecha' => '2026-07-23',
            'es_oficial' => true,
            'requiere_asistencia' => true,
        ]);
    }

    public function test_peru_holiday_sync_annuls_existing_absences_on_past_official_dates(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-01-01 10:01:00', 'America/Lima'));
        $this->artisan('attendance:process-absences')->assertSuccessful();

        $this->assertDatabaseHas('asistencias', [
            'fecha' => '2026-01-01',
            'estado' => 'falta',
            'minutos_incumplidos' => 120,
        ]);

        $this->artisan('attendance:sync-peru-holidays', ['year' => '2026'])
            ->assertSuccessful();

        $this->assertDatabaseHas('asistencias', [
            'fecha' => '2026-01-01',
            'estado' => 'anulada',
            'minutos_incumplidos' => 0,
        ]);
        $this->assertDatabaseHas('asistencia_auditoria', [
            'accion' => 'anulada_feriado',
            'actor_id' => null,
            'motivo' => 'La fecha fue configurada como día no laborable.',
        ]);
    }

    public function test_manager_cannot_access_or_register_personal_attendance_even_with_an_authenticated_session(): void
    {
        Schema::getConnection()->table('integrantes_historial')
            ->where('id', $this->historyId)
            ->update(['tipo_integrante' => 'gerente', 'requiere_asistencia' => false]);

        $this->getJson('/api/mi-asistencia')
            ->assertForbidden()
            ->assertJsonPath('message', 'Los gerentes no registran asistencia.');

        $this->postJson('/api/mi-asistencia/iniciar', ['horario_id' => $this->scheduleId])
            ->assertForbidden();
    }

    public function test_access_total_user_can_track_attendance_from_laravel_backend(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));
        $this->artisan('attendance:process-absences')->assertSuccessful();

        $this->getJson('/api/asistencia/seguimiento?fecha=2026-09-24')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante', 'ANA TORRES')
            ->assertJsonPath('data.0.avatar_path', 'avatars/ana-torres.webp')
            ->assertJsonPath('data.0.cargo_id', $this->cargoId)
            ->assertJsonPath('data.0.cargo', 'Coordinador')
            ->assertJsonPath('data.0.area', 'Operaciones')
            ->assertJsonPath('data.0.estado', 'falta')
            ->assertJsonPath('data.0.incidencias.0.tipo', 'inasistencia');
    }

    public function test_tracking_loads_warning_counts_with_one_grouped_query(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));
        $this->artisan('attendance:process-absences')->assertSuccessful();
        $attendanceId = Schema::getConnection()->table('asistencias')->value('id');

        Schema::getConnection()->table('asistencia_amonestaciones')->insert([
            [
                'asistencia_id' => $attendanceId,
                'justificacion_id' => 100,
                'integrante_id' => Schema::getConnection()->table('integrantes')->value('id'),
                'motivo' => 'Primera amonestaciÃ³n.',
                'estado' => 'activa',
                'gravedad' => 'media',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'asistencia_id' => $attendanceId,
                'justificacion_id' => 101,
                'integrante_id' => Schema::getConnection()->table('integrantes')->value('id'),
                'motivo' => 'Segunda amonestaciÃ³n.',
                'estado' => 'activa',
                'gravedad' => 'grave',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $warningQueries = [];
        DB::listen(function ($query) use (&$warningQueries): void {
            if (str_contains($query->sql, 'asistencia_amonestaciones')) {
                $warningQueries[] = $query->sql;
            }
        });

        $this->getJson('/api/asistencia/seguimiento?fecha=2026-09-24')
            ->assertOk()
            ->assertJsonPath('data.0.amonestaciones', 2);

        $this->assertCount(1, $warningQueries);
        $this->assertStringContainsString('group by', strtolower($warningQueries[0]));
    }

    public function test_warnings_only_list_members_with_an_active_access_account(): void
    {
        $now = CarbonImmutable::now();
        $personWithoutAccessId = (string) Str::uuid();

        Schema::getConnection()->table('personas')->insert([
            'id' => $personWithoutAccessId,
            'nombres' => 'BEATRIZ',
            'apellidos' => 'SIN ACCESO',
            'correo' => 'sin-acceso@example.com',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $memberWithoutAccessId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personWithoutAccessId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrantes_historial')->insert([
            'integrante_id' => $memberWithoutAccessId,
            'tipo_integrante' => 'voluntario',
            'cargo_id' => $this->cargoId,
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-12-31',
            'estado' => 'Activo',
            'requiere_asistencia' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->getJson('/api/asistencia/amonestaciones')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.integrante', 'ANA TORRES')
            ->assertJsonMissing(['integrante' => 'BEATRIZ SIN ACCESO']);

        $inactiveUser = User::query()->create([
            'name' => 'Integrante sin acceso activo',
            'email' => 'sin-acceso@example.com',
            'password' => Hash::make('password'),
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $inactiveUser->id,
            'persona_id' => $personWithoutAccessId,
            'activo' => false,
            'must_change_password' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->getJson('/api/asistencia/amonestaciones')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonMissing(['integrante' => 'BEATRIZ SIN ACCESO']);
    }

    public function test_access_total_user_can_monitor_attendance_metrics(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-24 10:01:00', 'America/Lima'));
        $this->artisan('attendance:process-absences')->assertSuccessful();
        $this->assertDatabaseHas('asistencias', [
            'estado' => 'falta',
        ]);

        $this->getJson('/api/asistencia/metricas?desde=2026-09-01&hasta=2026-09-24')
            ->assertOk()
            ->assertJsonPath('data.integrantes', 1)
            ->assertJsonPath('data.jornadas', 1)
            ->assertJsonPath('data.faltas', 1)
            ->assertJsonPath('data.por_area.0.area', 'Operaciones');
    }

    public function test_tracking_requires_access_total_or_an_attendance_permission(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->roleId)
            ->update(['acceso_total' => false]);

        $this->getJson('/api/asistencia/seguimiento?fecha=2026-09-24')
            ->assertForbidden();
        $this->getJson('/api/asistencia/amonestaciones')
            ->assertForbidden();
    }

    public function test_management_sections_use_their_specific_permissions(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->roleId)
            ->update(['acceso_total' => false]);

        $this->getJson('/api/asistencia/seguimiento?fecha=2026-09-24')->assertForbidden();
        $this->grantRolePermission('asistencia.ver');
        $this->getJson('/api/asistencia/seguimiento?fecha=2026-09-24')->assertOk();
        $this->getJson('/api/asistencia/metricas?desde=2026-09-01&hasta=2026-09-24')->assertForbidden();

        $this->grantRolePermission('asistencia.ver_metricas');
        $this->getJson('/api/asistencia/metricas?desde=2026-09-01&hasta=2026-09-24')->assertOk();

        $this->grantRolePermission('asistencia.gestionar_amonestaciones');
        $this->getJson('/api/asistencia/amonestaciones')->assertOk();

        $this->grantRolePermission('asistencia.gestionar_configuracion', 'global');
        $this->getJson('/api/asistencia/flujos?seccion=configuracion')->assertOk();

        $this->grantRolePermission('asistencia.gestionar_solicitudes');
        $this->getJson('/api/asistencia/flujos?seccion=solicitudes')->assertOk();

        $this->grantRolePermission('asistencia.ver_historial_solicitudes');
        $this->getJson('/api/asistencia/flujos?seccion=historial')->assertOk();
    }

    public function test_personal_attendance_requires_laravel_authentication(): void
    {
        auth()->guard()->forgetUser();

        $this->getJson('/api/mi-asistencia')->assertUnauthorized();
    }

    public function test_area_scoped_permission_cannot_manage_global_attendance_configuration(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->roleId)
            ->update(['acceso_total' => false]);

        $this->grantRolePermission('asistencia.gestionar_configuracion', 'area');

        $this->getJson('/api/asistencia/flujos?seccion=configuracion')->assertForbidden();
    }

    public function test_personal_attendance_is_available_without_role_permissions(): void
    {
        Schema::getConnection()->table('roles')
            ->where('id', $this->roleId)
            ->update(['acceso_total' => false]);

        $this->getJson('/api/mi-asistencia')->assertOk();
        $this->getJson('/api/mi-asistencia/solicitudes')->assertOk();
    }

    private function insertNonWorkingDay(string $date, string $name, bool $official = false): int
    {
        return Schema::getConnection()->table('asistencia_dias_no_laborables')->insertGetId([
            'fecha' => $date,
            'nombre' => $name,
            'tipo' => $official ? 'feriado_nacional' : 'institucional',
            'origen' => $official ? 'calendario_oficial_peru' : 'manual',
            'es_oficial' => $official,
            'requiere_asistencia' => false,
            'activo' => true,
            'registrado_por' => Schema::getConnection()->table('cuentas_acceso')->value('id'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function grantRolePermission(string $code, string $scope = 'area'): int
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

        return $permissionId;
    }

    private function seedParticipant(string $type): void
    {
        $now = CarbonImmutable::now();
        $personId = (string) Str::uuid();
        $accountId = (string) Str::uuid();
        $areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'Operaciones',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->roleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'coordinacion',
            'nombre' => 'Coordinación',
            'acceso_total' => true,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'Coordinador',
            'area_id' => $areaId,
            'rol_id' => $this->roleId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->user = User::query()->create([
            'name' => 'Participante',
            'email' => 'participante@example.com',
            'password' => Hash::make('password'),
        ]);
        Schema::getConnection()->table('personas')->insert([
            'id' => $personId,
            'nombres' => 'ANA',
            'apellidos' => 'TORRES',
            'correo' => 'participante@example.com',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => $accountId,
            'user_id' => $this->user->id,
            'persona_id' => $personId,
            'activo' => true,
            'must_change_password' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $integranteId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personId,
            'estado' => 'Activo',
            'avatar_path' => 'avatars/ana-torres.webp',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->historyId = Schema::getConnection()->table('integrantes_historial')->insertGetId([
            'integrante_id' => $integranteId,
            'tipo_integrante' => $type,
            'cargo_id' => $this->cargoId,
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-12-31',
            'estado' => 'Activo',
            'requiere_asistencia' => $type !== 'gerente',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->scheduleId = Schema::getConnection()->table('integrante_horarios')->insertGetId([
            'historial_id' => $this->historyId,
            'dia_semana' => 4,
            'hora_inicio' => '08:00:00',
            'hora_fin' => '10:00:00',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('personas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('correo')->nullable();
            $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('codigo');
            $table->string('nombre');
            $table->boolean('acceso_total');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('permisos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('rol_permisos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('rol_id');
            $table->unsignedBigInteger('permiso_id');
            $table->string('alcance');
            $table->timestamps();
        });
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('cargos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->unsignedBigInteger('area_id');
            $table->unsignedBigInteger('rol_id');
            $table->boolean('activo');
            $table->timestamps();
        });
        Schema::create('cuentas_acceso', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->uuid('persona_id');
            $table->boolean('activo');
            $table->boolean('must_change_password');
            $table->timestamps();
        });
        Schema::create('integrantes', function (Blueprint $table) {
            $table->id();
            $table->uuid('persona_id');
            $table->string('estado');
            $table->text('avatar_path')->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->timestamps();
        });
        Schema::create('integrantes_historial', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('integrante_id');
            $table->string('tipo_integrante');
            $table->unsignedBigInteger('cargo_id');
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->string('estado');
            $table->boolean('requiere_asistencia')->default(true);
            $table->timestamps();
        });
        Schema::create('integrante_horarios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('historial_id');
            $table->integer('dia_semana');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->timestamps();
        });
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('integrante_id');
            $table->unsignedBigInteger('historial_id');
            $table->unsignedBigInteger('horario_id')->nullable();
            $table->date('fecha');
            $table->time('hora_inicio_programada');
            $table->time('hora_fin_programada');
            $table->timestampTz('hora_entrada')->nullable();
            $table->string('fuente_entrada')->default('online');
            $table->string('entrada_client_event_id')->nullable();
            $table->timestampTz('hora_salida')->nullable();
            $table->string('fuente_salida')->nullable();
            $table->string('salida_client_event_id')->nullable();
            $table->integer('minutos_programados');
            $table->integer('minutos_realizados')->default(0);
            $table->integer('minutos_tardanza')->default(0);
            $table->integer('minutos_salida_anticipada')->default(0);
            $table->integer('minutos_incumplidos')->default(0);
            $table->string('estado');
            $table->text('observacion')->nullable();
            $table->text('descripcion_jornada')->nullable();
            $table->string('evidencia_path')->nullable();
            $table->timestampsTz();
        });
        Schema::create('asistencia_incidencias', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('asistencia_id');
            $table->string('tipo');
            $table->integer('minutos');
            $table->text('descripcion')->nullable();
            $table->uuid('registrado_por')->nullable();
            $table->timestampsTz();
        });
        Schema::create('asistencia_justificaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('asistencia_id');
            $table->string('tipo')->default('general');
            $table->text('motivo');
            $table->string('estado');
            $table->uuid('registrado_por');
            $table->uuid('validado_por')->nullable();
            $table->timestampTz('fecha_registro');
            $table->timestampTz('fecha_validacion')->nullable();
            $table->text('observacion')->nullable();
            $table->string('adjunto_path')->nullable();
        });
        Schema::create('asistencia_amonestaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('asistencia_id');
            $table->unsignedBigInteger('justificacion_id');
            $table->unsignedBigInteger('integrante_id');
            $table->text('motivo');
            $table->string('estado')->default('activa');
            $table->string('gravedad')->default('media');
            $table->uuid('registrado_por')->nullable();
            $table->timestampsTz();
        });
        Schema::create('notificaciones_asistencia', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('asistencia_id')->nullable();
            $table->string('tipo');
            $table->string('titulo');
            $table->text('mensaje');
            $table->string('clave')->unique();
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('dismissed_at')->nullable();
            $table->timestampsTz();
        });
        Schema::create('agenda_reuniones', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->date('fecha');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('estado');
            $table->timestampsTz();
        });
        Schema::create('agenda_reunion_participantes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reunion_id');
            $table->uuid('cuenta_id');
            $table->string('estado');
            $table->timestampsTz();
        });
        Schema::create('asistencia_configuraciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('minutos_antes_inicio')->default(5);
            $table->unsignedSmallInteger('tolerancia_tardanza')->default(10);
            $table->unsignedSmallInteger('umbral_salida_anticipada')->default(1);
            $table->unsignedSmallInteger('minutos_gracia_falta')->default(0);
            $table->unsignedSmallInteger('recordatorio_inicio')->default(5);
            $table->unsignedSmallInteger('recordatorio_salida')->default(10);
            $table->unsignedSmallInteger('max_minutos_offline')->default(120);
            $table->time('jornada_hora_inicio')->nullable();
            $table->time('jornada_hora_fin')->nullable();
            $table->json('jornada_dias')->nullable();
            $table->uuid('actualizado_por')->nullable();
            $table->timestampsTz();
        });
        Schema::create('asistencia_dias_no_laborables', function (Blueprint $table) {
            $table->id();
            $table->date('fecha')->unique();
            $table->string('nombre');
            $table->string('tipo')->default('institucional');
            $table->string('origen')->default('manual');
            $table->boolean('es_oficial')->default(false);
            $table->boolean('requiere_asistencia')->default(false);
            $table->string('norma')->nullable();
            $table->string('fuente_url')->nullable();
            $table->boolean('activo')->default(true);
            $table->uuid('registrado_por')->nullable();
            $table->uuid('modificado_por')->nullable();
            $table->text('motivo_modificacion')->nullable();
            $table->timestampTz('sincronizado_at')->nullable();
            $table->timestampsTz();
        });
        Schema::create('asistencia_permisos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('integrante_id');
            $table->string('tipo');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->text('motivo');
            $table->unsignedInteger('minutos_a_recuperar')->default(0);
            $table->string('estado')->default('pendiente');
            $table->uuid('solicitado_por');
            $table->uuid('resuelto_por')->nullable();
            $table->timestampTz('fecha_resolucion')->nullable();
            $table->text('observacion')->nullable();
            $table->string('adjunto_path')->nullable();
            $table->timestampsTz();
        });
        Schema::create('asistencia_permiso_fechas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('permiso_id');
            $table->date('fecha');
            $table->timestampsTz();
            $table->unique(['permiso_id', 'fecha']);
        });
        Schema::create('asistencia_recuperaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('permiso_id')->nullable();
            $table->unsignedBigInteger('justificacion_id')->nullable();
            $table->date('fecha');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->unsignedInteger('minutos');
            $table->string('estado')->default('programada');
            $table->timestampTz('hora_entrada_real')->nullable();
            $table->timestampTz('hora_salida_real')->nullable();
            $table->unsignedInteger('minutos_realizados')->default(0);
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('asistencia_id')->nullable();
            $table->timestampsTz();
        });
        Schema::create('asistencia_apelaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('amonestacion_id');
            $table->unsignedBigInteger('integrante_id');
            $table->string('tipo')->default('general');
            $table->text('motivo');
            $table->string('adjunto_path')->nullable();
            $table->string('estado')->default('pendiente');
            $table->uuid('solicitado_por');
            $table->uuid('resuelto_por')->nullable();
            $table->timestampTz('fecha_resolucion')->nullable();
            $table->text('observacion')->nullable();
            $table->timestampsTz();
        });
        Schema::create('asistencia_auditoria', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('asistencia_id');
            $table->string('accion');
            $table->uuid('actor_id')->nullable();
            $table->json('datos_anteriores')->nullable();
            $table->json('datos_nuevos')->nullable();
            $table->text('motivo')->nullable();
            $table->timestampsTz();
        });
    }
}
