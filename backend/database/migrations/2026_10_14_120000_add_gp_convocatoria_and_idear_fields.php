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
            $table->boolean('lleva_cofinanciamiento')->nullable();
            $table->string('tipo_organizacion_admitida', 50)->nullable();
            $table->string('tiempo_postulacion', 30)->nullable();
        });

        Schema::table('gp_postulaciones', function (Blueprint $table): void {
            $table->string('lider_idear_nombre')->nullable();
            $table->date('fecha_identificacion')->nullable();
            $table->date('fecha_revision_diseno')->nullable();
            $table->date('fecha_revision_evidencias')->nullable();
            $table->date('fecha_revision_armado')->nullable();
            $table->date('fecha_revision_primera_replica')->nullable();
            $table->string('rango_postulacion', 30)->nullable();
        });

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(<<<'SQL'
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_organizacion_admitida_check
            CHECK (
                tipo_organizacion_admitida IS NULL
                OR tipo_organizacion_admitida IN (
                    'ongs', 'personas_naturales', 'investigadores', 'empresas',
                    'universidades', 'profesionales', 'otro'
                )
            )
        SQL);
        DB::statement(<<<'SQL'
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_tiempo_postulacion_check
            CHECK (
                tiempo_postulacion IS NULL
                OR tiempo_postulacion IN ('sin_limite', 'con_limite')
            )
        SQL);
        DB::statement(<<<'SQL'
            ALTER TABLE gp_postulaciones
            ADD CONSTRAINT gp_postulaciones_rango_postulacion_check
            CHECK (
                rango_postulacion IS NULL
                OR rango_postulacion IN ('0_15', '15_25', '25_50', '50_100', '100_200', '200_mas')
            )
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE gp_convocatorias DROP CONSTRAINT IF EXISTS gp_convocatorias_organizacion_admitida_check');
            DB::statement('ALTER TABLE gp_convocatorias DROP CONSTRAINT IF EXISTS gp_convocatorias_tiempo_postulacion_check');
            DB::statement('ALTER TABLE gp_postulaciones DROP CONSTRAINT IF EXISTS gp_postulaciones_rango_postulacion_check');
        }

        Schema::table('gp_postulaciones', function (Blueprint $table): void {
            $table->dropColumn([
                'lider_idear_nombre',
                'fecha_identificacion',
                'fecha_revision_diseno',
                'fecha_revision_evidencias',
                'fecha_revision_armado',
                'fecha_revision_primera_replica',
                'rango_postulacion',
            ]);
        });

        Schema::table('gp_convocatorias', function (Blueprint $table): void {
            $table->dropColumn([
                'lleva_cofinanciamiento',
                'tipo_organizacion_admitida',
                'tiempo_postulacion',
            ]);
        });
    }
};
