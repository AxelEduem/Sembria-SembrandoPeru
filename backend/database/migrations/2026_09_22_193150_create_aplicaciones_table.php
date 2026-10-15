<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aplicaciones', function (Blueprint $table) {
            $table->id();

            $table->string('nombre');
            $table->text('descripcion')->nullable();

            $table->text('imagen_url')->nullable();
            $table->text('imagen_path')->nullable();

            $table->unsignedInteger('licencias_total')
                ->default(1);

            $table->boolean('activo')
                ->default(true);

            $table->foreignId('area_id')
                ->nullable()
                ->constrained('areas')
                ->nullOnDelete();

            $table->timestampsTz();

            $table->index('area_id');
            $table->index('activo');
        });

        DB::statement("
            ALTER TABLE aplicaciones
            ADD CONSTRAINT aplicaciones_nombre_check
            CHECK (btrim(nombre) <> '')
        ");

        DB::statement('
            ALTER TABLE aplicaciones
            ADD CONSTRAINT aplicaciones_licencias_total_check
            CHECK (licencias_total > 0)
        ');

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                CREATE UNIQUE INDEX aplicaciones_nombre_lower_unique
                ON aplicaciones (LOWER(TRIM(nombre)))
                WHERE nombre IS NOT NULL AND TRIM(nombre) <> ''
            SQL);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('aplicaciones');
    }
};
