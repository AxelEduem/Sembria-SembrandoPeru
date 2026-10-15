<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_seguimientos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('postulacion_id')
                ->unique()
                ->constrained('gp_postulaciones')
                ->cascadeOnDelete();

            $table->string('estado', 40)
                ->default('en_seguimiento');

            $table->timestampTz('fecha_inicio')
                ->useCurrent();

            $table->date('fecha_estimada_decision')
                ->nullable();

            $table->timestampTz('fecha_cierre')
                ->nullable();

            $table->uuid('cerrado_por')
                ->nullable();

            $table->text('motivo_cierre')
                ->nullable();

            $table->string('tipo_resultado', 50)
                ->nullable();

            $table->date('fecha_resultado')
                ->nullable();

            $table->text('observacion_resultado')
                ->nullable();

            /*
             * La FK se agrega posteriormente porque
             * gp_postulacion_comunicaciones también referencia
             * esta tabla.
             */
            $table->foreignId('comunicacion_resultado_id')
                ->nullable();

            $table->text('evidencia_resultado')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('cerrado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('postulacion_id');
            $table->index('estado');
            $table->index('cerrado_por');
            $table->index('tipo_resultado');
            $table->index('fecha_resultado');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_seguimientos
            ADD CONSTRAINT gp_postulacion_seguimientos_estado_check
            CHECK (
                estado IN (
                    'en_seguimiento',
                    'requiere_respuesta',
                    'resultado_registrado',
                    'cerrado'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_seguimientos');
    }
};