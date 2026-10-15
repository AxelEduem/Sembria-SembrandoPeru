<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_checklist', function (Blueprint $table) {
            $table->id();

            $table->foreignId('postulacion_id')
                ->constrained('gp_postulaciones')
                ->cascadeOnDelete();

            $table->string('categoria');

            $table->string('titulo');

            $table->boolean('requerido')
                ->default(true);

            $table->boolean('completado')
                ->default(false);

            $table->text('observaciones')
                ->nullable();

            $table->integer('orden')
                ->default(0);

            $table->timestampsTz();

            $table->index('postulacion_id');
            $table->index('categoria');
            $table->index('completado');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_checklist
            ADD CONSTRAINT gp_postulacion_checklist_titulo_check
            CHECK (btrim(titulo) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_checklist');
    }
};