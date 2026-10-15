<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CuentaAccesoSeeder extends Seeder
{
    public function run(): void
    {
        $correos = [
            'aescribano@sembrandoperu.org',
        ];

        foreach ($correos as $correo) {
            $persona = DB::table('personas')
                ->where('correo', $correo)
                ->first();

            if (! $persona) {
                throw new \RuntimeException(
                    "No existe la persona con correo {$correo}."
                );
            }

            $user = DB::table('users')
                ->where('email', $correo)
                ->first();

            if (! $user) {
                throw new \RuntimeException(
                    "No existe el usuario de Laravel con correo {$correo}."
                );
            }

            DB::table('cuentas_acceso')->updateOrInsert(
                ['user_id' => $user->id],
                [
                    'id' => DB::table('cuentas_acceso')
                        ->where('user_id', $user->id)
                        ->value('id') ?? (string) Str::uuid(),
                    'persona_id' => $persona->id,
                    'activo' => true,
                    'must_change_password' => false,
                    'updated_at' => now(),
                    'created_at' => DB::table('cuentas_acceso')
                        ->where('user_id', $user->id)
                        ->value('created_at') ?? now(),
                ]
            );
        }
    }
}
