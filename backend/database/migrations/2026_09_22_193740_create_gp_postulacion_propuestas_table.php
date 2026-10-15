<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_propuestas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('postulacion_id')
                ->constrained('gp_postulaciones')
                ->cascadeOnDelete();

            $table->string('tipo', 40);

            $table->string('estado', 30)
                ->default('pendiente');

            $table->uuid('responsable_id')
                ->nullable();

            $table->date('fecha_limite')
                ->nullable();

            $table->text('enlace_documento')
                ->nullable();

            $table->text('observaciones')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('responsable_id')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('postulacion_id');
            $table->index('tipo');
            $table->index('estado');
            $table->index('responsable_id');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_propuestas
            ADD CONSTRAINT gp_postulacion_propuestas_tipo_check
            CHECK (
                tipo IN ('proposal', 'budget')
            )
        ");

        DB::statement("
            ALTER TABLE gp_postulacion_propuestas
            ADD CONSTRAINT gp_postulacion_propuestas_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'en_proceso',
                    'completada',
                    'bloqueada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_propuestas');
    }
};