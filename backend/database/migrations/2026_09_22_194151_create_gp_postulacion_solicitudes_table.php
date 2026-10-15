<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_solicitudes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('seguimiento_id')
                ->constrained('gp_postulacion_seguimientos')
                ->cascadeOnDelete();

            $table->text('descripcion');

            $table->timestampTz('fecha_recepcion')
                ->useCurrent();

            $table->uuid('responsable_id')
                ->nullable();

            $table->date('fecha_limite')
                ->nullable();

            $table->string('estado', 30)
                ->default('pendiente');

            $table->text('respuesta')
                ->nullable();

            $table->timestampTz('fecha_respuesta')
                ->nullable();

            $table->text('evidencia')
                ->nullable();

            $table->text('observaciones')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('responsable_id')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('seguimiento_id');
            $table->index('responsable_id');
            $table->index('fecha_limite');
            $table->index('estado');
            $table->index('fecha_recepcion');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_solicitudes
            ADD CONSTRAINT gp_postulacion_solicitudes_descripcion_check
            CHECK (btrim(descripcion) <> '')
        ");

        DB::statement("
            ALTER TABLE gp_postulacion_solicitudes
            ADD CONSTRAINT gp_postulacion_solicitudes_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'respondida',
                    'cancelada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_solicitudes');
    }
};