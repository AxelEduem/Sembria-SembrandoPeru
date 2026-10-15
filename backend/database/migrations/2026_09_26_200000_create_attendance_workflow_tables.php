<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencia_configuraciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('minutos_antes_inicio')->default(5);
            $table->unsignedSmallInteger('tolerancia_tardanza')->default(10);
            $table->unsignedSmallInteger('umbral_salida_anticipada')->default(1);
            $table->unsignedSmallInteger('minutos_gracia_falta')->default(0);
            $table->unsignedSmallInteger('recordatorio_inicio')->default(5);
            $table->unsignedSmallInteger('recordatorio_salida')->default(10);
            $table->unsignedSmallInteger('max_minutos_offline')->default(120);
            $table->time('jornada_hora_inicio')->nullable();
            $table->time('jornada_hora_fin')->nullable();
            $table->json('jornada_dias')->nullable();
            $table->uuid('actualizado_por')->nullable();
            $table->timestampsTz();
            $table->foreign('actualizado_por')->references('id')->on('cuentas_acceso')->nullOnDelete();
        });
        DB::table('asistencia_configuraciones')->insert(['created_at' => now(), 'updated_at' => now()]);

        Schema::create('asistencia_dias_no_laborables', function (Blueprint $table) {
            $table->id();
            $table->date('fecha')->unique();
            $table->string('nombre');
            $table->boolean('activo')->default(true);
            $table->uuid('registrado_por')->nullable();
            $table->timestampsTz();
            $table->foreign('registrado_por')->references('id')->on('cuentas_acceso')->nullOnDelete();
        });

        Schema::create('asistencia_permisos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integrante_id')->constrained('integrantes')->cascadeOnDelete();
            $table->string('tipo', 40);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->text('motivo');
            $table->unsignedInteger('minutos_a_recuperar')->default(0);
            $table->string('estado', 20)->default('pendiente');
            $table->uuid('solicitado_por');
            $table->uuid('resuelto_por')->nullable();
            $table->timestampTz('fecha_resolucion')->nullable();
            $table->text('observacion')->nullable();
            $table->string('adjunto_path')->nullable();
            $table->timestampsTz();
            $table->foreign('solicitado_por')->references('id')->on('cuentas_acceso')->restrictOnDelete();
            $table->foreign('resuelto_por')->references('id')->on('cuentas_acceso')->nullOnDelete();
            $table->index(['integrante_id', 'fecha_inicio', 'fecha_fin']);
            $table->index('estado');
        });

        Schema::create('asistencia_recuperaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permiso_id')->nullable()->constrained('asistencia_permisos')->cascadeOnDelete();
            $table->foreignId('justificacion_id')->nullable()->constrained('asistencia_justificaciones')->cascadeOnDelete();
            $table->date('fecha');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->unsignedInteger('minutos');
            $table->string('estado', 20)->default('programada');
            $table->timestampTz('hora_entrada_real')->nullable();
            $table->timestampTz('hora_salida_real')->nullable();
            $table->unsignedInteger('minutos_realizados')->default(0);
            $table->text('descripcion')->nullable();
            $table->foreignId('asistencia_id')->nullable()->constrained('asistencias')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['fecha', 'estado']);
            $table->index('justificacion_id');
        });

        Schema::create('asistencia_apelaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('amonestacion_id')->constrained('asistencia_amonestaciones')->cascadeOnDelete();
            $table->foreignId('integrante_id')->constrained('integrantes')->cascadeOnDelete();
            $table->string('tipo', 30)->default('general');
            $table->text('motivo');
            $table->string('adjunto_path')->nullable();
            $table->string('estado', 20)->default('pendiente');
            $table->uuid('solicitado_por');
            $table->uuid('resuelto_por')->nullable();
            $table->timestampTz('fecha_resolucion')->nullable();
            $table->text('observacion')->nullable();
            $table->timestampsTz();
            $table->foreign('solicitado_por')->references('id')->on('cuentas_acceso')->restrictOnDelete();
            $table->foreign('resuelto_por')->references('id')->on('cuentas_acceso')->nullOnDelete();
            $table->index(['integrante_id', 'estado']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                ALTER TABLE asistencia_recuperaciones
                ADD CONSTRAINT asistencia_recuperaciones_origen_check
                CHECK ((permiso_id IS NOT NULL) <> (justificacion_id IS NOT NULL))
            SQL);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencia_apelaciones');
        Schema::dropIfExists('asistencia_recuperaciones');
        Schema::dropIfExists('asistencia_permisos');
        Schema::dropIfExists('asistencia_dias_no_laborables');
        Schema::dropIfExists('asistencia_configuraciones');
    }
};
