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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 100)->unique();
            $table->string('nombre', 150)->unique();
            $table->text('descripcion')->nullable();

            $table->boolean('acceso_total')->default(false);
            $table->boolean('activo')->default(true);

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE roles
            ADD CONSTRAINT roles_codigo_check
            CHECK (btrim(codigo) <> '')
        ");

        DB::statement("
            ALTER TABLE roles
            ADD CONSTRAINT roles_nombre_check
            CHECK (btrim(nombre) <> '')
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};