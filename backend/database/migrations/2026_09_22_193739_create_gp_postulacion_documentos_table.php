<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_documentos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('postulacion_id')
                ->constrained('gp_postulaciones')
                ->cascadeOnDelete();

            $table->string('nombre');

            $table->string('categoria', 30)
                ->default('otros');

            $table->text('descripcion')
                ->nullable();

            $table->text('archivo_url')
                ->nullable();

            $table->string('estado', 30)
                ->default('pendiente');

            $table->boolean('requerido')
                ->default(false);

            $table->timestampTz('fecha_carga')
                ->nullable();

            $table->uuid('cargado_por')
                ->nullable();

            $table->timestampTz('fecha_validacion')
                ->nullable();

            $table->uuid('validado_por')
                ->nullable();

            $table->text('observaciones')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('cargado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->foreign('validado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('postulacion_id');
            $table->index('categoria');
            $table->index('estado');
            $table->index('cargado_por');
            $table->index('validado_por');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_documentos
            ADD CONSTRAINT gp_postulacion_documentos_nombre_check
            CHECK (btrim(nombre) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_documentos');
    }
};