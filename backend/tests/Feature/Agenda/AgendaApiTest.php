<?php

namespace Tests\Feature\Agenda;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AgendaApiTest extends TestCase
{
    private User $organizer;

    private User $guest;

    private string $organizerAccountId;

    private string $guestAccountId;

    private string $meetingDate;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedDirectory();
        Sanctum::actingAs($this->organizer);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_it_lists_the_active_directory_and_current_person(): void
    {
        $this->getJson('/api/agenda/people')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.tipo_cuenta', 'integrante')
            ->assertJsonPath('data.0.area_id', 1)
            ->assertJsonPath('data.0.cargo_id', 1)
            ->assertJsonPath('data.0.historial_id', 1)
            ->assertJsonCount(1, 'data.0.horarios');

        $this->getJson('/api/agenda/me')
            ->assertOk()
            ->assertJsonPath('data.id', $this->organizerAccountId)
            ->assertJsonPath('data.nombre', 'ANA ORGANIZADORA')
            ->assertJsonPath('data.area', 'ADMINISTRACIÓN');
    }

    public function test_agenda_does_not_require_a_role_permission_and_only_lists_own_meetings(): void
    {
        $now = now();
        $foreignMeetingId = Schema::getConnection()->table('agenda_reuniones')->insertGetId([
            'titulo' => 'REUNIÓN AJENA',
            'descripcion' => null,
            'fecha' => $this->meetingDate,
            'hora_inicio' => '14:00',
            'hora_fin' => '15:00',
            'modalidad' => 'virtual',
            'ubicacion' => null,
            'enlace' => null,
            'estado' => 'confirmada',
            'creada_por' => $this->guestAccountId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('agenda_reunion_participantes')->insert([
            'reunion_id' => $foreignMeetingId,
            'cuenta_id' => $this->guestAccountId,
            'estado' => 'aceptada',
            'es_organizador' => true,
            'respondido_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->getJson('/api/agenda/meetings')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonMissing(['id' => $foreignMeetingId]);
    }

    public function test_meeting_is_created_and_confirmed_when_every_guest_accepts(): void
    {
        $guestPersonId = Schema::getConnection()->table('cuentas_acceso')
            ->where('id', $this->guestAccountId)
            ->value('persona_id');
        Schema::getConnection()->table('integrantes')
            ->where('persona_id', $guestPersonId)
            ->update(['avatar_path' => 'avatars/invitada.webp']);

        $created = $this->postJson('/api/agenda/meetings', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('data.estado', 'pendiente')
            ->assertJsonPath('data.soy_organizador', true)
            ->assertJsonPath('data.mi_estado', 'aceptada')
            ->assertJsonPath('data.participantes.1.avatar_path', 'avatars/invitada.webp')
            ->assertJsonPath(
                'data.participantes.1.avatar_url',
                fn ($url) => is_string($url) && str_contains($url, 'avatars/invitada.webp')
            )
            ->assertJsonCount(2, 'data.participantes');

        $meetingId = $created->json('data.id');

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->guest->id,
            'tipo' => 'agenda_solicitud_reunion',
            'titulo' => 'Nueva solicitud de reunión',
            'clave' => "institucional-{$this->guest->id}-agenda-solicitud-{$meetingId}",
        ]);
        $this->assertDatabaseMissing('notificaciones_asistencia', [
            'user_id' => $this->organizer->id,
            'tipo' => 'agenda_solicitud_reunion',
        ]);

        Sanctum::actingAs($this->guest);

        $this->getJson('/api/notificaciones')
            ->assertOk()
            ->assertJsonPath('data.0.tipo', 'agenda_solicitud_reunion')
            ->assertJsonPath('data.0.titulo', 'Nueva solicitud de reunión');

        $this->getJson('/api/agenda/meetings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.mi_estado', 'pendiente')
            ->assertJsonPath('data.0.soy_organizador', false);

        $this->patchJson("/api/agenda/meetings/{$meetingId}/response", ['respuesta' => 'aceptada'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'confirmada')
            ->assertJsonPath('data.mi_estado', 'aceptada');

        $this->assertDatabaseHas('agenda_reuniones', ['id' => $meetingId, 'estado' => 'confirmada']);
        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->guest->id,
            'tipo' => 'agenda_cambio_confirmada',
            'clave' => "institucional-{$this->guest->id}-agenda-cambio-{$meetingId}-confirmada",
        ]);
    }

    public function test_meeting_must_fit_every_participants_availability(): void
    {
        $payload = $this->validPayload();
        $payload['hora_inicio'] = '07:00';
        $payload['hora_fin'] = '08:00';

        $this->postJson('/api/agenda/meetings', $payload)
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.fecha.0',
                'La fecha u hora está fuera de la disponibilidad común seleccionada.'
            );

        $this->assertDatabaseCount('agenda_reuniones', 0);
    }

    public function test_meeting_must_start_after_the_current_time(): void
    {
        CarbonImmutable::setTestNow(
            CarbonImmutable::parse($this->meetingDate, 'America/Lima')->setTime(10, 0)
        );

        $pastPayload = $this->validPayload();
        $pastPayload['hora_inicio'] = '09:00';
        $pastPayload['hora_fin'] = '11:00';

        $this->postJson('/api/agenda/meetings', $pastPayload)
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.hora_inicio.0',
                'La reunión debe programarse para una hora posterior a la hora actual.'
            );

        $currentTimePayload = $this->validPayload();
        $currentTimePayload['hora_inicio'] = '10:00';
        $currentTimePayload['hora_fin'] = '11:00';

        $this->postJson('/api/agenda/meetings', $currentTimePayload)
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.hora_inicio.0',
                'La reunión debe programarse para una hora posterior a la hora actual.'
            );

        $futurePayload = $this->validPayload();
        $futurePayload['hora_inicio'] = '10:15';
        $futurePayload['hora_fin'] = '11:00';

        $this->postJson('/api/agenda/meetings', $futurePayload)
            ->assertCreated();
    }

    public function test_rejected_invitation_notifies_the_agenda_change(): void
    {
        $meetingId = $this->postJson('/api/agenda/meetings', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->guest);
        $this->patchJson("/api/agenda/meetings/{$meetingId}/response", [
            'respuesta' => 'rechazada',
        ])->assertOk()
            ->assertJsonPath('data.estado', 'rechazada');

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->organizer->id,
            'tipo' => 'agenda_cambio_rechazada',
            'clave' => "institucional-{$this->organizer->id}-agenda-cambio-{$meetingId}-rechazada",
        ]);
    }

    public function test_confirmed_meetings_cannot_overlap_for_any_attendee(): void
    {
        $meetingId = $this->postJson('/api/agenda/meetings', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->guest);
        $this->patchJson("/api/agenda/meetings/{$meetingId}/response", ['respuesta' => 'aceptada'])
            ->assertOk();

        Sanctum::actingAs($this->organizer);
        $payload = $this->validPayload();
        $payload['titulo'] = 'SEGUNDA REUNIÓN';
        $payload['hora_inicio'] = '09:30';
        $payload['hora_fin'] = '10:30';

        $this->postJson('/api/agenda/meetings', $payload)
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.hora_inicio.0',
                'No se puede crear la solicitud. Ya tienen una reunión confirmada en ese horario: ANA ORGANIZADORA, BRUNO INVITADO'
            );

        $this->assertDatabaseCount('agenda_reuniones', 1);
    }

    public function test_only_the_organizer_can_cancel_an_active_meeting(): void
    {
        $meetingId = $this->postJson('/api/agenda/meetings', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->guest);
        $this->patchJson("/api/agenda/meetings/{$meetingId}/cancel")->assertForbidden();

        Sanctum::actingAs($this->organizer);
        $this->patchJson("/api/agenda/meetings/{$meetingId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.estado', 'cancelada');

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->guest->id,
            'tipo' => 'agenda_evento_cancelado',
            'clave' => "institucional-{$this->guest->id}-agenda-cambio-{$meetingId}-cancelada",
        ]);
    }

    public function test_agenda_generates_upcoming_and_same_day_reminders_without_duplicates(): void
    {
        $meetingId = $this->postJson('/api/agenda/meetings', $this->validPayload())
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($this->guest);
        $this->patchJson("/api/agenda/meetings/{$meetingId}/response", ['respuesta' => 'aceptada'])
            ->assertOk();

        $meetingDate = CarbonImmutable::parse($this->meetingDate, 'America/Lima');
        CarbonImmutable::setTestNow($meetingDate->subDay()->setTime(8, 0));
        $this->artisan('notifications:generate-agenda-reminders')->assertSuccessful();
        $this->artisan('notifications:generate-agenda-reminders')->assertSuccessful();

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->guest->id,
            'tipo' => 'agenda_evento_proximo',
        ]);
        $this->assertSame(1, Schema::getConnection()->table('notificaciones_asistencia')
            ->where('user_id', $this->guest->id)
            ->where('tipo', 'agenda_evento_proximo')
            ->count());

        CarbonImmutable::setTestNow($meetingDate->setTime(8, 0));
        $this->artisan('notifications:generate-agenda-reminders')->assertSuccessful();

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->guest->id,
            'tipo' => 'agenda_actividad_hoy',
        ]);
    }

    public function test_it_separates_history_and_calculates_user_meeting_metrics(): void
    {
        $pastDate = CarbonImmutable::now('America/Lima')->subDays(2)->toDateString();
        $confirmedOrganized = $this->insertMeeting(
            $pastDate,
            '09:00',
            '10:30',
            'confirmada',
            'virtual',
            $this->organizerAccountId,
        );
        $confirmedAsGuest = $this->insertMeeting(
            $pastDate,
            '11:00',
            '12:00',
            'confirmada',
            'presencial',
            $this->guestAccountId,
        );
        $cancelled = $this->insertMeeting(
            $this->meetingDate,
            '14:00',
            '15:00',
            'cancelada',
            'virtual',
            $this->organizerAccountId,
        );
        $future = $this->insertMeeting(
            $this->meetingDate,
            '16:00',
            '17:00',
            'confirmada',
            'virtual',
            $this->organizerAccountId,
        );

        $this->getJson('/api/agenda/history')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['id' => $confirmedOrganized, 'estado' => 'confirmada'])
            ->assertJsonFragment(['id' => $confirmedAsGuest, 'estado' => 'confirmada'])
            ->assertJsonFragment(['id' => $cancelled, 'estado' => 'cancelada'])
            ->assertJsonMissing(['id' => $future]);

        $this->getJson('/api/agenda/meetings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $future);

        $this->getJson('/api/agenda/metrics')
            ->assertOk()
            ->assertJsonPath('data.total_reuniones', 2)
            ->assertJsonPath('data.organizadas', 1)
            ->assertJsonPath('data.como_participante', 1)
            ->assertJsonPath('data.horas_totales', 2.5)
            ->assertJsonPath('data.promedio_minutos', 75)
            ->assertJsonPath('data.colaboradores', 1)
            ->assertJsonPath('data.por_mes.0.total', 2);
    }

    private function insertMeeting(
        string $date,
        string $start,
        string $end,
        string $status,
        string $modality,
        string $organizerId,
    ): int {
        $now = now();
        $meetingId = Schema::getConnection()->table('agenda_reuniones')->insertGetId([
            'titulo' => 'REUNIÃ“N HISTÃ“RICA',
            'descripcion' => null,
            'fecha' => $date,
            'hora_inicio' => $start,
            'hora_fin' => $end,
            'modalidad' => $modality,
            'ubicacion' => null,
            'enlace' => null,
            'estado' => $status,
            'creada_por' => $organizerId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::getConnection()->table('agenda_reunion_participantes')->insert([
            [
                'reunion_id' => $meetingId,
                'cuenta_id' => $organizerId,
                'estado' => 'aceptada',
                'es_organizador' => true,
                'respondido_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'reunion_id' => $meetingId,
                'cuenta_id' => $organizerId === $this->organizerAccountId
                    ? $this->guestAccountId
                    : $this->organizerAccountId,
                'estado' => 'aceptada',
                'es_organizador' => false,
                'respondido_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        return $meetingId;
    }

    private function validPayload(): array
    {
        return [
            'titulo' => 'REUNIÓN DE EQUIPO',
            'descripcion' => 'Seguimiento semanal',
            'fecha' => $this->meetingDate,
            'hora_inicio' => '09:00',
            'hora_fin' => '10:00',
            'modalidad' => 'virtual',
            'ubicacion' => '',
            'enlace' => 'https://meet.example.com/equipo',
            'participantes' => [$this->guestAccountId],
        ];
    }

    private function seedDirectory(): void
    {
        $now = now();
        $meetingDay = CarbonImmutable::now('America/Lima')->addDays(2)->startOfDay();
        $this->meetingDate = $meetingDay->format('Y-m-d');
        $areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'ADMINISTRACIÓN',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $roleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'integrante',
            'nombre' => 'Integrante',
            'acceso_total' => false,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'COORDINADOR',
            'area_id' => $areaId,
            'rol_id' => $roleId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        [$this->organizer, $this->organizerAccountId] = $this->createMember(
            'ana@example.com',
            'ANA',
            'ORGANIZADORA',
            $cargoId,
            $meetingDay->isoWeekday(),
        );
        [$this->guest, $this->guestAccountId] = $this->createMember(
            'bruno@example.com',
            'BRUNO',
            'INVITADO',
            $cargoId,
            $meetingDay->isoWeekday(),
        );
    }

    private function createMember(
        string $email,
        string $firstName,
        string $lastName,
        int $cargoId,
        int $weekDay,
    ): array {
        $now = now();
        $personId = (string) Str::uuid();
        $accountId = (string) Str::uuid();
        $user = User::query()->create([
            'name' => $firstName,
            'email' => $email,
            'password' => Hash::make('password'),
        ]);
        Schema::getConnection()->table('personas')->insert([
            'id' => $personId,
            'nombres' => $firstName,
            'apellidos' => $lastName,
            'correo' => $email,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => $accountId,
            'user_id' => $user->id,
            'persona_id' => $personId,
            'activo' => true,
            'must_change_password' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $memberId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personId,
            'estado' => 'Activo',
            'avatar_path' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $historyId = Schema::getConnection()->table('integrantes_historial')->insertGetId([
            'integrante_id' => $memberId,
            'tipo_integrante' => 'voluntario',
            'cargo_id' => $cargoId,
            'estado' => 'Activo',
            'fecha_inicio' => now()->subMonth()->toDateString(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrante_horarios')->insert([
            'historial_id' => $historyId,
            'dia_semana' => $weekDay,
            'hora_inicio' => '08:00',
            'hora_fin' => '18:00',
            'created_at' => $now,
            'updated_at' => $now,
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
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('codigo');
            $table->string('nombre');
            $table->boolean('acceso_total');
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
        Schema::create('integrantes_historial', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('integrante_id');
            $table->string('tipo_integrante');
            $table->unsignedBigInteger('cargo_id');
            $table->string('estado');
            $table->date('fecha_inicio')->nullable();
            $table->timestamps();
        });
        Schema::create('integrante_horarios', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('historial_id');
            $table->integer('dia_semana');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->timestamps();
        });
        Schema::create('agenda_reuniones', function (Blueprint $table): void {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->date('fecha');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('modalidad');
            $table->text('ubicacion')->nullable();
            $table->text('enlace')->nullable();
            $table->string('estado');
            $table->uuid('creada_por');
            $table->timestamps();
        });
        Schema::create('agenda_reunion_participantes', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('reunion_id');
            $table->uuid('cuenta_id');
            $table->string('estado');
            $table->boolean('es_organizador');
            $table->timestamp('respondido_at')->nullable();
            $table->timestamps();
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
