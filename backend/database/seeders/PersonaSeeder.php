<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PersonaSeeder extends Seeder
{
    public function run(): void
    {
        $personas = [
            [
                'nombres' => 'AXEL EDUARDO',
                'apellidos' => 'ESCRIBANO MEZA',
                'correo' => 'aescribano@sembrandoperu.org',
            ],
        ];

        foreach ($personas as $persona) {
            $existente = DB::table('personas')
                ->where('correo', $persona['correo'])
                ->first();

            if ($existente) {
                DB::table('personas')
                    ->where('id', $existente->id)
                    ->update([
                        'nombres' => $persona['nombres'],
                        'apellidos' => $persona['apellidos'],
                        'updated_at' => now(),
                    ]);

                continue;
            }

            DB::table('personas')->insert([
                'id' => (string) Str::uuid(),
                'nombres' => $persona['nombres'],
                'apellidos' => $persona['apellidos'],
                'correo' => $persona['correo'],
                'ultimo_envio_credenciales' => null,
                'password_temporal_expira_en' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
