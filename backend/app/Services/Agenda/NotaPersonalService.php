<?php

namespace App\Services\Agenda;

use App\Models\CuentaAcceso;
use App\Models\NotaPersonal;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;

class NotaPersonalService
{
    public function list(User $user): Collection
    {
        $account = $this->activeAccount($user);

        return NotaPersonal::query()
            ->where('cuenta_id', $account->id)
            ->orderByDesc('fijada')
            ->latest('updated_at')
            ->get();
    }

    public function create(User $user, array $data): NotaPersonal
    {
        $account = $this->activeAccount($user);

        return NotaPersonal::query()->create($data + ['cuenta_id' => $account->id]);
    }

    public function update(User $user, NotaPersonal $note, array $data): NotaPersonal
    {
        $this->authorizeOwner($this->activeAccount($user), $note);
        $note->update($data);

        return $note->refresh();
    }

    public function delete(User $user, NotaPersonal $note): void
    {
        $this->authorizeOwner($this->activeAccount($user), $note);
        $note->delete();
    }

    private function activeAccount(User $user): CuentaAcceso
    {
        $account = CuentaAcceso::query()
            ->where('user_id', $user->id)
            ->where('activo', true)
            ->first();

        if ($account === null) {
            throw new AuthorizationException('La cuenta institucional no está activa o configurada.');
        }

        return $account;
    }

    private function authorizeOwner(CuentaAcceso $account, NotaPersonal $note): void
    {
        if ($note->cuenta_id !== $account->id) {
            throw new AuthorizationException('No puedes acceder a esta nota personal.');
        }
    }
}
