<?php

namespace App\Services\Integrantes;

use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class IntegranteExpirationService
{
    private const TIMEZONE = 'America/Lima';

    public function process(?CarbonImmutable $date = null): int
    {
        $today = ($date ?? CarbonImmutable::now(self::TIMEZONE))
            ->setTimezone(self::TIMEZONE)
            ->toDateString();
        $processed = 0;

        IntegranteHistorial::query()
            ->where('estado', 'Activo')
            ->whereDate('fecha_fin', '<', $today)
            ->orderBy('id')
            ->pluck('id')
            ->each(function (int $historyId) use ($today, &$processed): void {
                $changed = DB::transaction(function () use ($historyId, $today): bool {
                    $history = IntegranteHistorial::query()
                        ->whereKey($historyId)
                        ->lockForUpdate()
                        ->first();

                    if (
                        $history === null
                        || $history->estado !== 'Activo'
                        || $history->fecha_fin === null
                        || $history->fecha_fin->toDateString() >= $today
                    ) {
                        return false;
                    }

                    $integrante = Integrante::query()
                        ->whereKey($history->integrante_id)
                        ->lockForUpdate()
                        ->firstOrFail();
                    $hasCurrentPeriod = IntegranteHistorial::query()
                        ->where('integrante_id', $integrante->id)
                        ->where('id', '!=', $history->id)
                        ->where('estado', 'Activo')
                        ->where(function ($query) use ($today): void {
                            $query->whereNull('fecha_inicio')
                                ->orWhereDate('fecha_inicio', '<=', $today);
                        })
                        ->where(function ($query) use ($today): void {
                            $query->whereNull('fecha_fin')
                                ->orWhereDate('fecha_fin', '>=', $today);
                        })
                        ->exists();

                    $history->update([
                        'estado' => 'Inactivo',
                        'fecha_desactivacion' => now(),
                        'desactivado_por' => null,
                        'motivo_desactivacion' => 'Se desactivó porque acabó su periodo.',
                        'tipo_desactivacion' => 'automatica',
                    ]);

                    if (! $hasCurrentPeriod) {
                        $pendingAccessReview = $history->accesos()
                            ->where('activo', true)
                            ->exists();

                        $integrante->update([
                            'estado' => 'Inactivo',
                            'accesos_pendientes_revision' => $pendingAccessReview,
                        ]);
                    }

                    return true;
                });

                if ($changed) {
                    $processed++;
                }
            });

        return $processed;
    }
}
