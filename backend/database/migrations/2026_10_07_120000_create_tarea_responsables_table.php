<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarea_responsables', function (Blueprint $table): void {
            $table->foreignId('tarea_id')->constrained('tareas')->cascadeOnDelete();
            $table->uuid('cuenta_id');
            $table->timestampsTz();

            $table->foreign('cuenta_id')->references('id')->on('cuentas_acceso')->restrictOnDelete();
            $table->primary(['tarea_id', 'cuenta_id']);
            $table->index(['cuenta_id', 'tarea_id']);
        });

        DB::table('tareas')
            ->select(['id', 'asignada_a', 'created_at', 'updated_at'])
            ->orderBy('id')
            ->chunkById(500, function ($tasks): void {
                DB::table('tarea_responsables')->insertOrIgnore(
                    $tasks->map(fn ($task) => [
                        'tarea_id' => $task->id,
                        'cuenta_id' => $task->asignada_a,
                        'created_at' => $task->created_at,
                        'updated_at' => $task->updated_at,
                    ])->all()
                );
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarea_responsables');
    }
};
