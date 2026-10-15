<?php

namespace App\Services\Tareas;

use App\Models\CuentaAcceso;
use App\Models\Tarea;
use App\Models\User;
use App\Services\Notifications\TareaNotificationService;
use App\Services\Profile\AvatarService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TareaService
{
    public function __construct(
        private readonly TareaNotificationService $notifications
    ) {}

    public function directory(User $user): array
    {
        $account = $this->activeAccount($user);
        $areaId = $this->activeAreaId($account);
        $avatarService = app(AvatarService::class);

        return DB::table('cuentas_acceso as ca')
            ->join('personas as p', 'p.id', '=', 'ca.persona_id')
            ->join('integrantes as i', function ($join): void {
                $join
                    ->on('i.persona_id', '=', 'ca.persona_id')
                    ->where('i.estado', 'Activo');
            })
            ->join('integrantes_historial as ih', function ($join): void {
                $join
                    ->on('ih.integrante_id', '=', 'i.id')
                    ->where('ih.estado', 'Activo');
            })
            ->join('cargos as c', function ($join): void {
                $join
                    ->on('c.id', '=', 'ih.cargo_id')
                    ->where('c.activo', true);
            })
            ->join('areas as a', function ($join): void {
                $join
                    ->on('a.id', '=', 'c.area_id')
                    ->where('a.activo', true);
            })
            ->where('ca.activo', true)
            ->where('ca.id', '!=', $account->id)
            ->where('c.area_id', $areaId)
            ->select([
                'ca.id',
                'i.id as integrante_id',
                'p.nombres',
                'p.apellidos',
                'i.avatar_path',
                'c.nombre as cargo',
                'a.nombre as area',
            ])
            ->orderBy('p.nombres')
            ->orderBy('p.apellidos')
            ->get()
            ->unique('id')
            ->map(fn ($person) => [
                'id' => $person->id,
                'integrante_id' => $person->integrante_id,
                'nombre' => trim(
                    $person->nombres . ' ' . $person->apellidos
                ),
                'avatar_path' => $person->avatar_path,
                'avatar_url' => $avatarService->url(
                    $person->avatar_path
                ),
                'cargo' => $person->cargo,
                'area' => $person->area,
            ])
            ->values()
            ->all();
    }

    public function list(User $user): Collection
    {
        $account = $this->activeAccount($user);

        return Tarea::query()
            ->with($this->relations())
            ->where(function ($query) use ($account): void {
                $query
                    ->whereHas(
                        'assignees',
                        fn ($assignees) => $assignees->whereKey($account->id)
                    )
                    ->orWhere('asignada_por', $account->id);
            })
            ->orderByRaw(
                "CASE estado
                    WHEN 'en_progreso' THEN 1
                    WHEN 'pendiente' THEN 2
                    WHEN 'completada' THEN 3
                    ELSE 4
                END"
            )
            ->orderByRaw(
                'CASE WHEN fecha_limite IS NULL THEN 1 ELSE 0 END'
            )
            ->orderBy('fecha_limite')
            ->latest('created_at')
            ->get();
    }

    public function create(User $user, array $data): Tarea
    {
        $creator = $this->activeAccount($user);

        $assignees = $this->assignableAccounts(
            $data['asignadas_a'],
            $this->activeAreaId($creator),
            $creator->id,
        );
        $assigneeIds = $assignees->modelKeys();

        return DB::transaction(
            function () use (
                $creator,
                $assigneeIds,
                $data
            ): Tarea {
                $task = Tarea::query()->create([
                    'titulo' => $data['titulo'],
                    'descripcion' => $data['descripcion'] ?? null,
                    'asignada_por' => $creator->id,
                    'asignada_a' => $assigneeIds[0],
                    'prioridad' => $data['prioridad'],
                    'estado' => 'pendiente',
                    'fecha_limite' => $data['fecha_limite'] ?? null,
                ]);

                $task->assignees()->sync($assigneeIds);
                $this->notifications->assigned($task, $assigneeIds);

                return $this->fresh($task->id);
            }
        );
    }

    public function update(
        User $user,
        Tarea $task,
        array $data
    ): Tarea {
        $account = $this->activeAccount($user);

        $this->authorizeParticipant($account, $task);

        if ($task->asignada_por !== $account->id) {
            throw new AuthorizationException(
                'Solo quien creó la tarea puede editarla.'
            );
        }

        if ($task->estado !== 'pendiente') {
            throw ValidationException::withMessages([
                'estado' => 'Solo puedes editar una tarea pendiente.',
            ]);
        }

        $assignees = $this->assignableAccounts(
            $data['asignadas_a'],
            $this->activeAreaId($account),
            $account->id,
        );
        $assigneeIds = $assignees->modelKeys();

        return DB::transaction(
            function () use (
                $task,
                $assigneeIds,
                $data
            ): Tarea {
                $previousAssigneeIds = $task->assignees()
                    ->pluck('cuentas_acceso.id')
                    ->all();

                $task->update([
                    'titulo' => $data['titulo'],
                    'descripcion' => $data['descripcion'] ?? null,
                    'asignada_a' => $assigneeIds[0],
                    'prioridad' => $data['prioridad'],
                    'fecha_limite' => $data['fecha_limite'] ?? null,
                ]);

                $task->assignees()->sync($assigneeIds);
                $newAssigneeIds = array_values(array_diff($assigneeIds, $previousAssigneeIds));
                if ($newAssigneeIds !== []) {
                    $this->notifications->assigned($task, $newAssigneeIds);
                }

                return $this->fresh($task->id);
            }
        );
    }

    public function updateStatus(
        User $user,
        Tarea $task,
        string $status
    ): Tarea {
        $account = $this->activeAccount($user);

        $this->authorizeParticipant($account, $task);

        if (in_array($task->estado, ['completada', 'cancelada'], true)) {
            throw ValidationException::withMessages([
                'estado' => 'No puedes cambiar el estado de una tarea finalizada.',
            ]);
        }

        if (
            $status === 'cancelada'
            && $task->asignada_por !== $account->id
        ) {
            throw new AuthorizationException(
                'Solo quien creó la tarea puede cancelarla.'
            );
        }

        return DB::transaction(
            function () use (
                $task,
                $status,
                $account
            ): Tarea {
                $task->update([
                    'estado' => $status,
                    'completada_at' =>
                        $status === 'completada'
                            ? now()
                            : null,
                ]);

                $this->notifications->statusChanged(
                    $task,
                    $status,
                    $account->id
                );

                return $this->fresh($task->id);
            }
        );
    }

    public function addNote(
        User $user,
        Tarea $task,
        string $content
    ): Tarea {
        $account = $this->activeAccount($user);

        $this->authorizeParticipant($account, $task);

        $task->notes()->create([
            'autor_id' => $account->id,
            'contenido' => $content,
        ]);

        return $this->fresh($task->id);
    }

    private function activeAccount(User $user): CuentaAcceso
    {
        $account = CuentaAcceso::query()
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

    private function activeAreaId(CuentaAcceso $account): int
    {
        $areaId = DB::table('integrantes as i')
            ->join('integrantes_historial as ih', function ($join): void {
                $join
                    ->on('ih.integrante_id', '=', 'i.id')
                    ->where('ih.estado', 'Activo');
            })
            ->join('cargos as c', function ($join): void {
                $join
                    ->on('c.id', '=', 'ih.cargo_id')
                    ->where('c.activo', true);
            })
            ->join('areas as a', function ($join): void {
                $join
                    ->on('a.id', '=', 'c.area_id')
                    ->where('a.activo', true);
            })
            ->where('i.persona_id', $account->persona_id)
            ->where('i.estado', 'Activo')
            ->latest('ih.created_at')
            ->latest('ih.id')
            ->value('c.area_id');

        if ($areaId === null) {
            throw new AuthorizationException(
                'La cuenta no tiene un área activa configurada.'
            );
        }

        return (int) $areaId;
    }

    /**
     * @param  list<string>  $accountIds
     * @return Collection<int, CuentaAcceso>
     */
    private function assignableAccounts(
        array $accountIds,
        int $areaId,
        string $actorAccountId,
    ): Collection {
        $accounts = CuentaAcceso::query()
            ->whereKey($accountIds)
            ->where('id', '!=', $actorAccountId)
            ->where('activo', true)
            ->whereHas(
                'persona.integrantes',
                function ($query) use ($areaId): void {
                    $query
                        ->where('estado', 'Activo')
                        ->whereHas(
                            'historiales',
                            function ($history) use ($areaId): void {
                                $history
                                    ->where('estado', 'Activo')
                                    ->whereHas(
                                        'cargo',
                                        function ($cargo) use (
                                            $areaId
                                        ): void {
                                            $cargo
                                                ->where('activo', true)
                                                ->where(
                                                    'area_id',
                                                    $areaId
                                                )
                                                ->whereHas(
                                                    'area',
                                                    fn ($area) =>
                                                        $area->where(
                                                            'activo',
                                                            true
                                                        )
                                                );
                                        }
                                    );
                            }
                        );
                }
            )
            ->get();

        if ($accounts->count() !== count($accountIds)) {
            throw ValidationException::withMessages([
                'asignadas_a' =>
                    'Selecciona integrantes activos de tu misma área con acceso institucional.',
            ]);
        }

        $accountsById = $accounts->keyBy('id');

        return new Collection(
            collect($accountIds)->map(fn ($id) => $accountsById->get($id))->all()
        );
    }

    private function authorizeParticipant(
        CuentaAcceso $account,
        Tarea $task
    ): void {
        if ($task->asignada_por !== $account->id
            && ! $task->assignees()->whereKey($account->id)->exists()) {
            throw new AuthorizationException(
                'No puedes acceder a esta tarea.'
            );
        }
    }

    private function fresh(int $taskId): Tarea
    {
        return Tarea::query()
            ->with($this->relations())
            ->findOrFail($taskId);
    }

    private function relations(): array
    {
        return [
            'creator.persona.integrantes',
            'assignee.persona.integrantes',
            'assignees.persona.integrantes',
            'notes.author.persona.integrantes',
        ];
    }
}
