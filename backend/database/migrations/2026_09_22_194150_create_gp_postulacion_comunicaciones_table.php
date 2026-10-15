<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_comunicaciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('seguimiento_id')
                ->constrained('gp_postulacion_seguimientos')
                ->cascadeOnDelete();

            $table->timestampTz('fecha')
                ->useCurrent();

            $table->string('direccion', 20);

            $table->string('canal', 50)
                ->default('otro');

            $table->text('asunto')
                ->nullable();

            $table->text('remitente')
                ->nullable();

            $table->text('destinatarios')
                ->nullable();

            $table->text('resumen');

            $table->boolean('requiere_respuesta')
                ->default(false);

            $table->date('fecha_limite')
                ->nullable();

            $table->uuid('registrado_por');

            $table->text('evidencia')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('registrado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->index('seguimiento_id');
            $table->index('fecha');
            $table->index('direccion');
            $table->index('canal');
            $table->index('requiere_respuesta');
            $table->index('registrado_por');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_comunicaciones
            ADD CONSTRAINT gp_postulacion_comunicaciones_direccion_check
            CHECK (btrim(direccion) <> '')
        ");

        DB::statement("
            ALTER TABLE gp_postulacion_comunicaciones
            ADD CONSTRAINT gp_postulacion_comunicaciones_resumen_check
            CHECK (btrim(resumen) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_comunicaciones');
    }
};