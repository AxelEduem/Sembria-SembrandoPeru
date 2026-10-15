<?php

namespace App\Services\Agenda;

use App\Models\AgendaMeeting;
use App\Models\AgendaMeetingParticipant;
use App\Models\CuentaAcceso;
use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use App\Models\User;
use App\Services\Notifications\AgendaNotificationService;
use App\Services\Profile\AvatarService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AgendaService
{
    private const MEMBER_TYPES = ['voluntario', 'gerente', 'practicante'];

    public function __construct(
        private readonly AgendaNotificationService $notifications,
    ) {}

    public function people(User $user): array
    {
        $this->activeAccount($user);

        return CuentaAcceso::query()
            ->with('persona')
            ->where('activo', true)
            ->get()
            ->map(fn (CuentaAcceso $account) => $this->personData($account))
            ->filter()
            ->sortBy('nombre', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    public function currentPerson(User $user): ?array
    {
        return $this->personData($this->activeAccount($user));
    }

    public function meetings(User $user): Collection
    {
        $account = $this->activeAccount($user);

        return $this->meetingsFor($account->id)
            ->filter(fn (AgendaMeeting $meeting) => ! $this->isHistorical($meeting))
            ->values();
    }

    public function history(User $user): Collection
    {
        $account = $this->activeAccount($user);

        return $this->meetingsFor($account->id)
            ->filter(fn (AgendaMeeting $meeting) => $this->isHistorical($meeting))
            ->sortByDesc(fn (AgendaMeeting $meeting) => $this->meetingEndsAt($meeting)->getTimestamp())
            ->values();
    }

    public function metrics(User $user): array
    {
        $account = $this->activeAccount($user);

        $meetings = $this->meetingsFor($account->id)
            ->filter(fn (AgendaMeeting $meeting) => $meeting->estado === 'confirmada' && $this->hasEnded($meeting))
            ->values();

        $totalMinutes = $meetings->sum(
            fn (AgendaMeeting $meeting) => $this->meetingDuration($meeting)
        );

        $organized = $meetings->where('creada_por', $account->id)->count();

        $collaborators = $meetings
            ->flatMap(fn (AgendaMeeting $meeting) => $meeting->participants->pluck('cuenta_id'))
            ->reject(fn (string $accountId) => $accountId === $account->id)
            ->unique()
            ->count();

        $byModality = $meetings
            ->countBy('modalidad')
            ->sortDesc()
            ->map(
                fn (int $total, string $name) => [
                    'name' => ucfirst($name),
                    'total' => $total,
                ]
            )
            ->values()
            ->all();

        $byMonth = $meetings
            ->groupBy(fn (AgendaMeeting $meeting) => $meeting->fecha->format('Y-m'))
            ->sortKeys()
            ->map(
                fn (Collection $items, string $month) => [
                    'month' => CarbonImmutable::createFromFormat(
                        'Y-m',
                        $month,
                        'America/Lima'
                    )
                        ->locale('es')
                        ->translatedFormat('M Y'),
                    'total' => $items->count(),
                ]
            )
            ->values()
            ->all();

        return [
            'total_reuniones' => $meetings->count(),
            'organizadas' => $organized,
            'como_participante' => $meetings->count() - $organized,
            'horas_totales' => round($totalMinutes / 60, 1),
            'promedio_minutos' => $meetings->isEmpty()
                ? 0
                : (int) round($totalMinutes / $meetings->count()),
            'colaboradores' => $collaborators,
            'por_modalidad' => $byModality,
            'por_mes' => $byMonth,
        ];
    }

    public function create(User $user, array $data): AgendaMeeting
    {
        $organizer = $this->activeAccount($user);

        $date = CarbonImmutable::createFromFormat(
            'Y-m-d',
            $data['fecha'],
            'America/Lima'
        );

        if ($date->lt(CarbonImmutable::now('America/Lima')->startOfDay())) {
            throw ValidationException::withMessages([
                'fecha' => 'La fecha de la reunión ya pasó.',
            ]);
        }

        $startsAt = CarbonImmutable::createFromFormat(
            'Y-m-d H:i',
            "{$data['fecha']} {$data['hora_inicio']}",
            'America/Lima'
        );

        if ($startsAt->lte(CarbonImmutable::now('America/Lima'))) {
            throw ValidationException::withMessages([
                'hora_inicio' => 'La reunión debe programarse para una hora posterior a la hora actual.',
            ]);
        }

        $guestIds = CuentaAcceso::query()
            ->where('activo', true)
            ->whereIn('id', $data['participantes'])
            ->where('id', '<>', $organizer->id)
            ->pluck('id')
            ->unique()
            ->values();

        if ($guestIds->isEmpty()) {
            throw ValidationException::withMessages([
                'participantes' => 'Selecciona al menos un participante.',
            ]);
        }

        $attendeeIds = $guestIds
            ->concat([$organizer->id])
            ->unique()
            ->sort()
            ->values();

        return DB::transaction(
            function () use (
                $data,
                $organizer,
                $guestIds,
                $attendeeIds,
                $date
            ): AgendaMeeting {
                $this->lockAttendees($attendeeIds->all());

                $this->ensureAvailability(
                    $attendeeIds->all(),
                    $date->isoWeekday(),
                    $data['hora_inicio'],
                    $data['hora_fin'],
                );

                $this->ensureNoConfirmedConflict(
                    $attendeeIds->all(),
                    $data['fecha'],
                    $data['hora_inicio'],
                    $data['hora_fin'],
                    null,
                    'No se puede crear la solicitud. Ya tienen una reunión confirmada en ese horario: '
                );

                $meeting = AgendaMeeting::query()->create([
                    'titulo' => $data['titulo'],
                    'descripcion' => $data['descripcion'] ?? null,
                    'fecha' => $data['fecha'],
                    'hora_inicio' => $data['hora_inicio'],
                    'hora_fin' => $data['hora_fin'],
                    'modalidad' => $data['modalidad'],
                    'ubicacion' => $data['ubicacion'] ?? null,
                    'enlace' => $data['enlace'] ?? null,
                    'estado' => 'pendiente',
                    'creada_por' => $organizer->id,
                ]);

                $meeting->participants()->create([
                    'cuenta_id' => $organizer->id,
                    'estado' => 'aceptada',
                    'es_organizador' => true,
                    'respondido_at' => now(),
                ]);

                $meeting->participants()->createMany(
                    $guestIds->map(
                        fn (string $accountId) => [
                            'cuenta_id' => $accountId,
                            'estado' => 'pendiente',
                            'es_organizador' => false,
                        ]
                    )->all()
                );

                $this->notifications->notifyMeetingRequest($meeting);

                return $this->freshMeeting($meeting->id);
            }
        );
    }

    public function respond(
        User $user,
        AgendaMeeting $meeting,
        string $response
    ): AgendaMeeting {
        $account = $this->activeAccount($user);

        return DB::transaction(
            function () use ($account, $meeting, $response): AgendaMeeting {
                $lockedMeeting = AgendaMeeting::query()
                    ->lockForUpdate()
                    ->findOrFail($meeting->id);

                if ($lockedMeeting->estado !== 'pendiente') {
                    throw ValidationException::withMessages([
                        'respuesta' => 'La reunión ya no está pendiente.',
                    ]);
                }

                $participant = AgendaMeetingParticipant::query()
                    ->where('reunion_id', $lockedMeeting->id)
                    ->where('cuenta_id', $account->id)
                    ->where('es_organizador', false)
                    ->lockForUpdate()
                    ->first();

                if (
                    $participant === null
                    || $participant->estado !== 'pendiente'
                ) {
                    throw ValidationException::withMessages([
                        'respuesta' => 'Esta invitación ya fue respondida o no te pertenece.',
                    ]);
                }

                $participant->update([
                    'estado' => $response,
                    'respondido_at' => now(),
                ]);

                if ($response === 'rechazada') {
                    $lockedMeeting->update([
                        'estado' => 'rechazada',
                    ]);

                    $this->notifications->notifyStatusChange(
                        $lockedMeeting,
                        'rechazada'
                    );

                    return $this->freshMeeting($lockedMeeting->id);
                }

                if (
                    ! $lockedMeeting
                        ->participants()
                        ->where('estado', 'pendiente')
                        ->exists()
                ) {
                    $attendeeIds = $lockedMeeting
                        ->participants()
                        ->orderBy('cuenta_id')
                        ->pluck('cuenta_id')
                        ->all();

                    $this->lockAttendees($attendeeIds);

                    $this->ensureNoConfirmedConflict(
                        $attendeeIds,
                        $lockedMeeting->fecha->format('Y-m-d'),
                        $lockedMeeting->hora_inicio,
                        $lockedMeeting->hora_fin,
                        $lockedMeeting->id,
                        'No se puede confirmar la reunión. Ya tienen otra reunión confirmada en ese horario: '
                    );

                    $lockedMeeting->update([
                        'estado' => 'confirmada',
                    ]);

                    $this->notifications->notifyStatusChange(
                        $lockedMeeting,
                        'confirmada'
                    );
                }

                return $this->freshMeeting($lockedMeeting->id);
            }
        );
    }

    public function cancel(User $user, AgendaMeeting $meeting): AgendaMeeting
    {
        $account = $this->activeAccount($user);

        return DB::transaction(
            function () use ($account, $meeting): AgendaMeeting {
                $lockedMeeting = AgendaMeeting::query()
                    ->lockForUpdate()
                    ->findOrFail($meeting->id);

                if (
                    $lockedMeeting->creada_por !== $account->id
                    || ! in_array(
                        $lockedMeeting->estado,
                        ['pendiente', 'confirmada'],
                        true
                    )
                ) {
                    throw new AuthorizationException(
                        'No puedes cancelar esta reunión.'
                    );
                }

                $lockedMeeting->update([
                    'estado' => 'cancelada',
                ]);

                $this->notifications->notifyStatusChange(
                    $lockedMeeting,
                    'cancelada'
                );

                return $this->freshMeeting($lockedMeeting->id);
            }
        );
    }

    private function activeAccount(User $user): CuentaAcceso
    {
        $account = CuentaAcceso::query()
            ->with('persona')
            ->where('user_id', $user->id)
            ->where('activo', true)
            ->first();

        if ($account === null) {
            throw new AuthorizationException(
                'La cuenta institucional no está activa o configurada.'
            );
        }

        return $account;
    }

    private function personData(CuentaAcceso $account): ?array
    {
        $member = Integrante::query()
            ->where('persona_id', $account->persona_id)
            ->where('estado', 'Activo')
            ->latest('id')
            ->first();

        if ($member === null) {
            return null;
        }

        $history = IntegranteHistorial::query()
            ->with(['cargo.area', 'horarios'])
            ->where('integrante_id', $member->id)
            ->where('estado', 'Activo')
            ->whereIn('tipo_integrante', self::MEMBER_TYPES)
            ->orderByRaw(
                'CASE WHEN fecha_inicio IS NULL THEN 1 ELSE 0 END'
            )
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->first();

        if (
            $history === null
            || ! $history->cargo?->activo
            || ! $history->cargo?->area?->activo
        ) {
            return null;
        }

        $person = $account->persona;
        $avatarService = app(AvatarService::class);

        return [
            'id' => $account->id,
            'integrante_id' => $member->id,
            'historial_id' => $history->id,
            'nombre' => trim(
                ($person?->nombres ?? '')
                . ' '
                . ($person?->apellidos ?? '')
            ),
            'correo' => $person?->correo,
            'area_id' => $history->cargo->area_id,
            'area' => $history->cargo->area->nombre,
            'cargo_id' => $history->cargo_id,
            'cargo' => $history->cargo->nombre,
            'avatar_path' => $member->avatar_path,
            'avatar_url' => $avatarService->url($member->avatar_path),
            'tipo_cuenta' => 'integrante',
            'tipo_integrante' => $history->tipo_integrante,
            'horarios' => $history->horarios
                ->sortBy(
                    fn ($schedule) => sprintf(
                        '%02d-%s',
                        $schedule->dia_semana,
                        $schedule->hora_inicio
                    )
                )
                ->values()
                ->map(
                    fn ($schedule) => [
                        'dia_semana' => (int) $schedule->dia_semana,
                        'hora_inicio' => substr(
                            (string) $schedule->hora_inicio,
                            0,
                            8
                        ),
                        'hora_fin' => substr(
                            (string) $schedule->hora_fin,
                            0,
                            8
                        ),
                    ]
                )
                ->all(),
        ];
    }

    /**
     * @param list<string> $accountIds
     */
    private function ensureAvailability(
        array $accountIds,
        int $isoDay,
        string $start,
        string $end
    ): void {
        $availableIds = DB::table('cuentas_acceso as ca')
            ->join('integrantes as i', function ($join): void {
                $join
                    ->on('i.persona_id', '=', 'ca.persona_id')
                    ->where('i.estado', 'Activo');
            })
            ->join('integrantes_historial as ih', function ($join): void {
                $join
                    ->on('ih.integrante_id', '=', 'i.id')
                    ->where('ih.estado', 'Activo')
                    ->whereIn('ih.tipo_integrante', self::MEMBER_TYPES);
            })
            ->join('cargos as c', fn ($join) => $join
                ->on('c.id', '=', 'ih.cargo_id')
                ->where('c.activo', true))
            ->join('areas as a', fn ($join) => $join
                ->on('a.id', '=', 'c.area_id')
                ->where('a.activo', true))
            ->join('integrante_horarios as h', function ($join) use (
                $isoDay,
                $start,
                $end
            ): void {
                $join
                    ->on('h.historial_id', '=', 'ih.id')
                    ->where('h.dia_semana', $isoDay)
                    ->where('h.hora_inicio', '<=', $start)
                    ->where('h.hora_fin', '>=', $end);
            })
            ->where('ca.activo', true)
            ->whereIn('ca.id', $accountIds)
            ->distinct()
            ->pluck('ca.id');

        if ($availableIds->count() !== count($accountIds)) {
            throw ValidationException::withMessages([
                'fecha' => 'La fecha u hora está fuera de la disponibilidad común seleccionada.',
            ]);
        }
    }

    /**
     * @param list<string> $accountIds
     */
    private function ensureNoConfirmedConflict(
        array $accountIds,
        string $date,
        string $start,
        string $end,
        ?int $exceptMeetingId,
        string $messagePrefix,
    ): void {
        $query = DB::table('agenda_reuniones as ar')
            ->join(
                'agenda_reunion_participantes as arp',
                'arp.reunion_id',
                '=',
                'ar.id'
            )
            ->join(
                'cuentas_acceso as ca',
                'ca.id',
                '=',
                'arp.cuenta_id'
            )
            ->join(
                'personas as p',
                'p.id',
                '=',
                'ca.persona_id'
            )
            ->whereIn('arp.cuenta_id', $accountIds)
            ->where('ar.estado', 'confirmada')
            ->whereDate('ar.fecha', $date)
            ->where('ar.hora_fin', '>', $start)
            ->where('ar.hora_inicio', '<', $end);

        if ($exceptMeetingId !== null) {
            $query->where('ar.id', '<>', $exceptMeetingId);
        }

        $names = $query
            ->get(['p.nombres', 'p.apellidos'])
            ->map(
                fn ($person) => trim(
                    $person->nombres . ' ' . $person->apellidos
                )
            )
            ->unique()
            ->sort()
            ->values();

        if ($names->isNotEmpty()) {
            throw ValidationException::withMessages([
                'hora_inicio' => $messagePrefix . $names->implode(', '),
            ]);
        }
    }

    /**
     * @param list<string> $accountIds
     */
    private function lockAttendees(array $accountIds): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        foreach (collect($accountIds)->sort()->values() as $accountId) {
            DB::select(
                'select pg_advisory_xact_lock(hashtextextended(?, 0))',
                [$accountId]
            );
        }
    }

    private function freshMeeting(int $id): AgendaMeeting
    {
        return AgendaMeeting::query()
            ->with('participants.account.persona.integrantes')
            ->findOrFail($id);
    }

    private function meetingsFor(string $accountId): Collection
    {
        return AgendaMeeting::query()
            ->with('participants.account.persona.integrantes')
            ->whereHas(
                'participants',
                fn ($query) => $query->where('cuenta_id', $accountId)
            )
            ->orderBy('fecha')
            ->orderBy('hora_inicio')
            ->get();
    }

    private function isHistorical(AgendaMeeting $meeting): bool
    {
        return in_array(
            $meeting->estado,
            ['cancelada', 'rechazada'],
            true
        ) || $this->hasEnded($meeting);
    }

    private function hasEnded(AgendaMeeting $meeting): bool
    {
        return $this->meetingEndsAt($meeting)->isPast();
    }

    private function meetingEndsAt(AgendaMeeting $meeting): CarbonImmutable
    {
        $end = substr((string) $meeting->hora_fin, 0, 8);

        if (strlen($end) === 5) {
            $end .= ':00';
        }

        return CarbonImmutable::createFromFormat(
            'Y-m-d H:i:s',
            $meeting->fecha->format('Y-m-d') . ' ' . $end,
            'America/Lima'
        );
    }

    private function meetingDuration(AgendaMeeting $meeting): int
    {
        [$startHour, $startMinute] = array_map(
            'intval',
            explode(':', (string) $meeting->hora_inicio)
        );

        [$endHour, $endMinute] = array_map(
            'intval',
            explode(':', (string) $meeting->hora_fin)
        );

        return max(
            0,
            ($endHour * 60 + $endMinute)
            - ($startHour * 60 + $startMinute)
        );
    }
}
