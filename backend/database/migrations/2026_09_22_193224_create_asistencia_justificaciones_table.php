<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencia_justificaciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('asistencia_id')
                ->constrained('asistencias')
                ->cascadeOnDelete();

            $table->string('tipo', 40)
                ->default('general')
                ->index();

            $table->text('motivo');

            $table->string('estado', 20)
                ->default('pendiente');

            $table->uuid('registrado_por');

            $table->uuid('validado_por')
                ->nullable();

            $table->timestampTz('fecha_registro')
                ->useCurrent();

            $table->timestampTz('fecha_validacion')
                ->nullable();

            $table->text('observacion')->nullable();

            $table->string('adjunto_path')->nullable();

            $table->foreign('registrado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->foreign('validado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('asistencia_id');
            $table->index('estado');
            $table->index('registrado_por');
            $table->index('validado_por');
        });

        /*
         * El motivo no puede estar vacío ni contener únicamente espacios.
         */
        DB::statement("
            ALTER TABLE asistencia_justificaciones
            ADD CONSTRAINT asistencia_justificaciones_motivo_check
            CHECK (btrim(motivo) <> '')
        ");

        /*
         * Estados permitidos para una justificación.
         */
        DB::statement("
            ALTER TABLE asistencia_justificaciones
            ADD CONSTRAINT asistencia_justificaciones_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'aprobada',
                    'rechazada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencia_justificaciones');
    }
};
