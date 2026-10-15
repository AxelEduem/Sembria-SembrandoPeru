<?php

namespace App\Services\Auth;

use App\Models\CuentaAcceso;
use App\Models\Persona;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TemporaryPasswordService
{
    public function complete(User $user, string $password): void
    {
        DB::transaction(function () use ($user, $password): void {
            $account = CuentaAcceso::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $account || ! $account->activo) {
                throw ValidationException::withMessages([
                    'password' => 'La cuenta institucional no está activa.',
                ]);
            }

            if (! $account->must_change_password) {
                throw ValidationException::withMessages([
                    'password' => 'El cambio de contraseña temporal ya fue completado.',
                ]);
            }

            $person = Persona::query()->lockForUpdate()->find($account->persona_id);

            if (! $person) {
                throw ValidationException::withMessages([
                    'password' => 'La cuenta institucional no está correctamente configurada.',
                ]);
            }

            if (
                $person->password_temporal_expira_en !== null
                && now()->greaterThan($person->password_temporal_expira_en)
            ) {
                throw ValidationException::withMessages([
                    'password' => 'La contraseña temporal ha expirado. Solicita nuevas credenciales al administrador.',
                ]);
            }

            if (Hash::check($password, $user->password)) {
                throw ValidationException::withMessages([
                    'password' => 'No puedes reutilizar tu contraseña temporal. Ingresa una contraseña diferente.',
                ]);
            }

            $user->forceFill(['password' => $password])->save();
            $account->update(['must_change_password' => false]);
            $person->update(['password_temporal_expira_en' => null]);
        });
    }
}
