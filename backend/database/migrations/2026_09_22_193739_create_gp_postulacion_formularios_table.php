<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_formularios', function (Blueprint $table) {
            $table->id();

            $table->foreignId('postulacion_id')
                ->constrained('gp_postulaciones')
                ->cascadeOnDelete();

            $table->string('nombre');

            $table->text('descripcion')
                ->nullable();

            $table->string('estado', 30)
                ->default('pendiente');

            $table->timestampsTz();

            $table->index('postulacion_id');
            $table->index('estado');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_formularios
            ADD CONSTRAINT gp_postulacion_formularios_nombre_check
            CHECK (btrim(nombre) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_formularios');
    }
};