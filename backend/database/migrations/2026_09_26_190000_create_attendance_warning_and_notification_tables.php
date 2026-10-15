<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencia_amonestaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asistencia_id')->constrained('asistencias')->cascadeOnDelete();
            $table->foreignId('justificacion_id')->unique()->constrained('asistencia_justificaciones')->cascadeOnDelete();
            $table->foreignId('integrante_id')->constrained('integrantes')->restrictOnDelete();
            $table->text('motivo');
            $table->string('estado', 20)->default('activa')->index();
            $table->string('gravedad', 10)->default('media')->index();
            $table->uuid('registrado_por')->nullable();
            $table->timestampsTz();
            $table->foreign('registrado_por')->references('id')->on('cuentas_acceso')->nullOnDelete();
            $table->index(['integrante_id', 'created_at']);
        });

        Schema::create('notificaciones_asistencia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('asistencia_id')->nullable()->constrained('asistencias')->nullOnDelete();
            $table->string('tipo', 50);
            $table->string('titulo');
            $table->text('mensaje');
            $table->string('clave')->unique();
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('dismissed_at')->nullable();
            $table->timestampsTz();
            $table->index(['user_id', 'read_at']);
            $table->index(['user_id', 'dismissed_at']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE asistencia_amonestaciones ADD CONSTRAINT asistencia_amonestaciones_gravedad_check CHECK (gravedad IN ('baja', 'media', 'grave'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones_asistencia');
        Schema::dropIfExists('asistencia_amonestaciones');
    }
};
