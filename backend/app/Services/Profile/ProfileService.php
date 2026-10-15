<?php

namespace App\Services\Profile;

use App\Models\Persona;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProfileService
{
    public function update(User $user, array $data): Persona
    {
        return DB::transaction(function () use ($user, $data): Persona {
            $account = $user->cuentaAcceso()
                ->where('activo', true)
                ->with('persona')
                ->lockForUpdate()
                ->first();

            if ($account?->persona === null) {
                throw ValidationException::withMessages([
                    'profile' => 'La cuenta no tiene una persona activa asociada.',
                ]);
            }

            $names = trim($data['nombres']);
            $lastNames = trim($data['apellidos']);

            $account->persona->update([
                'nombres' => $names,
                'apellidos' => $lastNames,
            ]);
            $user->update(['name' => trim("{$names} {$lastNames}")]);

            return $account->persona->fresh();
        });
    }
}
