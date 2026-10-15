<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_fuentes_financiamiento', function (Blueprint $table) {
            $table->id();

            $table->string('nombre');

            $table->string('tipo', 30)
                ->default('otra');

            $table->text('sitio_web')
                ->nullable();

            $table->text('descripcion')
                ->nullable();

            $table->boolean('activo')
                ->default(true);

            $table->timestampsTz();

            $table->index('tipo');
            $table->index('activo');
        });

        DB::statement("
            ALTER TABLE gp_fuentes_financiamiento
            ADD CONSTRAINT gp_fuentes_financiamiento_nombre_check
            CHECK (btrim(nombre) <> '')
        ");

        DB::statement("
            ALTER TABLE gp_fuentes_financiamiento
            ADD CONSTRAINT gp_fuentes_financiamiento_tipo_check
            CHECK (
                tipo IN (
                    'multilateral',
                    'embajada',
                    'empresa',
                    'promotor',
                    'otra'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_fuentes_financiamiento');
    }
};