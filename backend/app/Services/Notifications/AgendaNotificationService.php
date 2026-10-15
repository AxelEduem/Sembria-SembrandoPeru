<?php

namespace App\Services\Notifications;

use App\Models\AgendaMeeting;
use App\Models\CuentaAcceso;
use App\Models\NotificacionAsistencia;
use App\Models\User;
use Carbon\CarbonImmutable;

class AgendaNotificationService
{
    private const TIMEZONE = 'America/Lima';

    private const UPCOMING_DAYS = 7;

    public function generateAll(): int
    {
        $created = 0;
        User::query()
            ->whereHas('cuentaAcceso', fn ($query) => $query->where('activo', true))
            ->eachById(function (User $user) use (&$created): void {
                $created += $this->generateRemindersForUser($user);
            });

        return $created;
    }

    public function generateRemindersForUser(User $user): int
    {
        $accountId = CuentaAcceso::query()
            ->where('user_id', $user->id)
            ->where('activo', true)
            ->value('id');

        if ($accountId === null) {
            return 0;
        }

        $now = CarbonImmutable::now(self::TIMEZONE);
        $today = $now->startOfDay();
        $meetings = AgendaMeeting::query()
            ->where('estado', 'confirmada')
            ->whereBetween('fecha', [
                $today->toDateString(),
                $today->addDays(self::UPCOMING_DAYS)->toDateString(),
            ])
            ->whereHas('participants', fn ($query) => $query
                ->where('cuenta_id', $accountId)
                ->where('estado', 'aceptada'))
            ->orderBy('fecha')
            ->orderBy('hora_inicio')
            ->get();

        $created = 0;
        foreach ($meetings as $meeting) {
            $start = $this->startsAt($meeting);
            $end = $this->endsAt($meeting);
            if ($end->lte($now)) {
                continue;
            }

            $isToday = $start->isSameDay($today);
            $created += $this->notify(
                $user->id,
                $isToday ? 'agenda_actividad_hoy' : 'agenda_evento_proximo',
                $isToday ? 'Actividad de agenda para hoy' : 'Evento próximo',
                $isToday
                    ? sprintf('%s comienza hoy a las %s.', $meeting->titulo, $start->format('H:i'))
                    : sprintf(
                        '%s está programada para el %s a las %s.',
                        $meeting->titulo,
                        $start->format('d/m/Y'),
                        $start->format('H:i'),
                    ),
                sprintf(
                    'agenda-recordatorio-%d-%s-%s',
                    $meeting->id,
                    $isToday ? 'hoy' : 'proximo',
                    $start->format('YmdHi'),
                ),
            );
        }

        return $created;
    }

    public function notifyMeetingRequest(AgendaMeeting $meeting): int
    {
        $userIds = $meeting->participants()
            ->join('cuentas_acceso as account', 'account.id', '=', 'agenda_reunion_participantes.cuenta_id')
            ->where('agenda_reunion_participantes.es_organizador', false)
            ->where('agenda_reunion_participantes.estado', 'pendiente')
            ->where('account.activo', true)
            ->whereNotNull('account.user_id')
            ->distinct()
            ->pluck('account.user_id');

        $created = 0;
        foreach ($userIds as $userId) {
            $created += $this->notify(
                (int) $userId,
                'agenda_solicitud_reunion',
                'Nueva solicitud de reunión',
                sprintf(
                    'Te invitaron a %s para el %s a las %s.',
                    $meeting->titulo,
                    $meeting->fecha->format('d/m/Y'),
                    substr((string) $meeting->hora_inicio, 0, 5),
                ),
                "agenda-solicitud-{$meeting->id}",
            );
        }

        return $created;
    }

    public function notifyStatusChange(AgendaMeeting $meeting, string $status): int
    {
        [$type, $title, $message] = match ($status) {
            'confirmada' => [
                'agenda_cambio_confirmada',
                'Agenda actualizada',
                "La reunión {$meeting->titulo} fue confirmada.",
            ],
            'rechazada' => [
                'agenda_cambio_rechazada',
                'Cambio en la agenda',
                "La reunión {$meeting->titulo} no se realizará porque una invitación fue rechazada.",
            ],
            'cancelada' => [
                'agenda_evento_cancelado',
                'Evento cancelado',
                "La reunión {$meeting->titulo} fue cancelada.",
            ],
        };

        $userIds = $meeting->participants()
            ->join('cuentas_acceso as account', 'account.id', '=', 'agenda_reunion_participantes.cuenta_id')
            ->where('account.activo', true)
            ->whereNotNull('account.user_id')
            ->distinct()
            ->pluck('account.user_id');

        $created = 0;
        foreach ($userIds as $userId) {
            $created += $this->notify(
                (int) $userId,
                $type,
                $title,
                $message,
                "agenda-cambio-{$meeting->id}-{$status}",
            );
        }

        return $created;
    }

    private function startsAt(AgendaMeeting $meeting): CarbonImmutable
    {
        return $this->meetingDateTime($meeting, (string) $meeting->hora_inicio);
    }

    private function endsAt(AgendaMeeting $meeting): CarbonImmutable
    {
        return $this->meetingDateTime($meeting, (string) $meeting->hora_fin);
    }

    private function meetingDateTime(AgendaMeeting $meeting, string $time): CarbonImmutable
    {
        $normalizedTime = substr($time, 0, 8);
        if (strlen($normalizedTime) === 5) {
            $normalizedTime .= ':00';
        }

        return CarbonImmutable::createFromFormat(
            'Y-m-d H:i:s',
            $meeting->fecha->format('Y-m-d').' '.$normalizedTime,
            self::TIMEZONE,
        );
    }

    private function notify(int $userId, string $type, string $title, string $message, string $key): int
    {
        return NotificacionAsistencia::query()->firstOrCreate(
            ['clave' => "institucional-{$userId}-{$key}"],
            [
                'user_id' => $userId,
                'tipo' => $type,
                'titulo' => $title,
                'mensaje' => $message,
            ],
        )->wasRecentlyCreated ? 1 : 0;
    }
}
