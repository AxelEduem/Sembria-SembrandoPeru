<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencia_auditoria', function (Blueprint $table) {
            $table->id();

            $table->foreignId('asistencia_id')
                ->constrained('asistencias')
                ->cascadeOnDelete();

            $table->string('accion', 50);

            $table->uuid('actor_id')
                ->nullable();

            $table->jsonb('datos_anteriores')
                ->nullable();

            $table->jsonb('datos_nuevos')
                ->nullable();

            $table->text('motivo')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('actor_id')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('asistencia_id');
            $table->index('accion');
            $table->index('actor_id');
        });

        /*
         * Acciones permitidas en la auditoría.
         */
        DB::statement("
            ALTER TABLE asistencia_auditoria
            ADD CONSTRAINT asistencia_auditoria_accion_check
            CHECK (
                accion IN (
                    'creada',
                    'entrada_registrada',
                    'salida_registrada',
                    'actualizada',
                    'justificada',
                    'corregida',
                    'cierre_administrativo',
                    'falta_revertida_por_registro_offline',
                    'justificacion_aprobada',
                    'justificacion_rechazada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencia_auditoria');
    }
};
