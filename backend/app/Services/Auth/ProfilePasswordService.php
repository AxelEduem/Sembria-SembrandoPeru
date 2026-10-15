<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfilePasswordService
{
    /**
     * Cambia la contraseña del usuario autenticado tras verificar la actual.
     *
     * Este servicio NO toca must_change_password ni password_temporal_expira_en.
     * Esos campos son exclusivos del flujo de contraseña temporal.
     */
    public function change(User $user, string $currentPassword, string $newPassword): void
    {
        DB::transaction(function () use ($user, $currentPassword, $newPassword): void {
            $lockedUser = User::query()
                ->where('id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedUser) {
                throw ValidationException::withMessages([
                    'current_password' => 'No se pudo verificar la cuenta.',
                ]);
            }

            if (! Hash::check($currentPassword, $lockedUser->password)) {
                throw ValidationException::withMessages([
                    'current_password' => 'La contraseña actual es incorrecta.',
                ]);
            }

            if (Hash::check($newPassword, $lockedUser->password)) {
                throw ValidationException::withMessages([
                    'password' => 'La nueva contraseña debe ser diferente a la actual.',
                ]);
            }

            $lockedUser->forceFill(['password' => $newPassword])->save();
        });
    }
}
