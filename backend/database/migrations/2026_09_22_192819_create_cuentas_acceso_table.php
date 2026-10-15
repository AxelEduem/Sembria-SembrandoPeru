<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cuentas_acceso', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->restrictOnDelete();

            $table->uuid('persona_id');

            $table->boolean('activo')->default(true);

            $table->boolean('must_change_password')->default(false);

            $table->timestampsTz();

            $table->foreign('persona_id')
                ->references('id')
                ->on('personas')
                ->restrictOnDelete();

            $table->unique('persona_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuentas_acceso');
    }
};