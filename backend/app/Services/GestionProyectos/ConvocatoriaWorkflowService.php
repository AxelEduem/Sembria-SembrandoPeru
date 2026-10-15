<?php

namespace App\Services\GestionProyectos;

use App\Data\Auth\AuthorizationScope;
use App\Models\GestionProyectos\Convocatoria;
use App\Models\GestionProyectos\ConvocatoriaAprobacion;
use App\Models\GestionProyectos\ConvocatoriaEvaluacion;
use App\Models\GestionProyectos\ConvocatoriaHistorial;
use App\Models\GestionProyectos\Postulacion;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ConvocatoriaWorkflowService
{
    private const SECTION_TABLES = [
        'checklist' => 'gp_postulacion_checklist',
        'documentos' => 'gp_postulacion_documentos',
        'propuestas' => 'gp_postulacion_propuestas',
    ];

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function approval(User $user, Convocatoria $convocatoria): ?array
    {
        $this->authorizeConvocatoria($user, ['gp.convocatorias.aprobar', 'gp.convocatorias.ver_aprobacion'], $convocatoria);

        $approval = ConvocatoriaAprobacion::query()->with('decisor.persona:id,nombres,apellidos')
            ->where('convocatoria_id', $convocatoria->id)->first();

        return $approval ? $this->approvalData($approval) : null;
    }

    public function decide(User $user, Convocatoria $convocatoria, array $data): array
    {
        $scope = $this->authorizeConvocatoria($user, ['gp.convocatorias.aprobar'], $convocatoria);

        return DB::transaction(function () use ($convocatoria, $data, $scope): array {
            $locked = Convocatoria::query()->lockForUpdate()->findOrFail($convocatoria->id);
            if ($locked->etapa !== 'aprobacion' || ! $this->passedFilter($locked->id, 'segundo_filtro')) {
                throw ValidationException::withMessages(['convocatoria' => 'La convocatoria debe aprobar ambos filtros antes de registrar la decisión.']);
            }
            if (ConvocatoriaAprobacion::query()->where('convocatoria_id', $locked->id)->exists()) {
                throw ValidationException::withMessages(['convocatoria' => 'La decisión final ya fue registrada y no se puede modificar.']);
            }

            $approval = ConvocatoriaAprobacion::query()->create([
                'convocatoria_id' => $locked->id,
                'decision' => $data['decision'],
                'observacion' => $data['observacion'] ?? null,
                'decidido_por' => $scope->accountId,
                'decidido_at' => now(),
            ]);
            $this->transition(
                $locked,
                $scope,
                'decision_final_registrada',
                $data['decision'] === 'aprobada' ? 'aprobada' : 'rechazada',
                $data['decision'] === 'aprobada' ? 'postulacion' : 'cierre',
                $data['observacion'] ?? null,
            );

            return $this->approvalData($approval->load('decisor.persona:id,nombres,apellidos'));
        });
    }

    public function activePostulation(User $user, Convocatoria $convocatoria): ?array
    {
        $this->authorizeConvocatoria($user, [
            'gp.convocatorias.postular', 'gp.convocatorias.ver_postulacion',
            'gp.convocatorias.ver_envio', 'gp.convocatorias.ver_seguimiento', 'gp.convocatorias.ver_cierre',
        ], $convocatoria);

        $postulation = Postulacion::query()->with('enviada.persona:id,nombres,apellidos')
            ->where('convocatoria_id', $convocatoria->id)->where('estado', '!=', 'cancelada')
            ->latest('created_at')->first();

        return $postulation ? $this->postulationData($postulation) : null;
    }

    public function startPostulation(User $user, Convocatoria $convocatoria): array
    {
        $scope = $this->authorizeConvocatoria($user, ['gp.convocatorias.postular'], $convocatoria);

        return DB::transaction(function () use ($convocatoria, $scope): array {
            $locked = Convocatoria::query()->lockForUpdate()->findOrFail($convocatoria->id);
            $approved = ConvocatoriaAprobacion::query()->where('convocatoria_id', $locked->id)
                ->where('decision', 'aprobada')->exists();
            if ($locked->etapa !== 'postulacion' || ! $approved) {
                throw ValidationException::withMessages(['convocatoria' => 'Solo una convocatoria aprobada puede iniciar la postulación.']);
            }
            if (Postulacion::query()->where('convocatoria_id', $locked->id)->where('estado', '!=', 'cancelada')->exists()) {
                throw ValidationException::withMessages(['convocatoria' => 'La convocatoria ya tiene una postulación activa.']);
            }

            $postulation = Postulacion::query()->create([
                'convocatoria_id' => $locked->id,
                'estado' => 'en_preparacion',
                'fecha_inicio' => now(),
                'fecha_limite' => $locked->fecha_cierre,
            ]);
            $this->seedPostulation($postulation->id);
            $this->history($locked, $scope, 'postulacion_iniciada');

            return $this->postulationData($postulation->load('enviada.persona:id,nombres,apellidos'));
        });
    }

    public function postulationDetail(User $user, Postulacion $postulation): array
    {
        $this->authorizePostulation($user, $postulation, [
            'gp.convocatorias.postular', 'gp.convocatorias.ver_postulacion', 'gp.convocatorias.ver_envio',
        ]);

        return [
            'checklist' => DB::table('gp_postulacion_checklist')->where('postulacion_id', $postulation->id)->orderBy('orden')->get(),
            'documentos' => DB::table('gp_postulacion_documentos')->where('postulacion_id', $postulation->id)->latest('created_at')->get(),
            'propuestas' => DB::table('gp_postulacion_propuestas')->where('postulacion_id', $postulation->id)->orderBy('id')->get(),
        ];
    }

    public function savePostulationItem(User $user, Postulacion $postulation, string $section, array $data, ?int $itemId): object
    {
        $scope = $this->authorizePostulation($user, $postulation, ['gp.convocatorias.postular']);
        $table = self::SECTION_TABLES[$section] ?? null;
        if (! $table) {
            throw ValidationException::withMessages(['seccion' => 'La sección de postulación no es válida.']);
        }

        return DB::transaction(function () use ($postulation, $section, $table, $data, $itemId, $scope): object {
            $locked = Postulacion::query()->lockForUpdate()->findOrFail($postulation->id);
            $this->assertEditablePostulation($locked);
            $now = now();

            if ($itemId) {
                $item = DB::table($table)->where('id', $itemId)->where('postulacion_id', $locked->id)->lockForUpdate()->first();
                if (! $item) {
                    abort(404);
                }
                unset($data['postulacion_id'], $data['tipo']);
                $this->enrichDocumentData($section, $data, $scope->accountId);
                DB::table($table)->where('id', $itemId)->update($data + ['updated_at' => $now]);

                return DB::table($table)->where('id', $itemId)->first();
            }

            $required = match ($section) {
                'checklist' => ['categoria', 'titulo'],
                'documentos' => ['nombre'],
                'propuestas' => ['tipo'],
            };
            foreach ($required as $field) {
                if (blank($data[$field] ?? null)) {
                    throw ValidationException::withMessages([$field => 'Este campo es obligatorio.']);
                }
            }
            $this->enrichDocumentData($section, $data, $scope->accountId, true);
            $id = DB::table($table)->insertGetId($data + [
                'postulacion_id' => $locked->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return DB::table($table)->where('id', $id)->first();
        });
    }

    public function finishPreparation(User $user, Postulacion $postulation): array
    {
        $scope = $this->authorizePostulation($user, $postulation, ['gp.convocatorias.postular']);

        return DB::transaction(function () use ($postulation, $scope): array {
            $locked = Postulacion::query()->lockForUpdate()->findOrFail($postulation->id);
            $this->assertEditablePostulation($locked);
            $pendingChecklist = DB::table('gp_postulacion_checklist')->where('postulacion_id', $locked->id)
                ->where('requerido', true)->where('completado', false)->exists();
            $invalidDocuments = DB::table('gp_postulacion_documentos')->where('postulacion_id', $locked->id)
                ->where('estado', '!=', 'validado')->exists();
            $proposals = DB::table('gp_postulacion_propuestas')->where('postulacion_id', $locked->id)->get();
            if ($pendingChecklist || $invalidDocuments || $proposals->count() !== 2 || $proposals->contains(fn ($item) => $item->estado !== 'completada')) {
                throw ValidationException::withMessages(['postulacion' => 'Completa el checklist, valida los documentos y completa la propuesta y el presupuesto.']);
            }
            $locked->update(['estado' => 'lista_para_enviar']);
            $convocatoria = Convocatoria::query()->findOrFail($locked->convocatoria_id);
            $this->history($convocatoria, $scope, 'postulacion_lista_para_envio');

            return $this->postulationData($locked->refresh()->load('enviada.persona:id,nombres,apellidos'));
        });
    }

    public function registerShipment(User $user, Postulacion $postulation, array $data): array
    {
        $scope = $this->authorizePostulation($user, $postulation, ['gp.convocatorias.postular']);

        return DB::transaction(function () use ($postulation, $data, $scope): array {
            $locked = Postulacion::query()->lockForUpdate()->findOrFail($postulation->id);
            if ($locked->estado !== 'lista_para_enviar') {
                throw ValidationException::withMessages(['postulacion' => 'La postulación debe estar lista antes de registrar el envío.']);
            }
            $responseDate = CarbonImmutable::parse($data['fecha_envio'])
                ->addDays((int) $data['plazo_respuesta_dias'])
                ->toDateString();
            unset($data['plazo_respuesta_dias']);
            $locked->update($data + ['estado' => 'enviada', 'enviada_por' => $scope->accountId]);
            $trackingId = DB::table('gp_postulacion_seguimientos')->insertGetId([
                'postulacion_id' => $locked->id,
                'estado' => 'en_seguimiento',
                'fecha_inicio' => now(),
                'fecha_estimada_decision' => $responseDate,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->event(
                $trackingId,
                $scope->accountId,
                'seguimiento_iniciado',
                'El seguimiento se inició automáticamente al registrar el envío al equipo IDEAR.'
            );
            $convocatoria = Convocatoria::query()->lockForUpdate()->findOrFail($locked->convocatoria_id);
            $this->transition($convocatoria, $scope, 'postulacion_enviada', 'enviada', 'seguimiento', $data['observaciones'] ?? null);

            return $this->postulationData($locked->refresh()->load('enviada.persona:id,nombres,apellidos'));
        });
    }

    public function availableUsers(User $user): array
    {
        $scope = $this->authorization->scope($user, ['gp.convocatorias.postular']);

        return DB::table('cuentas_acceso as ca')
            ->join('personas as p', 'p.id', '=', 'ca.persona_id')
            ->join('integrantes as i', function ($join): void {
                $join->on('i.persona_id', '=', 'ca.persona_id')->where('i.estado', 'Activo');
            })
            ->join('integrantes_historial as ih', function ($join): void {
                $join->on('ih.integrante_id', '=', 'i.id')->where('ih.estado', 'Activo');
            })
            ->join('cargos as c', function ($join): void {
                $join->on('c.id', '=', 'ih.cargo_id')->where('c.activo', true);
            })
            ->where('ca.activo', true)->orderBy('p.nombres')->orderBy('p.apellidos')
            ->when(! $scope->global, fn ($query) => $query->where('c.area_id', $scope->areaId))
            ->distinct()
            ->get(['ca.id', 'p.nombres', 'p.apellidos'])
            ->map(fn ($item) => ['id' => $item->id, 'persona' => ['nombres' => $item->nombres, 'apellidos' => $item->apellidos]])
            ->all();
    }

    public function uploadDocument(User $user, Postulacion $postulation, UploadedFile $file): string
    {
        $this->authorizePostulation($user, $postulation, ['gp.convocatorias.postular']);
        $this->assertEditablePostulation($postulation);

        return $file->store("gestion-proyectos/postulaciones/{$postulation->id}");
    }

    public function deleteDocument(User $user, string $path): void
    {
        if (! preg_match('#^gestion-proyectos/postulaciones/(\d+)/[^/]+$#', $path, $matches)) {
            throw ValidationException::withMessages(['path' => 'La ruta del documento no es válida.']);
        }
        $postulation = Postulacion::query()->findOrFail((int) $matches[1]);
        $this->authorizePostulation($user, $postulation, ['gp.convocatorias.postular']);
        $referenced = DB::table('gp_postulacion_documentos')->where('archivo_url', $path)->exists();
        if ($referenced) {
            throw ValidationException::withMessages(['path' => 'No se puede eliminar un archivo asociado a un documento.']);
        }
        Storage::delete($path);
    }

    public function documentFile(User $user, int $documentId): array
    {
        $document = DB::table('gp_postulacion_documentos')->where('id', $documentId)->first();
        if (! $document) {
            abort(404);
        }
        $postulation = Postulacion::query()->findOrFail($document->postulacion_id);
        $this->authorizePostulation($user, $postulation, [
            'gp.convocatorias.postular', 'gp.convocatorias.ver_postulacion', 'gp.convocatorias.ver_envio',
        ]);
        if (! $document->archivo_url || ! Storage::exists($document->archivo_url)) {
            abort(404, 'El archivo del documento no está disponible.');
        }
        $extension = pathinfo($document->archivo_url, PATHINFO_EXTENSION);
        $name = Str::slug($document->nombre ?: 'documento').($extension ? ".{$extension}" : '');

        return ['path' => $document->archivo_url, 'name' => $name];
    }

    public function tracking(User $user, Postulacion $postulation): ?object
    {
        $this->authorizePostulation($user, $postulation, [
            'gp.convocatorias.postular', 'gp.convocatorias.ver_seguimiento', 'gp.convocatorias.ver_cierre',
        ]);

        return DB::table('gp_postulacion_seguimientos')->where('postulacion_id', $postulation->id)->first();
    }

    public function trackingDetail(User $user, int $trackingId): array
    {
        $tracking = $this->authorizedTracking($user, $trackingId, [
            'gp.convocatorias.postular', 'gp.convocatorias.ver_seguimiento', 'gp.convocatorias.ver_cierre',
        ]);

        $events = DB::table('gp_postulacion_seguimiento_eventos as e')
            ->leftJoin('cuentas_acceso as ca', 'ca.id', '=', 'e.registrado_por')
            ->leftJoin('personas as p', 'p.id', '=', 'ca.persona_id')
            ->where('e.seguimiento_id', $trackingId)->orderByDesc('e.fecha_evento')
            ->get(['e.*', 'p.nombres', 'p.apellidos'])
            ->map(fn ($item) => [...(array) $item, 'registrado' => $item->nombres ? ['persona' => ['nombres' => $item->nombres, 'apellidos' => $item->apellidos]] : null])
            ->map(function (array $item) {
                unset($item['nombres'], $item['apellidos']);

                return $item;
            })->values();
        $requests = DB::table('gp_postulacion_solicitudes as s')
            ->leftJoin('cuentas_acceso as ca', 'ca.id', '=', 's.responsable_id')
            ->leftJoin('personas as p', 'p.id', '=', 'ca.persona_id')
            ->where('s.seguimiento_id', $trackingId)->orderByRaw('s.fecha_limite IS NULL')->orderBy('s.fecha_limite')
            ->get(['s.*', 'p.nombres', 'p.apellidos'])
            ->map(fn ($item) => [...(array) $item, 'responsable' => $item->nombres ? ['persona' => ['nombres' => $item->nombres, 'apellidos' => $item->apellidos]] : null])
            ->map(function (array $item) {
                unset($item['nombres'], $item['apellidos']);

                return $item;
            })->values();

        return [
            'seguimiento' => $tracking,
            'eventos' => $events,
            'comunicaciones' => DB::table('gp_postulacion_comunicaciones')->where('seguimiento_id', $trackingId)->latest('fecha')->get(),
            'solicitudes' => $requests,
        ];
    }

    public function addEvent(User $user, int $trackingId, array $data): object
    {
        $scope = $this->authorizeOpenTracking($user, $trackingId);
        $id = $this->event($trackingId, $scope->accountId, $data['tipo'], $data['descripcion'] ?? null, $data['fecha_evento'] ?? null);

        return DB::table('gp_postulacion_seguimiento_eventos')->where('id', $id)->first();
    }

    public function saveCommunication(User $user, int $trackingId, array $data, ?int $communicationId): object
    {
        $scope = $this->authorizeOpenTracking($user, $trackingId);
        $now = now();
        $data['requiere_respuesta'] = (bool) ($data['requiere_respuesta'] ?? false);

        if ($communicationId) {
            $exists = DB::table('gp_postulacion_comunicaciones')->where('id', $communicationId)
                ->where('seguimiento_id', $trackingId)->exists();
            if (! $exists) {
                abort(404);
            }
            DB::table('gp_postulacion_comunicaciones')->where('id', $communicationId)->update($data + ['updated_at' => $now]);
            $id = $communicationId;
        } else {
            $id = DB::table('gp_postulacion_comunicaciones')->insertGetId($data + [
                'seguimiento_id' => $trackingId, 'registrado_por' => $scope->accountId,
                'fecha' => $data['fecha'] ?? $now, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        if ($data['requiere_respuesta']) {
            DB::table('gp_postulacion_seguimientos')->where('id', $trackingId)->update(['estado' => 'requiere_respuesta', 'updated_at' => $now]);
        }
        $this->event($trackingId, $scope->accountId, $communicationId ? 'comunicacion_actualizada' : 'comunicacion_registrada', $data['resumen']);

        return DB::table('gp_postulacion_comunicaciones')->where('id', $id)->first();
    }

    public function deleteCommunication(User $user, int $trackingId, int $communicationId): void
    {
        $scope = $this->authorizeOpenTracking($user, $trackingId);
        $deleted = DB::table('gp_postulacion_comunicaciones')->where('id', $communicationId)
            ->where('seguimiento_id', $trackingId)->delete();
        if (! $deleted) {
            abort(404);
        }
        $this->event($trackingId, $scope->accountId, 'comunicacion_eliminada', 'Se eliminó una comunicación del seguimiento.');
    }

    public function saveRequest(User $user, int $trackingId, array $data, ?int $requestId): object
    {
        $scope = $this->authorizeOpenTracking($user, $trackingId);
        $now = now();
        if ($requestId) {
            $exists = DB::table('gp_postulacion_solicitudes')->where('id', $requestId)->where('seguimiento_id', $trackingId)->exists();
            if (! $exists) {
                abort(404);
            }
            DB::table('gp_postulacion_solicitudes')->where('id', $requestId)->update($data + ['updated_at' => $now]);
            $id = $requestId;
        } else {
            $id = DB::table('gp_postulacion_solicitudes')->insertGetId($data + [
                'seguimiento_id' => $trackingId, 'estado' => 'pendiente',
                'fecha_recepcion' => $data['fecha_recepcion'] ?? $now,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        DB::table('gp_postulacion_seguimientos')->where('id', $trackingId)->update(['estado' => 'requiere_respuesta', 'updated_at' => $now]);
        $this->event($trackingId, $scope->accountId, $requestId ? 'solicitud_actualizada' : 'solicitud_registrada', $data['descripcion']);

        return DB::table('gp_postulacion_solicitudes')->where('id', $id)->first();
    }

    public function respondRequest(User $user, int $requestId, array $data): object
    {
        $request = DB::table('gp_postulacion_solicitudes')->where('id', $requestId)->first();
        if (! $request) {
            abort(404);
        }
        $scope = $this->authorizeOpenTracking($user, (int) $request->seguimiento_id);
        if ($request->estado !== 'pendiente') {
            throw ValidationException::withMessages(['solicitud' => 'La solicitud ya fue resuelta.']);
        }
        $cancel = (bool) ($data['cancelar'] ?? false);
        if (! $cancel && blank($data['respuesta'] ?? null)) {
            throw ValidationException::withMessages(['respuesta' => 'La respuesta es obligatoria.']);
        }
        DB::table('gp_postulacion_solicitudes')->where('id', $requestId)->update([
            'estado' => $cancel ? 'cancelada' : 'respondida',
            'respuesta' => $data['respuesta'] ?? null,
            'evidencia' => $data['evidencia'] ?? null,
            'fecha_respuesta' => now(), 'updated_at' => now(),
        ]);
        $pending = DB::table('gp_postulacion_solicitudes')->where('seguimiento_id', $request->seguimiento_id)->where('estado', 'pendiente')->exists();
        if (! $pending) {
            DB::table('gp_postulacion_seguimientos')->where('id', $request->seguimiento_id)->where('estado', 'requiere_respuesta')->update(['estado' => 'en_seguimiento', 'updated_at' => now()]);
        }
        $this->event((int) $request->seguimiento_id, $scope->accountId, $cancel ? 'solicitud_cancelada' : 'solicitud_respondida', $data['respuesta'] ?? null);

        return DB::table('gp_postulacion_solicitudes')->where('id', $requestId)->first();
    }

    public function registerResult(User $user, int $trackingId, array $data): object
    {
        $scope = $this->authorizeOpenTracking($user, $trackingId);

        return DB::transaction(function () use ($trackingId, $data, $scope): object {
            $tracking = DB::table('gp_postulacion_seguimientos')->where('id', $trackingId)->lockForUpdate()->first();
            if (! in_array($tracking->estado, ['en_seguimiento', 'requiere_respuesta'], true)) {
                throw ValidationException::withMessages(['seguimiento' => 'El resultado ya fue registrado o el seguimiento no admite cambios.']);
            }
            if (DB::table('gp_postulacion_solicitudes')->where('seguimiento_id', $trackingId)->where('estado', 'pendiente')->exists()) {
                throw ValidationException::withMessages(['seguimiento' => 'Responde o cancela las solicitudes pendientes antes de registrar el resultado.']);
            }
            if (! empty($data['comunicacion_id']) && ! DB::table('gp_postulacion_comunicaciones')->where('id', $data['comunicacion_id'])->where('seguimiento_id', $trackingId)->exists()) {
                throw ValidationException::withMessages(['comunicacion_id' => 'La comunicación no pertenece a este seguimiento.']);
            }
            DB::table('gp_postulacion_seguimientos')->where('id', $trackingId)->update([
                'estado' => 'cerrado', 'tipo_resultado' => $data['tipo_resultado'],
                'fecha_resultado' => $data['fecha'], 'observacion_resultado' => $data['observacion'] ?? null,
                'evidencia_resultado' => $data['evidencia'] ?? null,
                'comunicacion_resultado_id' => $data['comunicacion_id'] ?? null,
                'fecha_cierre' => $data['fecha'], 'cerrado_por' => $scope->accountId,
                'motivo_cierre' => $data['observacion'] ?? null, 'updated_at' => now(),
            ]);
            $postulation = Postulacion::query()->findOrFail($tracking->postulacion_id);
            $convocatoria = Convocatoria::query()->lockForUpdate()->findOrFail($postulation->convocatoria_id);
            $convocatoria->update([
                'resultado_final' => $data['tipo_resultado'],
                'motivo_descarte' => null,
                'cerrada_at' => $data['fecha'],
                'cerrada_por' => $scope->accountId,
            ]);
            $this->transition(
                $convocatoria,
                $scope,
                'cerrada_'.$data['tipo_resultado'],
                'cerrada',
                'cierre',
                $data['observacion'] ?? null,
            );
            $this->history($convocatoria, $scope, 'resultado_'.$data['tipo_resultado'], $data['observacion'] ?? null);
            $this->event($trackingId, $scope->accountId, 'resultado_registrado', $data['observacion'] ?? $data['tipo_resultado']);

            return DB::table('gp_postulacion_seguimientos')->where('id', $trackingId)->first();
        });
    }

    public function archive(User $user, Convocatoria $convocatoria, string $reason): Convocatoria
    {
        $scope = $this->authorizeConvocatoria($user, ['gp.convocatorias.archivar'], $convocatoria);

        return DB::transaction(function () use ($convocatoria, $scope, $reason): Convocatoria {
            $locked = Convocatoria::query()->lockForUpdate()->findOrFail($convocatoria->id);
            if ($locked->estado === 'archivada') {
                throw ValidationException::withMessages(['convocatoria' => 'La convocatoria ya está archivada.']);
            }
            if ($locked->estado !== 'cerrada' || $locked->etapa !== 'cierre' || ! $locked->resultado_final) {
                throw ValidationException::withMessages(['convocatoria' => 'Cierra la convocatoria con un resultado antes de archivarla.']);
            }
            $this->transition($locked, $scope, 'archivada', 'archivada', 'cierre', $reason);
            $locked->update(['archivada_at' => now(), 'archivada_por' => $scope->accountId]);

            return $locked->refresh();
        });
    }

    public function restore(User $user, Convocatoria $convocatoria): Convocatoria
    {
        $scope = $this->authorizeConvocatoria($user, ['gp.convocatorias.archivar'], $convocatoria);

        return DB::transaction(function () use ($convocatoria, $scope): Convocatoria {
            $locked = Convocatoria::query()->lockForUpdate()->findOrFail($convocatoria->id);
            if ($locked->estado !== 'archivada') {
                throw ValidationException::withMessages(['convocatoria' => 'Solo una convocatoria archivada puede restaurarse.']);
            }
            $archiveEvent = ConvocatoriaHistorial::query()
                ->where('convocatoria_id', $locked->id)
                ->where('accion', 'archivada')
                ->latest('id')
                ->first();
            if (! $archiveEvent?->estado_anterior || ! $archiveEvent?->etapa_anterior) {
                throw ValidationException::withMessages(['convocatoria' => 'No se encontró una transición de archivo válida para restaurar.']);
            }
            $this->transition(
                $locked,
                $scope,
                'restaurada',
                $archiveEvent->estado_anterior,
                $archiveEvent->etapa_anterior,
                'Convocatoria restaurada desde el archivo.',
            );
            $locked->update(['archivada_at' => null, 'archivada_por' => null]);

            return $locked->refresh();
        });
    }

    private function authorizeConvocatoria(User $user, array $permissions, Convocatoria $convocatoria): AuthorizationScope
    {
        $scope = $this->authorization->scope($user, $permissions);
        if (! $scope->global && (int) $scope->areaId !== (int) $convocatoria->area_id) {
            throw new AuthorizationException('No puedes gestionar convocatorias fuera del alcance de tu área.');
        }
        if (! $scope->accessTotal) {
            $membership = $this->authorization->teamMembership($scope->accountId);
            if ($membership && (int) $membership->equipo_id !== (int) $convocatoria->equipo_id) {
                throw new AuthorizationException('No tienes acceso a esta convocatoria.');
            }
        }

        return $scope;
    }

    private function authorizePostulation(User $user, Postulacion $postulation, array $permissions): AuthorizationScope
    {
        return $this->authorizeConvocatoria($user, $permissions, Convocatoria::query()->findOrFail($postulation->convocatoria_id));
    }

    private function authorizedTracking(User $user, int $trackingId, array $permissions): object
    {
        $tracking = DB::table('gp_postulacion_seguimientos')->where('id', $trackingId)->first();
        if (! $tracking) {
            abort(404);
        }
        $postulation = Postulacion::query()->findOrFail($tracking->postulacion_id);
        $this->authorizePostulation($user, $postulation, $permissions);

        return $tracking;
    }

    private function authorizeOpenTracking(User $user, int $trackingId): AuthorizationScope
    {
        $tracking = $this->authorizedTracking($user, $trackingId, ['gp.convocatorias.postular']);
        if ($tracking->estado === 'cerrado') {
            throw ValidationException::withMessages(['seguimiento' => 'El seguimiento está cerrado.']);
        }

        return $this->authorization->scope($user, ['gp.convocatorias.postular']);
    }

    private function passedFilter(int $convocatoriaId, string $type): bool
    {
        $items = ConvocatoriaEvaluacion::query()->where('convocatoria_id', $convocatoriaId)->where('tipo_filtro', $type)->get();

        return $items->count() === 8 && $items->every(fn ($item) => $item->estado_revision === 'cumple');
    }

    private function seedPostulation(int $postulationId): void
    {
        $now = now();
        $checklist = [
            ['LEGAL', 'Requisitos legales e institucionales verificados'],
            ['TECNICO', 'Propuesta técnica completa'],
            ['FINANCIERO', 'Presupuesto completo'],
            ['ENVIO', 'Registro y acceso a la plataforma confirmados'],
        ];
        DB::table('gp_postulacion_checklist')->insert(collect($checklist)->map(fn ($item, $index) => [
            'postulacion_id' => $postulationId, 'categoria' => $item[0], 'titulo' => $item[1],
            'requerido' => true, 'completado' => false, 'orden' => $index + 1,
            'created_at' => $now, 'updated_at' => $now,
        ])->all());
        DB::table('gp_postulacion_propuestas')->insert([
            ['postulacion_id' => $postulationId, 'tipo' => 'proposal', 'estado' => 'pendiente', 'created_at' => $now, 'updated_at' => $now],
            ['postulacion_id' => $postulationId, 'tipo' => 'budget', 'estado' => 'pendiente', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    private function assertEditablePostulation(Postulacion $postulation): void
    {
        if (! in_array($postulation->estado, ['en_preparacion', 'en_revision'], true)) {
            throw ValidationException::withMessages(['postulacion' => 'La preparación de esta postulación ya no se puede modificar.']);
        }
    }

    private function enrichDocumentData(string $section, array &$data, string $accountId, bool $creating = false): void
    {
        if ($section !== 'documentos') {
            return;
        }
        if (! empty($data['archivo_url'])) {
            $data['fecha_carga'] = now();
            $data['cargado_por'] = $accountId;
        }
        if (($data['estado'] ?? null) === 'validado') {
            $data['fecha_validacion'] = now();
            $data['validado_por'] = $accountId;
        }
        if ($creating) {
            $data['categoria'] ??= 'otros';
        }
    }

    private function transition(Convocatoria $convocatoria, AuthorizationScope $scope, string $action, string $state, string $stage, ?string $note = null): void
    {
        [$previousState, $previousStage] = [$convocatoria->estado, $convocatoria->etapa];
        $convocatoria->update(['estado' => $state, 'etapa' => $stage]);
        ConvocatoriaHistorial::query()->create([
            'convocatoria_id' => $convocatoria->id, 'accion' => $action,
            'estado_anterior' => $previousState, 'estado_nuevo' => $state,
            'etapa_anterior' => $previousStage, 'etapa_nueva' => $stage,
            'observacion' => $note, 'actor_id' => $scope->accountId,
        ]);
    }

    private function history(Convocatoria $convocatoria, AuthorizationScope $scope, string $action, ?string $note = null): void
    {
        ConvocatoriaHistorial::query()->create([
            'convocatoria_id' => $convocatoria->id, 'accion' => $action,
            'estado_nuevo' => $convocatoria->estado, 'etapa_nueva' => $convocatoria->etapa,
            'observacion' => $note, 'actor_id' => $scope->accountId,
        ]);
    }

    private function event(int $trackingId, string $accountId, string $type, ?string $description, mixed $date = null): int
    {
        return DB::table('gp_postulacion_seguimiento_eventos')->insertGetId([
            'seguimiento_id' => $trackingId, 'tipo' => $type,
            'fecha_evento' => $date ?: now(), 'descripcion' => $description,
            'registrado_por' => $accountId, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function approvalData(ConvocatoriaAprobacion $approval): array
    {
        return [...$approval->attributesToArray(), 'decisor' => $this->accountData($approval->decisor)];
    }

    private function postulationData(Postulacion $postulation): array
    {
        return [...$postulation->attributesToArray(), 'enviada' => $this->accountData($postulation->enviada)];
    }

    private function accountData($account): ?array
    {
        if (! $account) {
            return null;
        }

        return ['id' => $account->id, 'persona' => $account->persona ? [
            'nombres' => $account->persona->nombres, 'apellidos' => $account->persona->apellidos,
        ] : null];
    }
}
