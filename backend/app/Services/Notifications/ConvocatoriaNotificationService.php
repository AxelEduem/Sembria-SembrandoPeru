<?php

namespace App\Services\Notifications;

use App\Models\NotificacionAsistencia;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ConvocatoriaNotificationService
{
    private const TIMEZONE = 'America/Lima';

    private const CLOSING_MILESTONES = [30, 15, 7, 3, 1];

    public function generateAll(?CarbonImmutable $date = null): int
    {
        if (! $this->requiredTablesExist()) {
            return 0;
        }

        $today = ($date ?? CarbonImmutable::now(self::TIMEZONE))->startOfDay();
        $calls = DB::table('gp_convocatorias')
            ->whereNull('resultado_final')
            ->whereNotIn('estado', ['cerrada', 'archivada'])
            ->get(['id', 'equipo_id', 'nombre', 'fecha_cierre', 'registrada_por', 'etapa']);

        if ($calls->isEmpty()) {
            return 0;
        }

        $accountUsers = DB::table('cuentas_acceso')
            ->where('activo', true)
            ->whereNotNull('user_id')
            ->pluck('user_id', 'id');
        $leaderUsers = $this->leaderUsers($calls, $accountUsers);
        $evaluations = DB::table('gp_convocatoria_evaluaciones')
            ->whereIn('convocatoria_id', $calls->pluck('id'))
            ->get(['convocatoria_id', 'tipo_filtro', 'estado_revision'])
            ->groupBy('convocatoria_id');
        $approvedCallIds = DB::table('gp_convocatoria_aprobaciones')
            ->whereIn('convocatoria_id', $calls->pluck('id'))
            ->pluck('convocatoria_id')
            ->mapWithKeys(fn ($id): array => [(int) $id => true]);

        $created = 0;
        $summary = [];

        foreach ($calls as $call) {
            $recipients = $this->callRecipients($call, $accountUsers, $leaderUsers);
            $daysRemaining = $call->fecha_cierre
                ? (int) $today->diffInDays(CarbonImmutable::parse($call->fecha_cierre, self::TIMEZONE), false)
                : null;

            if ($daysRemaining !== null && in_array($daysRemaining, self::CLOSING_MILESTONES, true)) {
                $created += $this->notifyRecipients(
                    $recipients,
                    "gp_convocatoria_cierre_{$daysRemaining}_dias",
                    $daysRemaining === 1 ? 'Convocatoria cierra mañana' : "Convocatoria cierra en {$daysRemaining} días",
                    "{$call->nombre} cierra el ".CarbonImmutable::parse($call->fecha_cierre)->format('d/m/Y').'.',
                    "convocatoria-{$call->id}-cierre-{$daysRemaining}",
                );
                $this->addToSummary($summary, $recipients, 'cierres');
            }

            $filter = match ($call->etapa) {
                'deteccion' => 'primer_filtro',
                'segundo_filtro' => 'segundo_filtro',
                default => null,
            };
            if ($filter !== null && $this->evaluationIsPending($evaluations->get($call->id, collect()), $filter)) {
                $filterName = $filter === 'primer_filtro' ? 'primer filtro' : 'segundo filtro';
                $created += $this->notifyRecipients(
                    $recipients,
                    'gp_convocatoria_evaluacion_pendiente',
                    'Evaluación pendiente',
                    "{$call->nombre} tiene pendiente el {$filterName}.",
                    "convocatoria-{$call->id}-evaluacion-{$filter}",
                );
                $this->addToSummary($summary, $recipients, 'evaluaciones');
            }

            if ($call->etapa === 'aprobacion' && ! $approvedCallIds->has((int) $call->id)) {
                $created += $this->notifyRecipients(
                    $recipients,
                    'gp_convocatoria_aprobacion_pendiente',
                    'Aprobación pendiente',
                    "{$call->nombre} espera una decisión de aprobación.",
                    "convocatoria-{$call->id}-aprobacion",
                );
                $this->addToSummary($summary, $recipients, 'aprobaciones');
            }
        }

        $created += $this->generateRequestNotifications(
            $calls,
            $accountUsers,
            $leaderUsers,
            $today,
            $summary,
        );

        foreach ($summary as $userId => $counts) {
            $created += $this->notify(
                (int) $userId,
                'gp_convocatoria_resumen_critico',
                'Resumen diario de convocatorias',
                'Tienes '.implode(', ', $this->summaryFragments($counts)).' que requieren atención.',
                "convocatorias-resumen-{$today->toDateString()}",
            );
        }

        return $created;
    }

    private function requiredTablesExist(): bool
    {
        foreach ([
            'gp_convocatorias',
            'gp_convocatoria_evaluaciones',
            'gp_convocatoria_aprobaciones',
            'gp_postulaciones',
            'gp_postulacion_seguimientos',
            'gp_postulacion_solicitudes',
            'gp_equipo_integrantes',
            'integrantes',
            'cuentas_acceso',
            'notificaciones_asistencia',
        ] as $table) {
            if (! Schema::hasTable($table)) {
                return false;
            }
        }

        return true;
    }

    private function leaderUsers(Collection $calls, Collection $accountUsers): Collection
    {
        $teamIds = $calls->pluck('equipo_id')->filter()->unique();
        if ($teamIds->isEmpty()) {
            return collect();
        }

        return DB::table('gp_equipo_integrantes as member')
            ->join('integrantes as integrante', 'integrante.id', '=', 'member.integrante_id')
            ->join('cuentas_acceso as account', function ($join): void {
                $join->on('account.persona_id', '=', 'integrante.persona_id')
                    ->where('account.activo', true)
                    ->whereNotNull('account.user_id');
            })
            ->whereIn('member.equipo_id', $teamIds)
            ->where('member.rol', 'lider')
            ->where('integrante.estado', 'Activo')
            ->get(['member.equipo_id', 'account.id as account_id'])
            ->groupBy('equipo_id')
            ->map(fn (Collection $rows): Collection => $rows
                ->map(fn ($row) => $accountUsers->get($row->account_id))
                ->filter()
                ->map(fn ($id): int => (int) $id)
                ->unique()
                ->values());
    }

    private function callRecipients(object $call, Collection $accountUsers, Collection $leaderUsers): Collection
    {
        return collect([$accountUsers->get($call->registrada_por)])
            ->merge($leaderUsers->get($call->equipo_id, collect()))
            ->filter()
            ->map(fn ($id): int => (int) $id)
            ->unique()
            ->values();
    }

    private function evaluationIsPending(Collection $evaluations, string $filter): bool
    {
        $filterEvaluations = $evaluations->where('tipo_filtro', $filter);

        return $filterEvaluations->isEmpty() || $filterEvaluations->contains('estado_revision', 'pendiente');
    }

    private function generateRequestNotifications(
        Collection $calls,
        Collection $accountUsers,
        Collection $leaderUsers,
        CarbonImmutable $today,
        array &$summary,
    ): int {
        $callsById = $calls->keyBy('id');
        $requests = DB::table('gp_postulacion_solicitudes as request')
            ->join('gp_postulacion_seguimientos as tracking', 'tracking.id', '=', 'request.seguimiento_id')
            ->join('gp_postulaciones as postulation', 'postulation.id', '=', 'tracking.postulacion_id')
            ->whereIn('postulation.convocatoria_id', $calls->pluck('id'))
            ->where('request.estado', 'pendiente')
            ->get([
                'request.id',
                'request.descripcion',
                'request.responsable_id',
                'request.fecha_limite',
                'postulation.convocatoria_id',
            ]);

        $created = 0;
        foreach ($requests as $request) {
            $call = $callsById->get($request->convocatoria_id);
            if ($call === null) {
                continue;
            }

            $responsible = $accountUsers->get($request->responsable_id)
                ?? $accountUsers->get($call->registrada_por);
            $recipients = collect([$responsible])
                ->merge($leaderUsers->get($call->equipo_id, collect()))
                ->filter()
                ->map(fn ($id): int => (int) $id)
                ->unique()
                ->values();
            $deadline = $request->fecha_limite
                ? CarbonImmutable::parse($request->fecha_limite, self::TIMEZONE)
                : null;
            $title = $deadline?->lt($today) ? 'Solicitud vencida' : 'Solicitud pendiente';
            $deadlineText = $deadline ? " Fecha límite: {$deadline->format('d/m/Y')}." : '';

            $created += $this->notifyRecipients(
                $recipients,
                'gp_convocatoria_solicitud_pendiente',
                $title,
                "{$call->nombre}: {$request->descripcion}.{$deadlineText}",
                "convocatoria-solicitud-{$request->id}",
            );
            $this->addToSummary($summary, $recipients, 'solicitudes');
        }

        return $created;
    }

    private function notifyRecipients(
        Collection $recipients,
        string $type,
        string $title,
        string $message,
        string $context,
    ): int {
        $created = 0;
        foreach ($recipients as $userId) {
            $created += $this->notify((int) $userId, $type, $title, $message, $context);
        }

        return $created;
    }

    private function addToSummary(array &$summary, Collection $recipients, string $category): void
    {
        foreach ($recipients as $userId) {
            $summary[$userId] ??= [
                'cierres' => 0,
                'evaluaciones' => 0,
                'aprobaciones' => 0,
                'solicitudes' => 0,
            ];
            $summary[$userId][$category]++;
        }
    }

    private function summaryFragments(array $counts): array
    {
        $labels = [
            'cierres' => ['cierre próximo', 'cierres próximos'],
            'evaluaciones' => ['evaluación pendiente', 'evaluaciones pendientes'],
            'aprobaciones' => ['aprobación pendiente', 'aprobaciones pendientes'],
            'solicitudes' => ['solicitud pendiente', 'solicitudes pendientes'],
        ];

        return collect($counts)
            ->filter(fn (int $count): bool => $count > 0)
            ->map(fn (int $count, string $category): string => $count.' '.$labels[$category][$count === 1 ? 0 : 1])
            ->values()
            ->all();
    }

    private function notify(int $userId, string $type, string $title, string $message, string $context): int
    {
        return NotificacionAsistencia::query()->firstOrCreate(
            ['clave' => "institucional-{$userId}-{$context}"],
            [
                'user_id' => $userId,
                'tipo' => $type,
                'titulo' => $title,
                'mensaje' => $message,
            ],
        )->wasRecentlyCreated ? 1 : 0;
    }
}
