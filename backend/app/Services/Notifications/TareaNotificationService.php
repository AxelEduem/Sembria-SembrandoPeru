<?php

namespace App\Services\Notifications;

use App\Models\CuentaAcceso;
use App\Models\NotificacionAsistencia;
use App\Models\Tarea;

class TareaNotificationService
{
    /**
     * @param  list<string>  $accountIds
     */
    public function assigned(Tarea $task, array $accountIds): void
    {
        foreach ($accountIds as $accountId) {
            if ($accountId === $task->asignada_por) {
                continue;
            }

            $userId = $this->userIdForAccount($accountId);
            if ($userId === null) {
                continue;
            }

            $this->notify(
                $userId,
                'tarea_asignada',
                'Nueva tarea asignada',
                "Te asignaron la tarea: {$task->titulo}.",
                "tarea-{$task->id}-asignada-{$accountId}",
            );
        }
    }

    public function statusChanged(Tarea $task, string $status, string $actorId): void
    {
        if (! in_array($status, ['completada', 'cancelada'], true)) {
            return;
        }

        $targetAccountIds = $status === 'completada'
            ? [$task->asignada_por]
            : $task->assignees()->pluck('cuentas_acceso.id')->all();
        $title = $status === 'completada' ? 'Tarea completada' : 'Tarea cancelada';
        $message = $status === 'completada'
            ? "La tarea {$task->titulo} fue marcada como completada."
            : "La tarea {$task->titulo} fue cancelada.";

        foreach ($targetAccountIds as $targetAccountId) {
            if ($targetAccountId === $actorId) {
                continue;
            }

            $userId = $this->userIdForAccount($targetAccountId);
            if ($userId !== null) {
                $this->notify(
                    $userId,
                    "tarea_{$status}",
                    $title,
                    $message,
                    "tarea-{$task->id}-{$status}-{$targetAccountId}",
                );
            }
        }
    }

    private function userIdForAccount(string $accountId): ?int
    {
        $userId = CuentaAcceso::query()
            ->whereKey($accountId)
            ->where('activo', true)
            ->value('user_id');

        return $userId !== null ? (int) $userId : null;
    }

    private function notify(int $userId, string $type, string $title, string $message, string $key): void
    {
        NotificacionAsistencia::query()->firstOrCreate(
            ['clave' => "institucional-{$userId}-{$key}"],
            [
                'user_id' => $userId,
                'tipo' => $type,
                'titulo' => $title,
                'mensaje' => $message,
            ],
        );
    }
}
