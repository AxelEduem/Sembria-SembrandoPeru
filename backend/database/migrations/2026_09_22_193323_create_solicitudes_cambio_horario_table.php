<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_cambio_horario', function (Blueprint $table) {
            $table->id();

            $table->foreignId('integrante_id')
                ->constrained('integrantes')
                ->restrictOnDelete();

            $table->foreignId('historial_anterior_id')
                ->constrained('integrantes_historial')
                ->restrictOnDelete();

            $table->string('estado', 20)
                ->default('PENDIENTE');

            $table->timestampTz('fecha_solicitud')
                ->useCurrent();

            $table->date('fecha_efectiva');

            $table->text('motivo')
                ->nullable();

            $table->timestampTz('fecha_resolucion')
                ->nullable();

            $table->uuid('resuelto_por')
                ->nullable();

            $table->text('observacion_resolucion')
                ->nullable();

            $table->foreignId('historial_nuevo_id')
                ->nullable()
                ->constrained('integrantes_historial')
                ->nullOnDelete();

            $table->uuid('created_by');

            $table->timestampsTz();

            $table->foreign('resuelto_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->foreign('created_by')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->index('integrante_id');
            $table->index('historial_anterior_id');
            $table->index('historial_nuevo_id');
            $table->index('estado');
            $table->index('resuelto_por');
            $table->index('created_by');
        });

        DB::statement("
            ALTER TABLE solicitudes_cambio_horario
            ADD CONSTRAINT solicitudes_cambio_horario_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'APROBADA',
                    'RECHAZADA',
                    'REQUIERE_CORRECCION',
                    'CANCELADA'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_cambio_horario');
    }
};
