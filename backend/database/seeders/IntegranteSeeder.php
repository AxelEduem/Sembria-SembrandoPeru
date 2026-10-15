<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IntegranteSeeder extends Seeder
{
    public function run(): void
    {
        $integrantes = [
            [
                'correo' => 'aescribano@sembrandoperu.org',
                'fecha_nacimiento' => '2004-11-28',
                'departamento' => 'Lambayeque',
                'ciudad' => 'Ferreñafe',
                'distrito' => 'Ferreñafe',
                'tipo_documento' => 'dni',
                'telefono' => '907702056',
            ],
        ];

        foreach ($integrantes as $data) {
            $persona = DB::table('personas')
                ->where('correo', $data['correo'])
                ->first();

            if (! $persona) {
                throw new \RuntimeException(
                    "No existe la persona con correo {$data['correo']}."
                );
            }

            DB::table('integrantes')->updateOrInsert(
                ['persona_id' => $persona->id],
                [
                    'estado' => 'Activo',
                    'accesos_pendientes_revision' => false,
                    'fecha_nacimiento' => $data['fecha_nacimiento'],
                    'avatar_path' => null,
                    'documento_identidad' => $data['documento_identidad'] ?? null,
                    'telefono' => $data['telefono'] ?? null,
                    'tipo_documento' => $data['tipo_documento'] ?? 'dni',
                    'departamento' => $data['departamento'],
                    'ciudad' => $data['ciudad'],
                    'distrito' => $data['distrito'],
                    'updated_at' => now(),
                    'created_at' => DB::table('integrantes')
                        ->where('persona_id', $persona->id)
                        ->value('created_at') ?? now(),
                ]
            );
        }
    }
}
