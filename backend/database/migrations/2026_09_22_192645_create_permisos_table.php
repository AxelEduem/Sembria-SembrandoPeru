<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permisos', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 150)->unique();
            $table->string('nombre', 200);
            $table->string('modulo', 100);
            $table->string('accion', 100);
            $table->text('descripcion')->nullable();

            $table->boolean('activo')->default(true);

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE permisos
            ADD CONSTRAINT permisos_codigo_check
            CHECK (btrim(codigo) <> '')
        ");

        DB::statement("
            ALTER TABLE permisos
            ADD CONSTRAINT permisos_nombre_check
            CHECK (btrim(nombre) <> '')
        ");

        DB::statement("
            ALTER TABLE permisos
            ADD CONSTRAINT permisos_modulo_check
            CHECK (btrim(modulo) <> '')
        ");

        DB::statement("
            ALTER TABLE permisos
            ADD CONSTRAINT permisos_accion_check
            CHECK (btrim(accion) <> '')
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permisos');
    }
};