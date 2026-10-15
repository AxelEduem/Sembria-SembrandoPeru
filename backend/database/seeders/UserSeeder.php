<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $usuarios = [
            [
                'email' => 'aescribano@sembrandoperu.org',
                'name' => 'AXEL EDUARDO ESCRIBANO MEZA',
                'password' => '28112004',
            ],
        ];

        foreach ($usuarios as $usuario) {
            User::updateOrCreate(
                ['email' => $usuario['email']],
                [
                    'name' => $usuario['name'],
                    'password' => Hash::make($usuario['password']),
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
