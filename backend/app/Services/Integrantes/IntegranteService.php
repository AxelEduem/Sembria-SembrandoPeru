<?php

namespace App\Services\Integrantes;

use App\Models\Cargo;
use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use App\Models\Persona;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class IntegranteService
{
    public function __construct(
        private readonly InstitutionalAuthorizationService $authorization,
        private readonly IntegranteQueryService $queries,
    ) {}

    public function create(User $user, array $data): Integrante
    {
        $cargo = $this->activeCargo((int) $data['cargo_id']);
        $this->authorization->authorizeArea($user, $this->createPermissions($data['tipo_integrante']), $cargo->area_id);

        return DB::transaction(function () use ($data): Integrante {
            $persona = Persona::query()->create([
                'nombres' => trim($data['nombres']),
                'apellidos' => trim($data['apellidos']),
                'correo' => null,
            ]);

            $integrante = $persona->integrantes()->create($this->integrantePayload($data) + [
                'estado' => 'Activo',
                'accesos_pendientes_revision' => false,
                'accesos_retirados' => false,
            ]);

            $historial = $integrante->historiales()->create($this->historyPayload($data, 'Activo'));

            if ($data['tipo_integrante'] === 'gerente') {
                $this->generarHorarioGerente($historial);
            }

            return $this->queries->fresh($integrante->id);
        });
    }

    public function update(User $user, Integrante $integrante, array $data): Integrante
    {
        $integrante = $this->queries->find($user, $integrante->id, $this->editPermissions($data['tipo_integrante']));
        $history = $this->requireCurrentHistory($integrante);
        if ($history->tipo_integrante !== $data['tipo_integrante']) {
            throw ValidationException::withMessages(['tipo_integrante' => 'El tipo no coincide con el periodo actual.']);
        }
        $cargo = $this->activeCargo((int) $data['cargo_id']);
        $this->authorization->authorizeArea($user, $this->editPermissions($data['tipo_integrante']), $cargo->area_id);

        return DB::transaction(function () use ($integrante, $history, $data): Integrante {
            $integrante->persona->update(Arr::only($data, ['nombres', 'apellidos']));
            $integrante->update($this->integrantePayload($data));
            $history->update($this->historyPayload($data, $history->estado));

            return $this->queries->fresh($integrante->id);
        });
    }

    public function deactivate(User $user, Integrante $integrante, string $reason): Integrante
    {
        $integrante = $this->queries->find($user, $integrante->id, ['integrantes.desactivar', 'voluntarios.desactivar', 'practicantes.desactivar']);
        $history = $this->requireCurrentHistory($integrante);
        $scope = $this->authorization->scope($user, ['integrantes.desactivar', 'voluntarios.desactivar', 'practicantes.desactivar']);

        return DB::transaction(function () use ($integrante, $history, $reason, $scope): Integrante {
            $integrante->update(['estado' => 'Inactivo', 'accesos_pendientes_revision' => false]);
            $history->update([
                'estado' => 'Inactivo', 'fecha_desactivacion' => now(),
                'desactivado_por' => $scope->accountId, 'motivo_desactivacion' => trim($reason),
                'tipo_desactivacion' => 'manual',
            ]);

            return $this->queries->fresh($integrante->id);
        });
    }

    public function restore(User $user, Integrante $integrante): Integrante
    {
        $integrante = $this->queries->find($user, $integrante->id, ['integrantes.activar']);
        $history = $this->requireCurrentHistory($integrante);

        return DB::transaction(function () use ($integrante, $history): Integrante {
            $integrante->update(['estado' => 'Activo', 'accesos_pendientes_revision' => false]);
            $history->update([
                'estado' => 'Activo', 'fecha_desactivacion' => null, 'desactivado_por' => null,
                'motivo_desactivacion' => null, 'tipo_desactivacion' => null,
            ]);

            return $this->queries->fresh($integrante->id);
        });
    }

    public function rehire(User $user, Integrante $integrante, array $data): Integrante
    {
        $integrante = $this->queries->find($user, $integrante->id, [
            'integrantes.recontratar', 'voluntarios.recontratar',
        ]);
        if ($integrante->estado === 'Activo') {
            throw ValidationException::withMessages(['integrante' => 'El integrante ya se encuentra activo.']);
        }
        $cargo = $this->activeCargo((int) $data['cargo_id']);
        $this->authorization->authorizeArea($user, [
            'integrantes.recontratar', 'voluntarios.recontratar',
        ], $cargo->area_id);

        return DB::transaction(function () use ($integrante, $data): Integrante {
            $integrante->persona->update(Arr::only($data, ['nombres', 'apellidos']));
            $integrante->update($this->integrantePayload($data) + [
                'estado' => 'Activo', 'accesos_pendientes_revision' => false,
                'accesos_retirados' => false, 'accesos_retirados_at' => null,
            ]);
            $integrante->historiales()->create($this->historyPayload($data, 'Activo'));

            return $this->queries->fresh($integrante->id);
        });
    }

    public function confirmAccessRemoval(User $user, Integrante $integrante): Integrante
    {
        $integrante = $this->queries->find($user, $integrante->id, ['accesos.gestionar']);
        $history = $this->requireCurrentHistory($integrante);
        if ($history->accesos()->where('activo', true)->exists()) {
            throw ValidationException::withMessages(['integrante' => 'El integrante todavía tiene accesos asignados.']);
        }

        return DB::transaction(function () use ($integrante, $history): Integrante {
            $integrante->update([
                'estado' => 'Inactivo', 'accesos_pendientes_revision' => false,
                'accesos_retirados' => true, 'accesos_retirados_at' => now(),
            ]);
            $history->update([
                'estado' => 'Inactivo', 'fecha_desactivacion' => now(), 'desactivado_por' => null,
                'motivo_desactivacion' => 'Se desactivo porque acabo su periodo.',
                'tipo_desactivacion' => 'automatica',
            ]);

            return $this->queries->fresh($integrante->id);
        });
    }

    private function activeCargo(int $id): Cargo
    {
        $cargo = Cargo::query()->with(['area', 'role'])->findOrFail($id);
        if (! $cargo->activo || ! $cargo->area?->activo || ! $cargo->role?->activo) {
            throw ValidationException::withMessages(['cargo_id' => 'El cargo, área o rol seleccionado está inactivo.']);
        }

        return $cargo;
    }

    private function requireCurrentHistory(Integrante $integrante): IntegranteHistorial
    {
        $history = $this->queries->currentHistory($integrante);
        if ($history === null) {
            throw ValidationException::withMessages(['integrante' => 'No se encontró el historial del integrante.']);
        }

        return $history;
    }

    private function integrantePayload(array $data): array
    {
        return Arr::only($data, [
            'fecha_nacimiento', 'documento_identidad', 'tipo_documento', 'telefono',
            'departamento', 'ciudad', 'distrito',
        ]);
    }

    private function historyPayload(array $data, string $state): array
    {
        $isManager = $data['tipo_integrante'] === 'gerente';
        $isIntern = $data['tipo_integrante'] === 'practicante';

        return [
            'tipo_integrante' => $data['tipo_integrante'],
            'cargo_id' => $data['cargo_id'],
            'periodo_meses' => $isManager ? null : ($data['periodo_meses'] ?? null),
            'fecha_inicio' => $data['fecha_inicio'] ?? null,
            'fecha_fin' => $isManager ? null : ($data['fecha_fin'] ?? null),
            'estado' => $state,
            'requiere_asistencia' => ! $isManager,
            'institucion_educativa' => $isIntern ? ($data['institucion_educativa'] ?? null) : null,
            'horas_practicas_requeridas' => $isIntern ? ($data['horas_practicas_requeridas'] ?? null) : null,
            'carrera' => $isIntern ? ($data['carrera'] ?? null) : null,
            'ciclo' => $isIntern ? ($data['ciclo'] ?? null) : null,
            'modalidad' => $data['modalidad'],
            'fecha_desactivacion' => null,
            'desactivado_por' => null,
            'motivo_desactivacion' => null,
            'tipo_desactivacion' => null,
        ];
    }

    private function generarHorarioGerente(IntegranteHistorial $historial): void
    {
        for ($dia = 1; $dia <= 6; $dia++) {
            $historial->horarios()->create([
                'dia_semana' => $dia,
                'hora_inicio' => '08:00',
                'hora_fin' => '18:00',
            ]);
        }
    }

    private function createPermissions(string $type): array
    {
        return ['integrantes.crear', $type === 'practicante' ? 'practicantes.crear' : 'voluntarios.crear'];
    }

    private function editPermissions(string $type): array
    {
        return ['integrantes.editar', $type === 'practicante' ? 'practicantes.editar' : 'voluntarios.editar'];
    }
}
