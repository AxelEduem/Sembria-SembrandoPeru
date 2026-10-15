<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tareas', function (Blueprint $table): void {
            $table->id();
            $table->string('titulo', 140);
            $table->text('descripcion')->nullable();
            $table->uuid('asignada_por');
            $table->uuid('asignada_a');
            $table->string('prioridad', 20)->default('media');
            $table->string('estado', 20)->default('pendiente');
            $table->date('fecha_limite')->nullable();
            $table->timestampTz('completada_at')->nullable();
            $table->timestampsTz();

            $table->foreign('asignada_por')->references('id')->on('cuentas_acceso')->restrictOnDelete();
            $table->foreign('asignada_a')->references('id')->on('cuentas_acceso')->restrictOnDelete();
            $table->index(['asignada_a', 'estado']);
            $table->index(['asignada_por', 'estado']);
            $table->index('fecha_limite');
            $table->index('prioridad');
        });

        Schema::create('tarea_notas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tarea_id')->constrained('tareas')->cascadeOnDelete();
            $table->uuid('autor_id');
            $table->text('contenido');
            $table->timestampsTz();

            $table->foreign('autor_id')->references('id')->on('cuentas_acceso')->restrictOnDelete();
            $table->index(['tarea_id', 'created_at']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE tareas ADD CONSTRAINT tareas_titulo_check CHECK (char_length(btrim(titulo)) BETWEEN 3 AND 140)');
            DB::statement("ALTER TABLE tareas ADD CONSTRAINT tareas_prioridad_check CHECK (prioridad IN ('baja','media','alta','urgente'))");
            DB::statement("ALTER TABLE tareas ADD CONSTRAINT tareas_estado_check CHECK (estado IN ('pendiente','en_progreso','completada','cancelada'))");
            DB::statement('ALTER TABLE tarea_notas ADD CONSTRAINT tarea_notas_contenido_check CHECK (char_length(btrim(contenido)) BETWEEN 1 AND 2000)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tarea_notas');
        Schema::dropIfExists('tareas');
    }
};
