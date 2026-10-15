<?php

namespace App\Services\Integrantes;

use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use App\Models\IntegranteHorario;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HorarioService
{
    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function list(User $user, IntegranteHistorial $history)
    {
        $this->authorizeView($user, $history);

        return $history->horarios()->orderBy('dia_semana')->orderBy('hora_inicio')->get();
    }

    public function mineHistory(User $user, array $filters): LengthAwarePaginator
    {
        $account = $user->cuentaAcceso()->where('activo', true)->first();
        $memberId = $account === null
            ? 0
            : (Integrante::query()
                ->where('persona_id', $account->persona_id)
                ->latest('id')
                ->value('id') ?? 0);
        $term = trim((string) ($filters['q'] ?? ''));
        $status = $filters['estado'] ?? null;
        $modality = $filters['modalidad'] ?? null;
        $period = isset($filters['periodo']) ? (int) $filters['periodo'] : null;
        $perPage = (int) ($filters['por_pagina'] ?? 6);
        $page = (int) ($filters['pagina'] ?? 1);

        return IntegranteHistorial::query()
            ->with([
                'cargo.area',
                'cargo.role',
                'desactivador.persona',
                'horarios' => fn ($query) => $query
                    ->orderBy('dia_semana')
                    ->orderBy('hora_inicio'),
            ])
            ->where('integrante_id', $memberId)
            ->when($term !== '', function ($query) use ($term): void {
                $query->where(function ($search) use ($term): void {
                    $search->whereLike('carrera', "%{$term}%", caseSensitive: false)
                        ->orWhereLike('modalidad', "%{$term}%", caseSensitive: false)
                        ->orWhereHas('cargo', function ($cargo) use ($term): void {
                            $cargo->whereLike('nombre', "%{$term}%", caseSensitive: false)
                                ->orWhereHas('area', fn ($area) => $area->whereLike(
                                    'nombre',
                                    "%{$term}%",
                                    caseSensitive: false,
                                ));
                        });
                });
            })
            ->when($status, fn ($query) => $query->where('estado', $status))
            ->when($modality, fn ($query) => $query->where('modalidad', $modality))
            ->when($period, fn ($query) => $query->where(
                'fecha_inicio',
                '>=',
                now()->subDays($period)->startOfDay(),
            ))
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'pagina', $page);
    }

    public function replace(User $user, IntegranteHistorial $history, array $blocks)
    {
        $this->authorizeManage($user, $history);

        return DB::transaction(function () use ($history, $blocks) {
            $lockedHistory = IntegranteHistorial::query()
                ->whereKey($history->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensurePracticeHoursAreCovered($lockedHistory, $blocks);

            $history->horarios()->delete();
            foreach ($blocks as $block) {
                $history->horarios()->create([
                    'dia_semana' => $block['dia_semana'],
                    'hora_inicio' => $block['hora_inicio'],
                    'hora_fin' => $block['hora_fin'],
                ]);
            }

            return $history->horarios()->orderBy('dia_semana')->orderBy('hora_inicio')->get();
        });
    }

    public function deleteAll(User $user, IntegranteHistorial $history): void
    {
        $this->authorizeManage($user, $history);
        $history->horarios()->delete();
    }

    public function create(User $user, IntegranteHistorial $history, array $data): IntegranteHorario
    {
        $this->authorizeManage($user, $history);

        return DB::transaction(function () use ($history, $data): IntegranteHorario {
            IntegranteHistorial::query()->whereKey($history->id)->lockForUpdate()->firstOrFail();
            $this->ensureNoOverlap($history, $data);

            return $history->horarios()->create($data);
        });
    }

    public function update(User $user, IntegranteHorario $schedule, array $data): IntegranteHorario
    {
        $history = IntegranteHistorial::query()->findOrFail($data['historial_id']);
        $this->authorizeManage($user, $history);

        return DB::transaction(function () use ($history, $schedule, $data): IntegranteHorario {
            IntegranteHistorial::query()->whereKey($history->id)->lockForUpdate()->firstOrFail();
            $this->ensureNoOverlap($history, $data, $schedule->id);
            $schedule->update($data);

            return $schedule->refresh();
        });
    }

    public function delete(User $user, IntegranteHorario $schedule): void
    {
        $schedule->loadMissing('historial.cargo');
        $this->authorizeManage($user, $schedule->historial);
        $schedule->delete();
    }

    private function authorizeView(User $user, IntegranteHistorial $history): void
    {
        $history->loadMissing(['cargo', 'integrante']);
        if ($this->authorization->ownsPersona($user, $history->integrante->persona_id)) {
            return;
        }
        $this->authorization->authorizeArea($user, [
            'integrantes.ver_detalle', 'voluntarios.ver_horario',
            'voluntarios.gestionar_horario',
        ], $history->cargo->area_id);
    }

    private function ensurePracticeHoursAreCovered(IntegranteHistorial $history, array $blocks): void
    {
        if ($history->tipo_integrante !== 'practicante') {
            return;
        }

        $requiredHours = (int) $history->horas_practicas_requeridas;
        if ($requiredHours <= 0 || ! $history->fecha_inicio || ! $history->fecha_fin) {
            throw ValidationException::withMessages([
                'blocks' => 'El practicante debe tener un periodo y un mínimo de horas de prácticas válidos.',
            ]);
        }

        $start = CarbonImmutable::parse($history->fecha_inicio->format('Y-m-d'));
        $end = CarbonImmutable::parse($history->fecha_fin->format('Y-m-d'));
        $minutesByDay = [];

        foreach ($blocks as $block) {
            [$startHour, $startMinute] = array_map('intval', explode(':', $block['hora_inicio']));
            [$endHour, $endMinute] = array_map('intval', explode(':', $block['hora_fin']));
            $duration = ($endHour * 60 + $endMinute) - ($startHour * 60 + $startMinute);
            $day = (int) $block['dia_semana'];
            $minutesByDay[$day] = ($minutesByDay[$day] ?? 0) + max(0, $duration);
        }

        $projectedMinutes = 0;
        for ($date = $start; $date->lte($end); $date = $date->addDay()) {
            $projectedMinutes += $minutesByDay[$date->dayOfWeekIso] ?? 0;
        }

        if ($projectedMinutes < $requiredHours * 60) {
            $projectedHours = round($projectedMinutes / 60, 2);

            throw ValidationException::withMessages([
                'blocks' => "El horario del periodo suma {$projectedHours} horas, pero el practicante requiere como mínimo {$requiredHours} horas.",
            ]);
        }
    }

    private function ensureNoOverlap(IntegranteHistorial $history, array $data, ?int $exceptId = null): void
    {
        $overlap = $history->horarios()
            ->where('dia_semana', $data['dia_semana'])
            ->when($exceptId, fn ($query) => $query->whereKeyNot($exceptId))
            ->where('hora_inicio', '<', $data['hora_fin'])
            ->where('hora_fin', '>', $data['hora_inicio'])
            ->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'hora_inicio' => 'El horario se superpone con otro bloque del mismo día.',
            ]);
        }
    }

    private function authorizeManage(User $user, IntegranteHistorial $history): void
    {
        $history->loadMissing('cargo');
        if ($history->cargo === null) {
            throw new AuthorizationException('El historial no tiene un cargo válido.');
        }
        $this->authorization->authorizeArea($user, [
            'integrantes.crear', 'integrantes.editar', 'integrantes.recontratar',
            'voluntarios.gestionar_horario', 'voluntarios.crear', 'voluntarios.editar',
            'voluntarios.recontratar', 'practicantes.crear', 'practicantes.editar',
        ], $history->cargo->area_id);
    }
}
