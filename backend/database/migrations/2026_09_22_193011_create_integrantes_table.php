<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrantes', function (Blueprint $table) {
            $table->id();

            $table->string('estado', 20)
                ->default('Activo');

            $table->boolean('accesos_pendientes_revision')
                ->default(false);

            $table->boolean('accesos_retirados')
                ->default(false);

            $table->timestampTz('accesos_retirados_at')->nullable();

            $table->date('fecha_nacimiento')->nullable();

            $table->uuid('persona_id');

            $table->text('avatar_path')->nullable();

            $table->string('documento_identidad')->nullable();
            $table->string('telefono')->nullable();
            $table->string('tipo_documento')->nullable();

            $table->string('departamento')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('distrito')->nullable();

            $table->timestampsTz();

            $table->foreign('persona_id')
                ->references('id')
                ->on('personas')
                ->restrictOnDelete();

            $table->index('persona_id');
            $table->index('estado');
            $table->unique('documento_identidad', 'integrantes_documento_identidad_unique');
        });

        DB::statement("
            ALTER TABLE integrantes
            ADD CONSTRAINT integrantes_estado_check
            CHECK (estado IN ('Activo', 'Inactivo'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('integrantes');
    }
};
