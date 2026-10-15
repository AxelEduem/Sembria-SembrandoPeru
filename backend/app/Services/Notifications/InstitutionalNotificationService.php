<?php

namespace App\Services\Notifications;

use App\Data\Auth\AuthorizationScope;
use App\Models\NotificacionAsistencia;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class InstitutionalNotificationService
{
    private const TIMEZONE = 'America/Lima';

    private const PERIOD_NOTICE_MILESTONES = [1, 7, 15, 30];

    private const BIRTHDAY_NOTICE_MILESTONES = [0, 1];

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function generateAll(): int
    {
        $created = 0;
        User::query()
            ->whereHas('cuentaAcceso', fn ($query) => $query->where('activo', true))
            ->eachById(function (User $user) use (&$created): void {
                $created += $this->generateForUser($user);
            });

        return $created;
    }

    public function generateForUser(User $user): int
    {
        $created = 0;
        $created += $this->generatePeriodNotifications($user, 'voluntario', 'integrantes.ver');
        $created += $this->generatePeriodNotifications($user, 'practicante', 'integrantes.ver');
        $created += $this->generateBirthdayNotifications($user);

        return $created;
    }

    private function generatePeriodNotifications(User $user, string $type, string $permission): int
    {
        $scope = $this->authorizedScope($user, [$permission]);
        if ($scope === null) {
            return 0;
        }

        $today = CarbonImmutable::now(self::TIMEZONE)->startOfDay();
        $rows = $this->memberHistories($scope)
            ->where('history.tipo_integrante', $type)
            ->whereNotNull('history.fecha_fin')
            ->where(fn (Builder $query) => $query
                ->whereNull('history.fecha_inicio')
                ->orWhereDate('history.fecha_inicio', '<=', $today->toDateString()))
            ->whereDate('history.fecha_fin', '<=', $today->addDays(30)->toDateString())
            ->get([
                'history.id as history_id',
                'history.fecha_fin',
                'person.nombres',
                'person.apellidos',
            ]);

        $created = 0;
        foreach ($rows as $row) {
            $endDate = CarbonImmutable::parse($row->fecha_fin, self::TIMEZONE);
            $daysRemaining = (int) $today->diffInDays($endDate, false);
            $milestone = $this->periodMilestone($daysRemaining);
            if ($milestone === null) {
                continue;
            }

            $name = trim("{$row->nombres} {$row->apellidos}") ?: 'Un integrante';
            if ($milestone === 'expired') {
                $notificationType = 'periodo_vencido';
                $title = 'Periodo vencido';
                $message = "El periodo de {$name} venció el {$endDate->format('d/m/Y')}.";
            } else {
                $notificationType = $milestone === 1
                    ? 'periodo_vence_1_dia'
                    : "periodo_vence_{$milestone}_dias";
                $title = $milestone === 1
                    ? 'Periodo culmina en 1 día'
                    : "Periodo culmina en {$milestone} días";
                $message = $daysRemaining === 0
                    ? "El periodo de {$name} culmina hoy."
                    : "El periodo de {$name} culmina el {$endDate->format('d/m/Y')}.";
            }

            $created += $this->notify(
                $user,
                $notificationType,
                $title,
                $message,
                "periodo-{$row->history_id}-{$endDate->toDateString()}-{$milestone}",
            );
        }

        return $created;
    }

    private function generateBirthdayNotifications(User $user): int
    {
        $scope = $this->authorizedScope($user, ['cumpleanos.ver']);
        if ($scope === null) {
            return 0;
        }

        $today = CarbonImmutable::now(self::TIMEZONE)->startOfDay();
        $rows = $this->activeMembers($scope)
            ->join('cuentas_acceso as member_account', function ($join): void {
                $join->on('member_account.persona_id', '=', 'member.persona_id')
                    ->where('member_account.activo', true);
            })
            ->whereNotNull('member.fecha_nacimiento')
            ->get([
                'member.id as member_id',
                'member.fecha_nacimiento',
                'person.nombres',
                'person.apellidos',
            ])
            ->unique('member_id');

        $created = 0;
        foreach ($rows as $row) {
            $birthDate = CarbonImmutable::parse($row->fecha_nacimiento, self::TIMEZONE);
            $nextBirthday = $this->nextBirthday($birthDate, $today);
            $daysUntilBirthday = (int) $today->diffInDays($nextBirthday, false);
            if (! in_array($daysUntilBirthday, self::BIRTHDAY_NOTICE_MILESTONES, true)) {
                continue;
            }

            $name = trim("{$row->nombres} {$row->apellidos}") ?: 'Un integrante';
            $isToday = $daysUntilBirthday === 0;
            $created += $this->notify(
                $user,
                'cumpleanos_proximo',
                $isToday ? 'Cumpleaños hoy' : 'Cumpleaños mañana',
                $isToday
                    ? "Hoy es el cumpleaños de {$name}."
                    : "Mañana es el cumpleaños de {$name}.",
                "cumpleanos-{$row->member_id}-{$nextBirthday->toDateString()}-{$daysUntilBirthday}",
            );
        }

        return $created;
    }

    private function activeMembers(AuthorizationScope $scope): Builder
    {
        $today = CarbonImmutable::now(self::TIMEZONE)->toDateString();

        return $this->memberHistories($scope)
            ->where(fn (Builder $query) => $query
                ->whereNull('history.fecha_inicio')
                ->orWhereDate('history.fecha_inicio', '<=', $today))
            ->where(fn (Builder $query) => $query
                ->whereNull('history.fecha_fin')
                ->orWhereDate('history.fecha_fin', '>=', $today));
    }

    private function memberHistories(AuthorizationScope $scope): Builder
    {
        return DB::table('integrantes as member')
            ->join('personas as person', 'person.id', '=', 'member.persona_id')
            ->join('integrantes_historial as history', 'history.integrante_id', '=', 'member.id')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->where('member.estado', 'Activo')
            ->where('history.estado', 'Activo')
            ->when(! $scope->global, fn (Builder $query) => $query->where('position.area_id', $scope->areaId));
    }

    private function periodMilestone(int $daysRemaining): int|string|null
    {
        if ($daysRemaining < 0) {
            return 'expired';
        }

        foreach (self::PERIOD_NOTICE_MILESTONES as $milestone) {
            if ($daysRemaining <= $milestone) {
                return $milestone;
            }
        }

        return null;
    }

    /** @param list<string> $permissions */
    private function authorizedScope(User $user, array $permissions): ?AuthorizationScope
    {
        try {
            return $this->authorization->scope($user, $permissions);
        } catch (AuthorizationException) {
            return null;
        }
    }

    private function nextBirthday(CarbonImmutable $birthDate, CarbonImmutable $today): CarbonImmutable
    {
        $day = min($birthDate->day, CarbonImmutable::create($today->year, $birthDate->month, 1, 0, 0, 0, self::TIMEZONE)->daysInMonth);
        $birthday = CarbonImmutable::create($today->year, $birthDate->month, $day, 0, 0, 0, self::TIMEZONE);

        if ($birthday->lt($today)) {
            $nextYear = $today->year + 1;
            $day = min($birthDate->day, CarbonImmutable::create($nextYear, $birthDate->month, 1, 0, 0, 0, self::TIMEZONE)->daysInMonth);
            $birthday = CarbonImmutable::create($nextYear, $birthDate->month, $day, 0, 0, 0, self::TIMEZONE);
        }

        return $birthday;
    }

    private function notify(User $user, string $type, string $title, string $message, string $context): int
    {
        return NotificacionAsistencia::query()->firstOrCreate(
            ['clave' => "institucional-{$user->id}-{$context}"],
            [
                'user_id' => $user->id,
                'tipo' => $type,
                'titulo' => $title,
                'mensaje' => $message,
            ],
        )->wasRecentlyCreated ? 1 : 0;
    }
}
