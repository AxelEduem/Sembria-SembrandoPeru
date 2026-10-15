<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gp_convocatorias', function (Blueprint $table): void {
            $table->string('resultado_final', 30)->nullable()->after('etapa');
            $table->text('motivo_descarte')->nullable()->after('resultado_final');
            $table->timestampTz('cerrada_at')->nullable()->after('motivo_descarte');
            $table->foreignUuid('cerrada_por')->nullable()->after('cerrada_at')
                ->constrained('cuentas_acceso')->nullOnDelete();
            $table->timestampTz('archivada_at')->nullable()->after('cerrada_por');
            $table->foreignUuid('archivada_por')->nullable()->after('archivada_at')
                ->constrained('cuentas_acceso')->nullOnDelete();
            $table->index(['resultado_final', 'cerrada_at']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE gp_convocatorias ADD CONSTRAINT gp_convocatorias_resultado_final_check CHECK (resultado_final IS NULL OR resultado_final IN ('adjudicada','no_adjudicada','descartada'))");
            DB::statement("ALTER TABLE gp_convocatorias ADD CONSTRAINT gp_convocatorias_motivo_descarte_check CHECK ((resultado_final = 'descartada' AND NULLIF(btrim(motivo_descarte), '') IS NOT NULL) OR (resultado_final IS DISTINCT FROM 'descartada' AND motivo_descarte IS NULL))");
        }

        DB::table('gp_convocatorias as c')
            ->join('gp_postulaciones as p', 'p.convocatoria_id', '=', 'c.id')
            ->join('gp_postulacion_seguimientos as s', 's.postulacion_id', '=', 'p.id')
            ->whereIn('c.estado', ['cerrada', 'archivada'])
            ->whereIn('s.tipo_resultado', ['adjudicada', 'no_adjudicada'])
            ->select(['c.id', 's.tipo_resultado', 's.fecha_cierre', 's.cerrado_por'])
            ->orderBy('c.id')
            ->each(function (object $row): void {
                DB::table('gp_convocatorias')->where('id', $row->id)->update([
                    'resultado_final' => $row->tipo_resultado,
                    'cerrada_at' => $row->fecha_cierre,
                    'cerrada_por' => $row->cerrado_por,
                ]);
            });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE gp_convocatorias DROP CONSTRAINT IF EXISTS gp_convocatorias_motivo_descarte_check');
            DB::statement('ALTER TABLE gp_convocatorias DROP CONSTRAINT IF EXISTS gp_convocatorias_resultado_final_check');
        }

        Schema::table('gp_convocatorias', function (Blueprint $table): void {
            $table->dropForeign(['cerrada_por']);
            $table->dropForeign(['archivada_por']);
            $table->dropIndex(['resultado_final', 'cerrada_at']);
            $table->dropColumn([
                'resultado_final', 'motivo_descarte', 'cerrada_at', 'cerrada_por',
                'archivada_at', 'archivada_por',
            ]);
        });
    }
};
