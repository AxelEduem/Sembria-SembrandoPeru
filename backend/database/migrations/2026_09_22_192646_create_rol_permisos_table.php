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
        Schema::create('rol_permisos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('rol_id')
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->foreignId('permiso_id')
                ->constrained('permisos')
                ->cascadeOnDelete();

            $table->string('alcance', 20)
                ->default('area');

            $table->timestampsTz();

            $table->unique(
                ['rol_id', 'permiso_id'],
                'rol_permisos_rol_id_permiso_id_unique'
            );
        });

        DB::statement("
            ALTER TABLE rol_permisos
            ADD CONSTRAINT rol_permisos_alcance_check
            CHECK (alcance IN ('area', 'global'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rol_permisos');
    }
};