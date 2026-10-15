<?php

namespace App\Services\Inicio;

use App\Models\Area;
use App\Models\Integrante;
use Illuminate\Support\Facades\DB;

class InicioService
{
    /** @return array{integrantes_activos: int, areas_activas: int, usuarios_conectados: int} */
    public function summary(): array
    {
        $activeSince = now()->subMinutes((int) config('session.lifetime'))->getTimestamp();

        return [
            'integrantes_activos' => Integrante::query()->where('estado', 'Activo')->count(),
            'areas_activas' => Area::query()->where('activo', true)->count(),
            'usuarios_conectados' => DB::table('sessions')
                ->whereNotNull('user_id')
                ->where('last_activity', '>=', $activeSince)
                ->distinct()
                ->count('user_id'),
        ];
    }
}
