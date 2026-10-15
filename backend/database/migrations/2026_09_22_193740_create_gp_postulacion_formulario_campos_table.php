<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_formulario_campos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('formulario_id')
                ->constrained('gp_postulacion_formularios')
                ->cascadeOnDelete();

            $table->string('etiqueta');

            $table->string('clave');

            $table->string('tipo', 30);

            $table->text('valor')
                ->nullable();

            $table->boolean('requerido')
                ->default(false);

            $table->integer('orden')
                ->default(0);

            $table->jsonb('opciones')
                ->default('[]');

            $table->text('observaciones')
                ->nullable();

            $table->timestampsTz();

            $table->index('formulario_id');
            $table->index('clave');
            $table->index('tipo');
            $table->index('orden');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_formulario_campos
            ADD CONSTRAINT gp_postulacion_formulario_campos_etiqueta_check
            CHECK (btrim(etiqueta) <> '')
        ");

        DB::statement("
            ALTER TABLE gp_postulacion_formulario_campos
            ADD CONSTRAINT gp_postulacion_formulario_campos_clave_check
            CHECK (btrim(clave) <> '')
        ");

        DB::statement("
            ALTER TABLE gp_postulacion_formulario_campos
            ADD CONSTRAINT gp_postulacion_formulario_campos_tipo_check
            CHECK (btrim(tipo) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_formulario_campos');
    }
};