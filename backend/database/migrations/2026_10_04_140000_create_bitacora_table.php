<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('cuenta_acceso_id')->nullable()->constrained('cuentas_acceso')->nullOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('actor_nombre', 200);
            $table->string('actor_correo', 255)->nullable();
            $table->text('actor_avatar_path')->nullable();
            $table->string('area_nombre', 150)->nullable();
            $table->string('modulo', 100);
            $table->string('accion', 100);
            $table->text('descripcion');
            $table->string('entidad_tipo', 100)->nullable();
            $table->string('entidad_id', 100)->nullable();
            $table->string('metodo', 10);
            $table->string('ruta', 255);
            $table->unsignedSmallInteger('estado_http');
            $table->string('resultado', 20);
            $table->json('campos_modificados')->nullable();
            $table->json('contexto')->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['created_at', 'id']);
            $table->index(['modulo', 'created_at']);
            $table->index(['accion', 'created_at']);
            $table->index(['resultado', 'created_at']);
            $table->index(['cuenta_acceso_id', 'created_at']);
            $table->index(['area_id', 'created_at']);
            $table->index(['entidad_tipo', 'entidad_id']);
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora');
    }
};
