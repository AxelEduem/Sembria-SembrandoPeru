<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('gp_postulaciones as p')
            ->leftJoin('gp_postulacion_seguimientos as s', 's.postulacion_id', '=', 'p.id')
            ->where('p.estado', 'enviada')
            ->whereNull('s.id')
            ->select(['p.id', 'p.fecha_envio', 'p.hora_envio', 'p.updated_at'])
            ->orderBy('p.id')
            ->chunkById(200, function ($postulations): void {
                $now = now();
                $rows = $postulations->map(function ($postulation) use ($now): array {
                    $startedAt = $postulation->fecha_envio
                        ? $postulation->fecha_envio.' '.($postulation->hora_envio ?: '00:00:00')
                        : ($postulation->updated_at ?: $now);

                    return [
                        'postulacion_id' => $postulation->id,
                        'estado' => 'en_seguimiento',
                        'fecha_inicio' => $startedAt,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })->all();

                DB::table('gp_postulacion_seguimientos')->insertOrIgnore($rows);
            }, 'p.id', 'id');
    }

    public function down(): void
    {
        // No se eliminan seguimientos porque pueden haber recibido actividad después del backfill.
    }
};
