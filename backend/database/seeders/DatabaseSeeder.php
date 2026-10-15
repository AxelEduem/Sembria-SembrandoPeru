<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AreaSeeder::class,
            RolSeeder::class,
            PermisoSeeder::class,
            CoordinadorDireccionDesarrolloOrganizacionalSeeder::class,
            RolPermisoSeeder::class,
            CargoSeeder::class,
            PersonaSeeder::class,
            UserSeeder::class,
            CuentaAccesoSeeder::class,
            IntegranteSeeder::class,
            IntegranteHistorialSeeder::class,
            IntegranteHorarioSeeder::class,
        ]);
    }
}
