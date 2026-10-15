<?php

namespace Tests\Feature\GestionProyectos;

use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use App\Services\Notifications\ConvocatoriaNotificationService;
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

class ConvocatoriaApiTest extends TestCase
{
    private User $user;

    private int $areaId;

    private int $sourceId;

    private int $integranteId;

    private int $equipoId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createSchema();
        $this->seedIdentity();
        Sanctum::actingAs($this->user);
    }

    public function test_access_total_user_can_create_a_source_and_manage_a_call(): void
    {
        $source = $this->postJson('/api/gestion-proyectos/fuentes-financiamiento', [
            'nombre' => ' Fondo Verde ',
            'tipo' => 'multilateral',
            'sitio_web' => 'https://fondo.example.org',
        ])->assertCreated()
            ->assertJsonPath('data.nombre', 'Fondo Verde')
            ->assertJsonPath('data.activo', true);

        $payload = $this->validPayload($source->json('data.id'));
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $payload)
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Fondo de Innovación Ambiental')
            ->assertJsonPath('data.area_id', $this->areaId)
            ->assertJsonPath('data.estado', 'registrada')
            ->assertJsonPath('data.etapa', 'deteccion')
            ->assertJsonPath('data.requiere_alianza', 'si')
            ->assertJsonPath('data.tipo_alianza', 'alianza_comunitaria')
            ->assertJsonPath('data.lleva_cofinanciamiento', true)
            ->assertJsonPath('data.tipo_organizacion_admitida', 'ongs')
            ->assertJsonPath('data.tiempo_postulacion', 'con_limite')
            ->assertJsonPath('data.fuente.nombre', 'Fondo Verde')
            ->assertJsonPath('data.registrante.persona.nombres', 'ADMINISTRADOR')
            ->assertJsonCount(0, 'data.evaluaciones')
            ->assertJsonCount(0, 'data.postulaciones');

        $id = $created->json('data.id');

        $this->assertDatabaseHas('gp_convocatorias', [
            'id' => $id,
            'area_id' => $this->areaId,
            'estado' => 'registrada',
            'tipo_proyecto' => 'piloto',
            'tipo_financiamiento' => 'cofinanciamiento',
            'lleva_cofinanciamiento' => true,
            'tipo_organizacion_admitida' => 'ongs',
        ]);
        $this->assertDatabaseHas('gp_convocatoria_historial', [
            'convocatoria_id' => $id,
            'accion' => 'creada',
        ]);

        $this->getJson('/api/gestion-proyectos/convocatorias')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/gestion-proyectos/convocatorias/{$id}")
            ->assertOk()
            ->assertJsonPath('data.historial.0.accion', 'creada');

        $this->putJson("/api/gestion-proyectos/convocatorias/{$id}", [
            ...$payload,
            'nombre' => 'Fondo Ambiental Actualizado',
        ])->assertOk()
            ->assertJsonPath('data.nombre', 'Fondo Ambiental Actualizado');

        $this->assertDatabaseHas('gp_convocatoria_historial', [
            'convocatoria_id' => $id,
            'accion' => 'editada',
        ]);
    }

    public function test_access_total_user_sees_all_teams_and_calls_in_every_process(): void
    {
        $now = now();
        $accountId = Schema::getConnection()->table('cuentas_acceso')->value('id');
        $otherAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'OTRA ÁREA',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $otherTeamId = Schema::getConnection()->table('gp_equipos')->insertGetId([
            'area_id' => $otherAreaId,
            'nombre' => 'Equipo externo',
            'activo' => true,
            'creado_por' => $accountId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $calls = collect([
            ['Detección externa', 'registrada', 'deteccion'],
            ['Segundo filtro externo', 'en_revision', 'segundo_filtro'],
            ['Aprobación externa', 'en_revision', 'aprobacion'],
            ['Postulación externa', 'aprobada', 'postulacion'],
            ['Seguimiento externo', 'enviada', 'seguimiento'],
            ['Cierre externo', 'cerrada', 'cierre'],
        ])->mapWithKeys(function (array $process) use ($accountId, $now, $otherAreaId, $otherTeamId): array {
            $id = Schema::getConnection()->table('gp_convocatorias')->insertGetId([
                ...$this->validPayload($this->sourceId),
                'nombre' => $process[0],
                'area_id' => $otherAreaId,
                'equipo_id' => $otherTeamId,
                'registrada_por' => $accountId,
                'fecha_registro' => $now->toDateString(),
                'estado' => $process[1],
                'etapa' => $process[2],
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return [$process[2] => $id];
        });

        $postulationId = Schema::getConnection()->table('gp_postulaciones')->insertGetId([
            'convocatoria_id' => $calls['seguimiento'],
            'estado' => 'enviada',
            'fecha_inicio' => $now,
            'fecha_envio' => $now->toDateString(),
            'enviada_por' => $accountId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('gp_postulacion_seguimientos')->insert([
            'postulacion_id' => $postulationId,
            'estado' => 'en_seguimiento',
            'fecha_inicio' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->getJson('/api/gestion-proyectos/equipos')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => $otherTeamId, 'nombre' => 'Equipo externo']);

        $response = $this->getJson('/api/gestion-proyectos/convocatorias')
            ->assertOk()
            ->assertJsonCount(6, 'data');
        foreach ($calls as $id) {
            $response->assertJsonFragment(['id' => $id, 'primer_filtro_autorizado' => true]);
        }

        $this->getJson("/api/gestion-proyectos/convocatorias/{$calls['deteccion']}")
            ->assertOk()
            ->assertJsonPath('data.primer_filtro_autorizado', true);
        $this->getJson("/api/gestion-proyectos/convocatorias/{$calls['deteccion']}/primer-filtro")
            ->assertOk();
        $this->getJson("/api/gestion-proyectos/convocatorias/{$calls['seguimiento']}/postulacion")
            ->assertOk()
            ->assertJsonPath('data.id', $postulationId);
        $this->getJson("/api/gestion-proyectos/postulaciones/{$postulationId}/seguimiento")
            ->assertOk()
            ->assertJsonPath('data.estado', 'en_seguimiento');
    }

    public function test_invalid_values_and_duplicate_sources_are_rejected(): void
    {
        $this->postJson('/api/gestion-proyectos/fuentes-financiamiento', [
            'nombre' => 'Fuente base',
        ])->assertUnprocessable()
            ->assertJsonPath('errors.nombre.0', 'Ya existe una fuente de financiamiento con ese nombre.');

        $this->postJson('/api/gestion-proyectos/convocatorias', [
            ...$this->validPayload($this->sourceId),
            'tipo_proyecto' => 'invalido',
            'territorio' => 'Europa',
            'beneficiario_ideal' => 'empresas',
            'tipo_alianza' => 'consorcio',
            'tipo_organizacion_admitida' => 'cooperativas',
            'tiempo_postulacion' => 'indefinido',
            'monto_minimo' => 500,
            'monto_maximo' => 100,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors([
                'tipo_proyecto',
                'territorio',
                'beneficiario_ideal',
                'tipo_alianza',
                'tipo_organizacion_admitida',
                'tiempo_postulacion',
                'monto_maximo',
            ]);
    }

    public function test_convocatoria_archive_restore_and_state_guards_are_historical(): void
    {
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertCreated();
        $id = $created->json('data.id');

        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/archivar", [
            'motivo' => 'Archivo prematuro.',
        ])->assertUnprocessable();

        Schema::getConnection()->table('gp_convocatorias')->where('id', $id)->update([
            'estado' => 'cerrada',
            'etapa' => 'cierre',
            'resultado_final' => 'no_adjudicada',
            'cerrada_at' => now(),
            'cerrada_por' => Schema::getConnection()->table('cuentas_acceso')
                ->where('user_id', $this->user->id)->value('id'),
        ]);

        $this->putJson("/api/gestion-proyectos/convocatorias/{$id}", $this->validPayload($this->sourceId))
            ->assertUnprocessable();
        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/primer-filtro", [
            'evaluaciones' => $this->eligibleEvaluations(),
        ])->assertUnprocessable();

        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/archivar", [
            'motivo' => 'Expediente no aprobado y revisado.',
        ])->assertOk()->assertJsonPath('data.estado', 'archivada');
        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/restaurar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'cerrada')
            ->assertJsonPath('data.resultado_final', 'no_adjudicada');

        $this->assertDatabaseHas('gp_convocatorias', [
            'id' => $id,
            'archivada_at' => null,
        ]);
        foreach (['archivada', 'restaurada'] as $action) {
            $this->assertDatabaseHas('gp_convocatoria_historial', [
                'convocatoria_id' => $id,
                'accion' => $action,
            ]);
        }
    }

    public function test_an_unassigned_member_cannot_register_a_call(): void
    {
        Schema::getConnection()->table('gp_equipo_integrantes')->where('integrante_id', $this->integranteId)->delete();

        $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertUnprocessable()
            ->assertJsonPath('errors.equipo.0', 'Debes estar asignado a un equipo antes de registrar una convocatoria.');
    }

    public function test_team_endpoints_expose_the_leader_and_registration_context(): void
    {
        $this->getJson('/api/gestion-proyectos/equipos')
            ->assertOk()
            ->assertJsonPath('data.0.id', $this->equipoId)
            ->assertJsonPath('data.0.lider.id', $this->integranteId)
            ->assertJsonPath('data.0.lider.avatar_path', 'avatars/administrador.webp');

        $this->getJson('/api/gestion-proyectos/equipos/integrantes-disponibles')
            ->assertOk()
            ->assertJsonPath('data.0.equipo_id', $this->equipoId)
            ->assertJsonPath('data.0.rol_equipo', 'lider')
            ->assertJsonPath('data.0.avatar_path', 'avatars/administrador.webp');

        $this->getJson('/api/gestion-proyectos/equipos/contexto')
            ->assertOk()
            ->assertJsonPath('data.puede_registrar', true)
            ->assertJsonPath('data.es_lider', true)
            ->assertJsonPath('data.equipo.id', $this->equipoId);
    }

    public function test_manager_can_create_a_team_and_assign_its_leader(): void
    {
        Schema::getConnection()->table('gp_equipo_integrantes')->delete();
        Schema::getConnection()->table('gp_equipos')->delete();

        $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Equipo de alianzas',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [],
        ])->assertCreated()
            ->assertJsonPath('data.nombre', 'Equipo de alianzas')
            ->assertJsonPath('data.lider.id', $this->integranteId)
            ->assertJsonCount(0, 'data.integrantes');

        $this->assertDatabaseHas('gp_equipo_integrantes', [
            'integrante_id' => $this->integranteId,
            'rol' => 'lider',
        ]);
    }

    public function test_team_can_be_deactivated_and_reactivated(): void
    {
        $this->patchJson("/api/gestion-proyectos/equipos/{$this->equipoId}/desactivar")
            ->assertOk()
            ->assertJsonPath('data.activo', false);

        $this->getJson('/api/gestion-proyectos/equipos/contexto')
            ->assertOk()
            ->assertJsonPath('data.puede_registrar', false)
            ->assertJsonPath('data.es_lider', false)
            ->assertJsonPath('data.equipo', null);

        $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertUnprocessable()
            ->assertJsonPath('errors.equipo.0', 'Debes estar asignado a un equipo antes de registrar una convocatoria.');

        $this->patchJson("/api/gestion-proyectos/equipos/{$this->equipoId}/reactivar")
            ->assertOk()
            ->assertJsonPath('data.activo', true);
    }

    public function test_inactive_team_rejects_new_member_assignments(): void
    {
        $memberId = $this->createEligibleMember('NUEVO MIEMBRO', [
            ['dia_semana' => 1, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);
        Schema::getConnection()->table('gp_equipos')->where('id', $this->equipoId)->update(['activo' => false]);

        $this->putJson("/api/gestion-proyectos/equipos/{$this->equipoId}", [
            'nombre' => 'Equipo principal',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [$memberId],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['integrante_ids']);

        $this->assertDatabaseMissing('gp_equipo_integrantes', [
            'equipo_id' => $this->equipoId,
            'integrante_id' => $memberId,
        ]);
    }

    public function test_leader_change_is_available_in_member_history(): void
    {
        $newLeaderId = $this->createEligibleMember('NUEVO LIDER', [
            ['dia_semana' => 1, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);
        $leaderCargoId = Schema::getConnection()->table('integrantes_historial')
            ->where('integrante_id', $this->integranteId)
            ->value('cargo_id');
        Schema::getConnection()->table('integrantes_historial')
            ->where('integrante_id', $newLeaderId)
            ->update(['cargo_id' => $leaderCargoId]);

        $this->putJson("/api/gestion-proyectos/equipos/{$this->equipoId}", [
            'nombre' => 'Equipo principal',
            'lider_integrante_id' => $newLeaderId,
            'integrante_ids' => [],
        ])->assertOk()
            ->assertJsonPath('data.lider.id', $newLeaderId);

        $this->getJson("/api/gestion-proyectos/equipos/{$this->equipoId}/historial")
            ->assertOk()
            ->assertJsonFragment([
                'accion' => 'retirado',
                'rol_anterior' => 'lider',
            ])
            ->assertJsonFragment([
                'accion' => 'asignado',
                'rol_nuevo' => 'lider',
            ]);
    }

    public function test_create_and_edit_team_permissions_are_independent(): void
    {
        $this->grantPermissions(['gp.equipos.crear']);
        Schema::getConnection()->table('gp_equipo_integrantes')->delete();
        Schema::getConnection()->table('gp_equipos')->delete();

        $created = $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Equipo con permiso de creación',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [],
        ])->assertCreated();

        $this->putJson("/api/gestion-proyectos/equipos/{$created->json('data.id')}", [
            'nombre' => 'Edición no autorizada',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [],
        ])->assertForbidden();

        $this->grantPermissions(['gp.equipos.editar']);

        $this->getJson('/api/gestion-proyectos/equipos/integrantes-disponibles')->assertOk();
        $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Creación no autorizada',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [],
        ])->assertForbidden();
        $this->putJson("/api/gestion-proyectos/equipos/{$created->json('data.id')}", [
            'nombre' => 'Equipo editado',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [],
        ])->assertOk()->assertJsonPath('data.nombre', 'Equipo editado');
    }

    public function test_team_metrics_have_their_own_permission(): void
    {
        $this->grantPermissions(['gp.equipos.ver_metricas']);

        $this->getJson('/api/gestion-proyectos/equipos/metricas')
            ->assertOk()
            ->assertJsonPath('data.equipos.0.id', $this->equipoId)
            ->assertJsonCount(0, 'data.convocatorias');
        $this->getJson('/api/gestion-proyectos/equipos')->assertForbidden();

        $this->grantPermissions([]);
        $this->getJson('/api/gestion-proyectos/equipos/metricas')->assertForbidden();
    }

    public function test_team_candidates_and_assignments_are_limited_to_project_management_area(): void
    {
        Schema::getConnection()->table('gp_equipo_integrantes')->delete();
        Schema::getConnection()->table('gp_equipos')->delete();

        $now = now();
        $validMemberId = $this->createEligibleMember('MIEMBRO VALIDO', [
            ['dia_semana' => 1, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);
        $secondLeaderId = $this->createEligibleMember('SEGUNDO LIDER', [
            ['dia_semana' => 1, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);
        Schema::getConnection()->table('integrantes_historial')
            ->where('integrante_id', $secondLeaderId)
            ->update([
                'cargo_id' => Schema::getConnection()->table('cargos')
                    ->where('nombre', 'LÍDER DE GESTIÓN DE PROYECTOS')
                    ->value('id'),
            ]);
        $otherAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'MARKETING',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $otherCargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'COORDINADOR DE MARKETING',
            'area_id' => $otherAreaId,
            'rol_id' => Schema::getConnection()->table('roles')->value('id'),
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $otherAreaMemberId = $this->createEligibleMember('MARKETING', [
            ['dia_semana' => 1, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);
        Schema::getConnection()->table('integrantes_historial')
            ->where('integrante_id', $otherAreaMemberId)
            ->update(['cargo_id' => $otherCargoId]);

        $coordinatorRoleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'coordinador_area',
            'nombre' => 'COORDINADOR DE ÁREA',
            'acceso_total' => false,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $coordinatorCargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'COORDINADOR DE GESTIÓN DE PROYECTOS',
            'area_id' => $this->areaId,
            'rol_id' => $coordinatorRoleId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $wrongRoleMemberId = $this->createEligibleMember('COORDINADOR', [
            ['dia_semana' => 1, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);
        Schema::getConnection()->table('integrantes_historial')
            ->where('integrante_id', $wrongRoleMemberId)
            ->update(['cargo_id' => $coordinatorCargoId]);

        $this->getJson('/api/gestion-proyectos/equipos/integrantes-disponibles')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $this->integranteId,
                'cargo' => 'LÍDER DE GESTIÓN DE PROYECTOS',
            ])
            ->assertJsonFragment([
                'id' => $validMemberId,
                'cargo' => 'MIEMBRO DE GESTIÓN DE PROYECTOS',
            ])
            ->assertJsonMissing(['id' => $otherAreaMemberId])
            ->assertJsonMissing(['id' => $wrongRoleMemberId]);

        $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Equipo con cargos invertidos',
            'lider_integrante_id' => $validMemberId,
            'integrante_ids' => [$this->integranteId],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['lider_integrante_id']);

        $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Equipo con líder como integrante',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [$secondLeaderId],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['integrante_ids']);

        $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Equipo fuera de área',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [$otherAreaMemberId],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['integrante_ids']);
    }

    public function test_team_recommendations_expose_schedules_and_reject_members_without_overlap(): void
    {
        Schema::getConnection()->table('gp_equipo_integrantes')->delete();
        Schema::getConnection()->table('gp_equipos')->delete();

        $compatibleId = $this->createEligibleMember('COMPATIBLE', [
            ['dia_semana' => 1, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);
        $incompatibleId = $this->createEligibleMember('INCOMPATIBLE', [
            ['dia_semana' => 2, 'hora_inicio' => '10:00', 'hora_fin' => '12:00'],
        ]);

        $this->getJson('/api/gestion-proyectos/equipos/integrantes-disponibles')
            ->assertOk()
            ->assertJsonFragment([
                'nombre' => 'COMPATIBLE PRUEBA',
                'dia_semana' => 1,
                'hora_inicio' => '10:00',
                'hora_fin' => '12:00',
            ]);

        $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Equipo incompatible',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [$incompatibleId],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['integrante_ids']);

        $this->postJson('/api/gestion-proyectos/equipos', [
            'nombre' => 'Equipo compatible',
            'lider_integrante_id' => $this->integranteId,
            'integrante_ids' => [$compatibleId],
        ])->assertCreated()
            ->assertJsonPath('data.integrantes.0.id', $compatibleId);
    }

    public function test_only_the_team_leader_can_complete_the_first_filter(): void
    {
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertCreated()
            ->assertJsonPath('data.equipo.id', $this->equipoId);

        $evaluations = collect([
            'internacional', 'organizacion_admitida', 'alianzas', 'tipo_proyecto',
            'territorio', 'fecha_cierre', 'alineacion_sectorial', 'rango_financiamiento',
        ])->map(fn ($code) => ['criterio_codigo' => $code, 'estado_revision' => 'cumple'])->all();

        $this->postJson("/api/gestion-proyectos/convocatorias/{$created->json('data.id')}/primer-filtro", [
            'evaluaciones' => $evaluations,
        ])->assertOk()->assertJsonPath('data.etapa', 'segundo_filtro');

        $this->assertDatabaseCount('gp_convocatoria_evaluaciones', 8);
        $this->assertDatabaseHas('gp_convocatoria_historial', ['accion' => 'primer_filtro_completado']);
    }

    public function test_second_filter_is_rejected_until_the_first_filter_is_fully_approved(): void
    {
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertCreated();
        $id = $created->json('data.id');

        $this->getJson("/api/gestion-proyectos/convocatorias/{$id}/segundo-filtro")
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.convocatoria.0',
                'Solo se puede realizar el segundo filtro de convocatorias que aprobaron el primer filtro.'
            );

        $evaluations = collect([
            'internacional', 'organizacion_admitida', 'alianzas', 'tipo_proyecto',
            'territorio', 'fecha_cierre', 'alineacion_sectorial', 'rango_financiamiento',
        ])->map(fn ($code) => [
            'criterio_codigo' => $code,
            'estado_revision' => $code === 'territorio' ? 'no_cumple' : 'cumple',
        ])->all();

        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/primer-filtro", [
            'evaluaciones' => $evaluations,
        ])->assertOk()->assertJsonPath('data.etapa', 'cierre');

        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/segundo-filtro", [
            'evaluaciones' => $evaluations,
        ])->assertUnprocessable()
            ->assertJsonPath(
                'errors.convocatoria.0',
                'Solo se puede realizar el segundo filtro de convocatorias que aprobaron el primer filtro.'
            );
    }

    public function test_integrante_role_team_leader_receives_first_filter_access_automatically(): void
    {
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertCreated();
        $roleId = Schema::getConnection()->table('roles')->value('id');
        Schema::getConnection()->table('roles')->where('id', $roleId)->update([
            'codigo' => 'integrante',
            'acceso_total' => false,
        ]);

        $url = "/api/gestion-proyectos/convocatorias/{$created->json('data.id')}/primer-filtro";
        $this->getJson("/api/gestion-proyectos/convocatorias/{$created->json('data.id')}")
            ->assertOk()
            ->assertJsonPath('data.primer_filtro_autorizado', true);
        $this->getJson($url)->assertOk();
        $this->getJson('/api/gestion-proyectos/convocatorias')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_project_coordinator_receives_only_the_automatic_project_access_for_the_exact_role_area_and_position(): void
    {
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertCreated();
        $connection = Schema::getConnection();
        $roleId = $connection->table('roles')->value('id');
        $accountId = $connection->table('cuentas_acceso')->value('id');
        $connection->table('roles')->where('id', $roleId)->update([
            'codigo' => 'coordinador_area',
            'acceso_total' => false,
        ]);
        $connection->table('areas')->where('id', $this->areaId)->update([
            'nombre' => 'GESTIÓN DE PROYECTOS',
        ]);
        $connection->table('cargos')->where('rol_id', $roleId)->update([
            'nombre' => 'COORDINADOR DE GESTIÓN DE PROYECTOS',
        ]);

        $authorization = app(InstitutionalAuthorizationService::class);
        $this->assertEqualsCanonicalizing([
            'gp.equipos.ver',
            'gp.equipos.crear',
            'gp.equipos.editar',
            'gp.equipos.descargar_excel',
            'gp.equipos.ver_metricas',
            'gp.convocatorias.evaluar',
            'gp.convocatorias.ver',
            'gp.convocatorias.aprobar',
            'gp.convocatorias.ver_aprobacion',
            'gp.convocatorias.postular',
            'gp.convocatorias.ver_postulacion',
            'gp.convocatorias.ver_envio',
            'gp.convocatorias.ver_seguimiento',
            'gp.convocatorias.ver_cierre',
            'gp.capacitaciones.ver',
            'gp.capacitaciones.gestionar',
        ], $authorization->automaticPermissionCodes(
            $accountId,
            'coordinador_area',
            'GESTIÓN DE PROYECTOS',
            'COORDINADOR DE GESTIÓN DE PROYECTOS',
        ));

        $this->getJson('/api/gestion-proyectos/equipos')->assertOk();
        $this->getJson('/api/gestion-proyectos/equipos/metricas')->assertOk();
        $this->getJson('/api/gestion-proyectos/equipos/integrantes-disponibles')->assertOk();
        $this->getJson('/api/gestion-proyectos/convocatorias')->assertOk();
        $this->getJson("/api/gestion-proyectos/convocatorias/{$created->json('data.id')}/primer-filtro")
            ->assertOk();
        $this->postJson("/api/gestion-proyectos/convocatorias/{$created->json('data.id')}/aprobacion", [
            'decision' => 'aprobada',
        ])->assertUnprocessable()
            ->assertJsonPath(
                'errors.convocatoria.0',
                'La convocatoria debe aprobar ambos filtros antes de registrar la decisión.'
            );
        $this->postJson("/api/gestion-proyectos/convocatorias/{$created->json('data.id')}/postulacion")
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.convocatoria.0',
                'Solo una convocatoria aprobada puede iniciar la postulación.'
            );

        $this->assertSame(['gp.convocatorias.ver', 'gp.convocatorias.evaluar'], $authorization->automaticPermissionCodes(
            $accountId,
            'coordinador_area',
            'OTRA ÁREA',
            'COORDINADOR DE GESTIÓN DE PROYECTOS',
        ));
        $this->assertSame(['gp.convocatorias.ver', 'gp.convocatorias.evaluar'], $authorization->automaticPermissionCodes(
            $accountId,
            'coordinador_area',
            'GESTIÓN DE PROYECTOS',
            'OTRO CARGO',
        ));
        $this->assertSame(['gp.convocatorias.ver', 'gp.convocatorias.evaluar'], $authorization->automaticPermissionCodes(
            $accountId,
            'co_coordinador_area',
            'GESTIÓN DE PROYECTOS',
            'COORDINADOR DE GESTIÓN DE PROYECTOS',
        ));
    }

    public function test_project_co_coordinator_manages_teams_and_only_reviews_calls_that_passed_the_first_filter(): void
    {
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertCreated();
        $id = $created->json('data.id');
        $evaluations = collect([
            'internacional', 'organizacion_admitida', 'alianzas', 'tipo_proyecto',
            'territorio', 'fecha_cierre', 'alineacion_sectorial', 'rango_financiamiento',
        ])->map(fn ($code) => ['criterio_codigo' => $code, 'estado_revision' => 'cumple'])->all();

        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/primer-filtro", [
            'evaluaciones' => $evaluations,
        ])->assertOk()->assertJsonPath('data.etapa', 'segundo_filtro');

        $connection = Schema::getConnection();
        $roleId = $connection->table('roles')->value('id');
        $accountId = $connection->table('cuentas_acceso')->value('id');
        $connection->table('roles')->where('id', $roleId)->update([
            'codigo' => 'co_coordinador_area',
            'acceso_total' => false,
        ]);
        $connection->table('areas')->where('id', $this->areaId)->update([
            'nombre' => 'GESTIÓN DE PROYECTOS',
        ]);
        $connection->table('cargos')->where('rol_id', $roleId)->update([
            'nombre' => 'CO-COORDINADOR DE GESTIÓN DE PROYECTOS',
        ]);

        $authorization = app(InstitutionalAuthorizationService::class);
        $this->assertEqualsCanonicalizing([
            'gp.equipos.ver',
            'gp.equipos.crear',
            'gp.equipos.editar',
            'gp.equipos.descargar_excel',
            'gp.equipos.ver_metricas',
            'gp.convocatorias.ver',
            'gp.convocatorias.evaluar',
            'gp.convocatorias.revisar',
            'gp.capacitaciones.ver',
            'gp.capacitaciones.gestionar',
        ], $authorization->automaticPermissionCodes(
            $accountId,
            'co_coordinador_area',
            'GESTIÓN DE PROYECTOS',
            'CO-COORDINADOR DE GESTIÓN DE PROYECTOS',
        ));

        $this->getJson('/api/gestion-proyectos/equipos')->assertOk();
        $this->getJson('/api/gestion-proyectos/equipos/metricas')->assertOk();
        $this->getJson('/api/gestion-proyectos/equipos/integrantes-disponibles')->assertOk();
        $this->getJson('/api/gestion-proyectos/convocatorias')->assertOk()->assertJsonCount(1, 'data');
        $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))
            ->assertForbidden();
        $this->getJson("/api/gestion-proyectos/convocatorias/{$id}/primer-filtro")
            ->assertOk();

        $this->getJson("/api/gestion-proyectos/convocatorias/{$id}/segundo-filtro")
            ->assertOk()
            ->assertJsonPath('data.etapa', 'segundo_filtro');
        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/segundo-filtro", [
            'evaluaciones' => $evaluations,
        ])->assertOk()
            ->assertJsonPath('data.estado', 'preseleccionada')
            ->assertJsonPath('data.etapa', 'aprobacion');

        $this->assertDatabaseCount('gp_convocatoria_evaluaciones', 16);
        $this->assertDatabaseHas('gp_convocatoria_historial', [
            'convocatoria_id' => $id,
            'accion' => 'segundo_filtro_completado',
        ]);
        $this->postJson("/api/gestion-proyectos/convocatorias/{$id}/segundo-filtro", [
            'evaluaciones' => $evaluations,
        ])->assertUnprocessable();

        $this->assertSame(['gp.convocatorias.ver', 'gp.convocatorias.evaluar'], $authorization->automaticPermissionCodes(
            $accountId,
            'co_coordinador_area',
            'GESTIÓN DE PROYECTOS',
            'OTRO CARGO',
        ));
    }

    public function test_a_regular_team_member_can_view_their_own_call_but_not_other_calls_or_the_first_filter(): void
    {
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))->assertCreated();
        $now = now();
        $personaId = (string) Str::uuid();
        $accountId = (string) Str::uuid();
        $memberUser = User::query()->create(['name' => 'Integrante', 'email' => 'member@example.com', 'password' => Hash::make('password')]);
        Schema::getConnection()->table('personas')->insert(['id' => $personaId, 'nombres' => 'INTEGRANTE', 'apellidos' => 'EQUIPO', 'created_at' => $now, 'updated_at' => $now]);
        Schema::getConnection()->table('cuentas_acceso')->insert(['id' => $accountId, 'user_id' => $memberUser->id, 'persona_id' => $personaId, 'activo' => true, 'created_at' => $now, 'updated_at' => $now]);
        $memberId = Schema::getConnection()->table('integrantes')->insertGetId(['persona_id' => $personaId, 'estado' => 'Activo', 'created_at' => $now, 'updated_at' => $now]);
        $cargoId = Schema::getConnection()->table('cargos')->value('id');
        Schema::getConnection()->table('integrantes_historial')->insert(['integrante_id' => $memberId, 'cargo_id' => $cargoId, 'estado' => 'Activo', 'fecha_inicio' => now()->subMonth()->toDateString(), 'created_at' => $now, 'updated_at' => $now]);
        Schema::getConnection()->table('gp_equipo_integrantes')->insert(['equipo_id' => $this->equipoId, 'integrante_id' => $memberId, 'rol' => 'integrante', 'created_at' => $now, 'updated_at' => $now]);
        Schema::getConnection()->table('roles')->update(['acceso_total' => false]);

        Sanctum::actingAs($memberUser);
        $this->getJson('/api/gestion-proyectos/convocatorias')->assertOk()->assertJsonCount(0, 'data');
        $ownCall = $this->postJson('/api/gestion-proyectos/convocatorias', [
            ...$this->validPayload($this->sourceId),
            'nombre' => 'Convocatoria registrada por integrante',
        ])->assertCreated();
        $this->getJson('/api/gestion-proyectos/convocatorias')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'Convocatoria registrada por integrante');
        $this->getJson("/api/gestion-proyectos/convocatorias/{$ownCall->json('data.id')}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Convocatoria registrada por integrante');
        $this->getJson("/api/gestion-proyectos/convocatorias/{$created->json('data.id')}")
            ->assertForbidden();
        $this->getJson("/api/gestion-proyectos/convocatorias/{$created->json('data.id')}/primer-filtro")
            ->assertForbidden();
    }

    public function test_a_call_cannot_be_edited_after_the_first_filter_starts(): void
    {
        $created = $this->postJson(
            '/api/gestion-proyectos/convocatorias',
            $this->validPayload($this->sourceId)
        )->assertCreated();
        $id = $created->json('data.id');

        Schema::getConnection()->table('gp_convocatoria_evaluaciones')->insert([
            'convocatoria_id' => $id,
            'criterio_codigo' => 'territorio',
            'estado_revision' => 'cumple',
            'tipo_filtro' => 'primer_filtro',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->putJson(
            "/api/gestion-proyectos/convocatorias/{$id}",
            $this->validPayload($this->sourceId)
        )->assertUnprocessable()
            ->assertJsonPath(
                'errors.convocatoria.0',
                'La convocatoria ya no se puede editar porque el primer filtro fue revisado.'
            );
    }

    public function test_area_scoped_permissions_only_expose_and_create_calls_in_the_own_area(): void
    {
        $roleId = Schema::getConnection()->table('roles')->value('id');
        Schema::getConnection()->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);

        foreach (['gp.convocatorias.ver', 'gp.convocatorias.crear'] as $code) {
            $permissionId = Schema::getConnection()->table('permisos')->insertGetId([
                'codigo' => $code,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            Schema::getConnection()->table('rol_permisos')->insert([
                'rol_id' => $roleId,
                'permiso_id' => $permissionId,
                'alcance' => 'area',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $created = $this->postJson(
            '/api/gestion-proyectos/convocatorias',
            $this->validPayload($this->sourceId)
        )->assertCreated();

        $otherAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'OTRA ÁREA',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Schema::getConnection()->table('gp_convocatorias')->insert([
            ...$this->validPayload($this->sourceId),
            'area_id' => $otherAreaId,
            'registrada_por' => Schema::getConnection()->table('cuentas_acceso')->value('id'),
            'fecha_registro' => now()->toDateString(),
            'estado' => 'registrada',
            'etapa' => 'deteccion',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertSame($this->areaId, $created->json('data.area_id'));
        $this->getJson('/api/gestion-proyectos/convocatorias')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $created->json('data.id'));
    }

    public function test_project_module_access_depends_on_permissions_instead_of_area_name(): void
    {
        $roleId = Schema::getConnection()->table('roles')->value('id');
        Schema::getConnection()->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);
        $otherAreaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'TECNOLOGÍA DE LA INFORMACIÓN',
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Schema::getConnection()->table('cargos')->update(['area_id' => $otherAreaId]);

        foreach (['gp.convocatorias.ver', 'gp.equipos.ver'] as $code) {
            $permissionId = Schema::getConnection()->table('permisos')->insertGetId([
                'codigo' => $code,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            Schema::getConnection()->table('rol_permisos')->insert([
                'rol_id' => $roleId,
                'permiso_id' => $permissionId,
                'alcance' => 'area',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->getJson('/api/gestion-proyectos/convocatorias')->assertOk();
        $this->getJson('/api/gestion-proyectos/equipos')->assertOk();
    }

    public function test_complete_workflow_runs_in_laravel_without_supabase(): void
    {
        Storage::fake(config('filesystems.default'));
        $created = $this->postJson('/api/gestion-proyectos/convocatorias', $this->validPayload($this->sourceId))->assertCreated();
        $convocatoriaId = $created->json('data.id');
        $evaluations = $this->eligibleEvaluations();

        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/primer-filtro", ['evaluaciones' => $evaluations])
            ->assertOk()->assertJsonPath('data.etapa', 'segundo_filtro');
        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/segundo-filtro", ['evaluaciones' => $evaluations])
            ->assertOk()->assertJsonPath('data.etapa', 'aprobacion');
        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/aprobacion", [
            'decision' => 'aprobada', 'observacion' => 'Cumple los criterios institucionales.',
        ])->assertOk()->assertJsonPath('data.decision', 'aprobada');

        $postulation = $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/postulacion")
            ->assertCreated()->assertJsonPath('data.estado', 'en_preparacion');
        $postulationId = $postulation->json('data.id');
        $detail = $this->getJson("/api/gestion-proyectos/postulaciones/{$postulationId}/detalle")
            ->assertOk()->assertJsonCount(4, 'data.checklist')->assertJsonCount(2, 'data.propuestas');

        foreach ($detail->json('data.checklist') as $item) {
            $this->putJson("/api/gestion-proyectos/postulaciones/{$postulationId}/items/checklist/{$item['id']}", [
                'completado' => true,
            ])->assertOk();
        }
        foreach ($detail->json('data.propuestas') as $item) {
            $this->putJson("/api/gestion-proyectos/postulaciones/{$postulationId}/items/propuestas/{$item['id']}", [
                'estado' => 'completada',
            ])->assertOk();
        }
        $upload = $this->post('/api/gestion-proyectos/postulaciones/'.$postulationId.'/documentos', [
            'archivo' => UploadedFile::fake()->create('propuesta.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated();
        $path = $upload->json('data.path');
        Storage::disk(config('filesystems.default'))->assertExists($path);
        $document = $this->postJson("/api/gestion-proyectos/postulaciones/{$postulationId}/items/documentos", [
            'nombre' => 'Propuesta consolidada', 'archivo_url' => $path, 'estado' => 'validado',
        ])->assertCreated();
        $this->get('/api/gestion-proyectos/postulaciones/documentos/'.$document->json('data.id').'/archivo')
            ->assertOk()->assertDownload('propuesta-consolidada.pdf');

        $this->postJson("/api/gestion-proyectos/postulaciones/{$postulationId}/finalizar-preparacion")
            ->assertOk()->assertJsonPath('data.estado', 'lista_para_enviar');
        $this->assertDatabaseHas('gp_convocatoria_historial', [
            'convocatoria_id' => $convocatoriaId,
            'accion' => 'postulacion_lista_para_envio',
        ]);
        $this->assertDatabaseMissing('gp_convocatoria_historial', [
            'convocatoria_id' => $convocatoriaId,
            'accion' => 'postulacion_en_revision',
        ]);
        $shipmentPayload = [
            'lider_idear_nombre' => 'María Pérez',
            'fecha_identificacion' => now()->toDateString(),
            'fecha_revision_diseno' => now()->addDay()->toDateString(),
            'fecha_revision_evidencias' => now()->addDays(2)->toDateString(),
            'fecha_revision_armado' => now()->addDays(3)->toDateString(),
            'fecha_revision_primera_replica' => now()->addDays(4)->toDateString(),
            'fecha_envio' => '2026-10-15',
            'plazo_respuesta_dias' => 30,
            'rango_postulacion' => '50_100',
        ];
        $this->postJson("/api/gestion-proyectos/postulaciones/{$postulationId}/envio", [
            ...$shipmentPayload,
            'plazo_respuesta_dias' => 60,
        ])->assertUnprocessable()->assertJsonValidationErrors('plazo_respuesta_dias');

        $shipment = $this->postJson("/api/gestion-proyectos/postulaciones/{$postulationId}/envio", $shipmentPayload)
            ->assertOk()
            ->assertJsonPath('data.estado', 'enviada')
            ->assertJsonPath('data.lider_idear_nombre', 'María Pérez')
            ->assertJsonPath('data.fecha_envio', '2026-10-15')
            ->assertJsonPath('data.rango_postulacion', '50_100');

        $tracking = $this->getJson("/api/gestion-proyectos/postulaciones/{$postulationId}/seguimiento")
            ->assertOk()
            ->assertJsonPath('data.estado', 'en_seguimiento')
            ->assertJsonPath('data.fecha_estimada_decision', '2026-11-14');
        $trackingId = $tracking->json('data.id');
        $this->assertDatabaseHas('gp_postulacion_seguimiento_eventos', [
            'seguimiento_id' => $trackingId,
            'tipo' => 'seguimiento_iniciado',
            'registrado_por' => $shipment->json('data.enviada_por'),
        ]);
        $this->postJson("/api/gestion-proyectos/seguimientos/{$trackingId}/comunicaciones", [
            'direccion' => 'recibida', 'canal' => 'correo', 'resumen' => 'Acuse de recibo.',
        ])->assertCreated();
        $request = $this->postJson("/api/gestion-proyectos/seguimientos/{$trackingId}/solicitudes", [
            'descripcion' => 'Enviar precisión presupuestal.',
        ])->assertCreated();
        $this->postJson('/api/gestion-proyectos/seguimientos/solicitudes/'.$request->json('data.id').'/respuesta', [
            'respuesta' => 'Precisión enviada.',
        ])->assertOk()->assertJsonPath('data.estado', 'respondida');
        $this->postJson("/api/gestion-proyectos/seguimientos/{$trackingId}/resultado", [
            'tipo_resultado' => 'adjudicada', 'fecha' => now()->toDateString(),
        ])->assertOk()->assertJsonPath('data.estado', 'cerrado');
        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/archivar", [
            'motivo' => 'Expediente concluido y archivado.',
        ])->assertOk()->assertJsonPath('data.estado', 'archivada');

        $this->assertDatabaseHas('gp_convocatorias', [
            'id' => $convocatoriaId,
            'resultado_final' => 'adjudicada',
        ]);
        $this->assertDatabaseHas('gp_convocatoria_historial', [
            'convocatoria_id' => $convocatoriaId, 'accion' => 'archivada',
        ]);
    }

    public function test_tracking_backfill_adds_only_missing_tracking_for_sent_postulations(): void
    {
        $postulationId = DB::table('gp_postulaciones')->insertGetId([
            'convocatoria_id' => 999,
            'estado' => 'enviada',
            'fecha_envio' => '2026-10-08',
            'hora_envio' => '14:30:00',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_10_09_130000_backfill_tracking_for_sent_postulations.php');
        $migration->up();
        $migration->up();

        $this->assertDatabaseHas('gp_postulacion_seguimientos', [
            'postulacion_id' => $postulationId,
            'estado' => 'en_seguimiento',
        ]);
        $this->assertSame(
            1,
            DB::table('gp_postulacion_seguimientos')->where('postulacion_id', $postulationId)->count()
        );
    }

    public function test_review_state_backfill_moves_postulations_directly_to_shipment(): void
    {
        $postulationId = DB::table('gp_postulaciones')->insertGetId([
            'convocatoria_id' => 999,
            'estado' => 'en_revision',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_10_09_140000_skip_postulation_review_state.php');
        $migration->up();

        $this->assertDatabaseHas('gp_postulaciones', [
            'id' => $postulationId,
            'estado' => 'lista_para_enviar',
        ]);
    }

    public function test_read_only_workflow_permission_does_not_allow_postulation_mutations(): void
    {
        $convocatoriaId = $this->postJson(
            '/api/gestion-proyectos/convocatorias',
            $this->validPayload($this->sourceId)
        )->assertCreated()->json('data.id');
        $evaluations = $this->eligibleEvaluations();
        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/primer-filtro", ['evaluaciones' => $evaluations])
            ->assertOk();
        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/segundo-filtro", ['evaluaciones' => $evaluations])
            ->assertOk();
        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/aprobacion", [
            'decision' => 'aprobada',
        ])->assertOk();

        $this->grantPermissions(['gp.convocatorias.ver_postulacion']);

        $this->getJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/postulacion")
            ->assertOk()->assertJsonPath('data', null);
        $this->postJson("/api/gestion-proyectos/convocatorias/{$convocatoriaId}/postulacion")
            ->assertForbidden();
    }

    public function test_daily_call_alerts_notify_responsible_users_and_team_leader_without_duplicates(): void
    {
        $today = CarbonImmutable::parse('2026-10-04', 'America/Lima')->startOfDay();
        $connection = Schema::getConnection();

        $closingId = $this->postJson(
            '/api/gestion-proyectos/convocatorias',
            $this->validPayload($this->sourceId)
        )->assertCreated()->json('data.id');
        $connection->table('gp_convocatorias')->where('id', $closingId)->update([
            'nombre' => 'Convocatoria próxima a cerrar',
            'fecha_cierre' => $today->addDays(7)->toDateString(),
        ]);

        $approvalId = $this->postJson(
            '/api/gestion-proyectos/convocatorias',
            $this->validPayload($this->sourceId)
        )->assertCreated()->json('data.id');
        $connection->table('gp_convocatorias')->where('id', $approvalId)->update([
            'nombre' => 'Convocatoria por aprobar',
            'estado' => 'preseleccionada',
            'etapa' => 'aprobacion',
        ]);

        $requestCallId = $this->postJson(
            '/api/gestion-proyectos/convocatorias',
            $this->validPayload($this->sourceId)
        )->assertCreated()->json('data.id');
        $connection->table('gp_convocatorias')->where('id', $requestCallId)->update([
            'nombre' => 'Convocatoria en seguimiento',
            'estado' => 'en_seguimiento',
            'etapa' => 'seguimiento',
        ]);

        $responsible = User::query()->create([
            'name' => 'Responsable',
            'email' => 'responsable-alertas@example.com',
            'password' => Hash::make('password'),
        ]);
        $responsiblePersonId = (string) Str::uuid();
        $responsibleAccountId = (string) Str::uuid();
        $connection->table('personas')->insert([
            'id' => $responsiblePersonId,
            'nombres' => 'RESPONSABLE',
            'apellidos' => 'ALERTAS',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $connection->table('cuentas_acceso')->insert([
            'id' => $responsibleAccountId,
            'user_id' => $responsible->id,
            'persona_id' => $responsiblePersonId,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $postulationId = $connection->table('gp_postulaciones')->insertGetId([
            'convocatoria_id' => $requestCallId,
            'estado' => 'enviada',
            'fecha_inicio' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $trackingId = $connection->table('gp_postulacion_seguimientos')->insertGetId([
            'postulacion_id' => $postulationId,
            'estado' => 'requiere_respuesta',
            'fecha_inicio' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $connection->table('gp_postulacion_solicitudes')->insert([
            'seguimiento_id' => $trackingId,
            'descripcion' => 'Presentar información complementaria',
            'fecha_recepcion' => now(),
            'responsable_id' => $responsibleAccountId,
            'fecha_limite' => $today->subDay()->toDateString(),
            'estado' => 'pendiente',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $service = app(ConvocatoriaNotificationService::class);

        $this->assertSame(7, $service->generateAll($today));
        $this->assertSame(0, $service->generateAll($today));
        $this->artisan('notifications:generate-convocatoria-alerts')->assertSuccessful();

        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->user->id,
            'tipo' => 'gp_convocatoria_cierre_7_dias',
        ]);
        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->user->id,
            'tipo' => 'gp_convocatoria_evaluacion_pendiente',
        ]);
        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $this->user->id,
            'tipo' => 'gp_convocatoria_aprobacion_pendiente',
        ]);
        $this->assertDatabaseHas('notificaciones_asistencia', [
            'user_id' => $responsible->id,
            'tipo' => 'gp_convocatoria_solicitud_pendiente',
            'titulo' => 'Solicitud vencida',
        ]);
        $this->assertSame(2, $connection->table('notificaciones_asistencia')
            ->where('tipo', 'gp_convocatoria_resumen_critico')->count());
        $this->assertSame(7, $connection->table('notificaciones_asistencia')->count());
    }

    private function validPayload(int $sourceId): array
    {
        return [
            'fuente_id' => $sourceId,
            'nombre' => 'Fondo de Innovación Ambiental',
            'financiador_nombre' => 'Fundación Horizonte',
            'fecha_apertura' => now()->toDateString(),
            'fecha_cierre' => now()->addDays(60)->toDateString(),
            'tipo_financiamiento' => 'cofinanciamiento',
            'moneda' => 'USD',
            'monto_minimo' => 50000,
            'monto_maximo' => 250000,
            'sector' => 'medio_ambiente',
            'tipo_proyecto' => 'piloto',
            'lleva_cofinanciamiento' => true,
            'tipo_organizacion_admitida' => 'ongs',
            'tiempo_postulacion' => 'con_limite',
            'territorio' => 'Perú',
            'beneficiario_ideal' => 'comunidades',
            'requiere_alianza' => 'si',
            'tipo_alianza' => 'alianza_comunitaria',
        ];
    }

    private function eligibleEvaluations(): array
    {
        return collect([
            'internacional', 'organizacion_admitida', 'alianzas', 'tipo_proyecto',
            'territorio', 'fecha_cierre', 'alineacion_sectorial', 'rango_financiamiento',
        ])->map(fn (string $code) => [
            'criterio_codigo' => $code, 'estado_revision' => 'cumple',
        ])->all();
    }

    private function grantPermissions(array $codes): void
    {
        $roleId = Schema::getConnection()->table('roles')->value('id');
        Schema::getConnection()->table('roles')->where('id', $roleId)->update(['acceso_total' => false]);
        Schema::getConnection()->table('rol_permisos')->where('rol_id', $roleId)->delete();

        foreach ($codes as $code) {
            $permissionId = Schema::getConnection()->table('permisos')->insertGetId([
                'codigo' => $code,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            Schema::getConnection()->table('rol_permisos')->insert([
                'rol_id' => $roleId,
                'permiso_id' => $permissionId,
                'alcance' => 'global',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedIdentity(): void
    {
        $now = now();
        $personaId = (string) Str::uuid();
        $accountId = (string) Str::uuid();
        $this->user = User::query()->create([
            'name' => 'Administrador',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);
        $this->areaId = Schema::getConnection()->table('areas')->insertGetId([
            'nombre' => 'GESTIÓN DE PROYECTOS',
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $roleId = Schema::getConnection()->table('roles')->insertGetId([
            'codigo' => 'integrante',
            'nombre' => 'Administrador',
            'acceso_total' => true,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $cargoId = Schema::getConnection()->table('cargos')->insertGetId([
            'nombre' => 'LÍDER DE GESTIÓN DE PROYECTOS',
            'area_id' => $this->areaId,
            'rol_id' => $roleId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cargos')->insert([
            'nombre' => 'MIEMBRO DE GESTIÓN DE PROYECTOS',
            'area_id' => $this->areaId,
            'rol_id' => $roleId,
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
            'id' => $accountId,
            'user_id' => $this->user->id,
            'persona_id' => $personaId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->integranteId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personaId,
            'estado' => 'Activo',
            'avatar_path' => 'avatars/administrador.webp',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $historyId = Schema::getConnection()->table('integrantes_historial')->insertGetId([
            'integrante_id' => $this->integranteId,
            'cargo_id' => $cargoId,
            'estado' => 'Activo',
            'fecha_inicio' => now()->subYear()->toDateString(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('integrante_horarios')->insert([
            'historial_id' => $historyId,
            'dia_semana' => 1,
            'hora_inicio' => '09:00',
            'hora_fin' => '13:00',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->equipoId = Schema::getConnection()->table('gp_equipos')->insertGetId([
            'area_id' => $this->areaId,
            'nombre' => 'Equipo principal',
            'activo' => true,
            'creado_por' => $accountId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('gp_equipo_integrantes')->insert([
            'equipo_id' => $this->equipoId,
            'integrante_id' => $this->integranteId,
            'rol' => 'lider',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->sourceId = Schema::getConnection()->table('gp_fuentes_financiamiento')->insertGetId([
            'nombre' => 'Fuente base',
            'tipo' => 'otra',
            'activo' => true,
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
            $table->string('correo')->nullable();
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
            $table->text('avatar_path')->nullable();
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
        Schema::create('integrante_horarios', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('historial_id');
            $table->unsignedSmallInteger('dia_semana');
            $table->time('hora_inicio');
            $table->time('hora_fin');
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
        Schema::create('gp_fuentes_financiamiento', function (Blueprint $table): void {
            $table->id();
            $table->string('nombre');
            $table->string('tipo')->default('otra');
            $table->text('sitio_web')->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
        Schema::create('gp_equipos', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('area_id');
            $table->string('nombre');
            $table->boolean('activo');
            $table->uuid('creado_por');
            $table->timestamps();
        });
        Schema::create('gp_equipo_integrantes', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('equipo_id');
            $table->unsignedBigInteger('integrante_id');
            $table->string('rol');
            $table->timestamps();
        });
        Schema::create('gp_equipo_integrantes_historial', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('equipo_id');
            $table->unsignedBigInteger('integrante_id');
            $table->string('accion');
            $table->string('rol_anterior')->nullable();
            $table->string('rol_nuevo')->nullable();
            $table->uuid('realizado_por')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_convocatorias', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('fuente_id');
            $table->unsignedBigInteger('area_id')->nullable();
            $table->unsignedBigInteger('equipo_id')->nullable();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->string('financiador_nombre');
            $table->text('url_convocatoria')->nullable();
            $table->text('url_postulacion')->nullable();
            $table->date('fecha_apertura')->nullable();
            $table->date('fecha_cierre')->nullable();
            $table->decimal('monto_minimo', 15, 2)->nullable();
            $table->decimal('monto_maximo', 15, 2)->nullable();
            $table->string('moneda');
            $table->decimal('monto_solicitable', 15, 2)->nullable();
            $table->text('territorio')->nullable();
            $table->string('sector');
            $table->string('tipo_proyecto');
            $table->string('tipo_financiamiento');
            $table->boolean('lleva_cofinanciamiento')->nullable();
            $table->string('tipo_organizacion_admitida')->nullable();
            $table->string('tiempo_postulacion')->nullable();
            $table->text('beneficiario_ideal')->nullable();
            $table->string('requiere_alianza');
            $table->text('tipo_alianza')->nullable();
            $table->text('fuente_encontrada')->nullable();
            $table->string('fuente_busqueda')->nullable();
            $table->text('fuente_busqueda_otro')->nullable();
            $table->uuid('registrada_por');
            $table->date('fecha_registro');
            $table->string('estado');
            $table->string('etapa');
            $table->string('resultado_final')->nullable();
            $table->text('motivo_descarte')->nullable();
            $table->timestamp('cerrada_at')->nullable();
            $table->uuid('cerrada_por')->nullable();
            $table->timestamp('archivada_at')->nullable();
            $table->uuid('archivada_por')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_convocatoria_evaluaciones', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('convocatoria_id');
            $table->string('criterio_codigo');
            $table->string('estado_revision');
            $table->text('observacion')->nullable();
            $table->uuid('revisado_por')->nullable();
            $table->timestamp('revisado_at')->nullable();
            $table->string('tipo_filtro');
            $table->timestamps();
        });
        Schema::create('gp_convocatoria_aprobaciones', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('convocatoria_id');
            $table->string('decision');
            $table->text('observacion')->nullable();
            $table->uuid('decidido_por');
            $table->timestamp('decidido_at')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_postulaciones', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('convocatoria_id');
            $table->string('estado');
            $table->timestamp('fecha_inicio')->nullable();
            $table->date('fecha_limite')->nullable();
            $table->date('fecha_envio')->nullable();
            $table->time('hora_envio')->nullable();
            $table->uuid('enviada_por')->nullable();
            $table->string('canal_envio')->nullable();
            $table->text('url_postulacion')->nullable();
            $table->string('codigo_postulacion')->nullable();
            $table->text('constancia_url')->nullable();
            $table->text('observaciones')->nullable();
            $table->string('lider_idear_nombre')->nullable();
            $table->date('fecha_identificacion')->nullable();
            $table->date('fecha_revision_diseno')->nullable();
            $table->date('fecha_revision_evidencias')->nullable();
            $table->date('fecha_revision_armado')->nullable();
            $table->date('fecha_revision_primera_replica')->nullable();
            $table->string('rango_postulacion')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_postulacion_checklist', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('postulacion_id');
            $table->string('categoria');
            $table->string('titulo');
            $table->boolean('requerido')->default(true);
            $table->boolean('completado')->default(false);
            $table->text('observaciones')->nullable();
            $table->integer('orden')->default(0);
            $table->timestamps();
        });
        Schema::create('gp_postulacion_documentos', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('postulacion_id');
            $table->string('nombre');
            $table->string('categoria')->default('otros');
            $table->text('descripcion')->nullable();
            $table->text('archivo_url')->nullable();
            $table->string('estado')->default('pendiente');
            $table->boolean('requerido')->default(false);
            $table->timestamp('fecha_carga')->nullable();
            $table->uuid('cargado_por')->nullable();
            $table->timestamp('fecha_validacion')->nullable();
            $table->uuid('validado_por')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_postulacion_propuestas', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('postulacion_id');
            $table->string('tipo');
            $table->string('estado')->default('pendiente');
            $table->uuid('responsable_id')->nullable();
            $table->date('fecha_limite')->nullable();
            $table->text('enlace_documento')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_postulacion_seguimientos', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('postulacion_id');
            $table->string('estado');
            $table->timestamp('fecha_inicio')->nullable();
            $table->date('fecha_estimada_decision')->nullable();
            $table->timestamp('fecha_cierre')->nullable();
            $table->uuid('cerrado_por')->nullable();
            $table->text('motivo_cierre')->nullable();
            $table->string('tipo_resultado')->nullable();
            $table->date('fecha_resultado')->nullable();
            $table->text('observacion_resultado')->nullable();
            $table->unsignedBigInteger('comunicacion_resultado_id')->nullable();
            $table->text('evidencia_resultado')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_postulacion_seguimiento_eventos', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('seguimiento_id');
            $table->string('tipo');
            $table->timestamp('fecha_evento')->nullable();
            $table->text('descripcion')->nullable();
            $table->uuid('registrado_por');
            $table->timestamps();
        });
        Schema::create('gp_postulacion_comunicaciones', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('seguimiento_id');
            $table->timestamp('fecha')->nullable();
            $table->string('direccion');
            $table->string('canal');
            $table->text('asunto')->nullable();
            $table->text('remitente')->nullable();
            $table->text('destinatarios')->nullable();
            $table->text('resumen');
            $table->boolean('requiere_respuesta')->default(false);
            $table->date('fecha_limite')->nullable();
            $table->uuid('registrado_por');
            $table->text('evidencia')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_postulacion_solicitudes', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('seguimiento_id');
            $table->text('descripcion');
            $table->timestamp('fecha_recepcion')->nullable();
            $table->uuid('responsable_id')->nullable();
            $table->date('fecha_limite')->nullable();
            $table->string('estado')->default('pendiente');
            $table->text('respuesta')->nullable();
            $table->timestamp('fecha_respuesta')->nullable();
            $table->text('evidencia')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
        Schema::create('gp_convocatoria_historial', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('convocatoria_id');
            $table->string('accion');
            $table->string('estado_anterior')->nullable();
            $table->string('estado_nuevo')->nullable();
            $table->string('etapa_anterior')->nullable();
            $table->string('etapa_nueva')->nullable();
            $table->text('observacion')->nullable();
            $table->uuid('actor_id');
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

    private function createEligibleMember(string $name, array $schedules): int
    {
        $now = now();
        $personaId = (string) Str::uuid();
        $accountId = (string) Str::uuid();
        $user = User::query()->create([
            'name' => $name,
            'email' => strtolower($name).'-'.Str::lower(Str::random(6)).'@example.com',
            'password' => Hash::make('password'),
        ]);
        Schema::getConnection()->table('personas')->insert([
            'id' => $personaId,
            'nombres' => $name,
            'apellidos' => 'PRUEBA',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        Schema::getConnection()->table('cuentas_acceso')->insert([
            'id' => $accountId,
            'user_id' => $user->id,
            'persona_id' => $personaId,
            'activo' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $integranteId = Schema::getConnection()->table('integrantes')->insertGetId([
            'persona_id' => $personaId,
            'estado' => 'Activo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $historyId = Schema::getConnection()->table('integrantes_historial')->insertGetId([
            'integrante_id' => $integranteId,
            'cargo_id' => Schema::getConnection()->table('cargos')
                ->where('nombre', 'MIEMBRO DE GESTIÓN DE PROYECTOS')
                ->value('id'),
            'estado' => 'Activo',
            'fecha_inicio' => now()->subMonth()->toDateString(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        foreach ($schedules as $schedule) {
            Schema::getConnection()->table('integrante_horarios')->insert([
                ...$schedule,
                'historial_id' => $historyId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        return $integranteId;
    }
}
