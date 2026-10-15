<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_convocatorias', function (Blueprint $table) {
            $table->id();

            /*
             * Fuente de financiamiento.
             */
            $table->foreignId('fuente_id')
                ->constrained('gp_fuentes_financiamiento')
                ->restrictOnDelete();

            /*
             * Área responsable o relacionada.
             */
            $table->foreignId('area_id')
                ->nullable()
                ->constrained('areas')
                ->nullOnDelete();

            $table->foreignId('equipo_id')
                ->nullable()
                ->constrained('gp_equipos')
                ->nullOnDelete();

            /*
             * Información general.
             */
            $table->string('nombre');
            $table->text('descripcion')->nullable();

            $table->string('financiador_nombre');

            $table->text('url_convocatoria')
                ->nullable();

            $table->text('url_postulacion')
                ->nullable();

            /*
             * Fechas.
             */
            $table->date('fecha_apertura')
                ->nullable();

            $table->date('fecha_cierre')
                ->nullable();

            /*
             * Financiamiento.
             */
            $table->decimal('monto_minimo', 15, 2)
                ->nullable();

            $table->decimal('monto_maximo', 15, 2)
                ->nullable();

            $table->string('moneda', 10)
                ->default('USD');

            $table->decimal('monto_solicitable', 15, 2)
                ->nullable();

            /*
             * Características de la convocatoria.
             */
            $table->text('territorio')
                ->nullable();

            $table->string('sector', 50);

            $table->string('tipo_proyecto', 50);

            $table->string('tipo_financiamiento', 50)
                ->default('subvencion');

            $table->text('beneficiario_ideal')
                ->nullable();

            /*
             * Alianzas.
             */
            $table->string('requiere_alianza', 30)
                ->default('no_especificado');

            $table->text('tipo_alianza')
                ->nullable();

            /*
             * Fuente desde donde se encontró.
             */
            $table->text('fuente_encontrada')
                ->nullable();

            /*
             * Usuario que registró la convocatoria.
             */
            $table->uuid('registrada_por');

            $table->date('fecha_registro')
                ->useCurrent();

            /*
             * Flujo de la convocatoria.
             */
            $table->string('estado', 40)
                ->default('borrador');

            $table->string('etapa', 40)
                ->default('deteccion');

            $table->text('observaciones')
                ->nullable();

            /*
             * Fuente de búsqueda.
             */
            $table->string('fuente_busqueda', 100)
                ->nullable();

            $table->text('fuente_busqueda_otro')
                ->nullable();

            $table->timestampsTz();

            /*
             * Relaciones.
             */
            $table->foreign('registrada_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            /*
             * Índices.
             */
            $table->index('fuente_id');
            $table->index('area_id');
            $table->index('registrada_por');
            $table->index('estado');
            $table->index('etapa');
            $table->index('fecha_cierre');
            $table->index('sector');
            $table->index('tipo_proyecto');
            $table->index(['equipo_id', 'etapa']);
        });

        /*
         * El nombre de la convocatoria no puede estar vacío.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_nombre_check
            CHECK (btrim(nombre) <> '')
        ");

        /*
         * El financiador debe tener un nombre válido.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_financiador_nombre_check
            CHECK (btrim(financiador_nombre) <> '')
        ");

        /*
         * Monedas permitidas.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_moneda_check
            CHECK (
                moneda IN (
                    'USD',
                    'PEN',
                    'EUR',
                    'OTRA'
                )
            )
        ");

        /*
         * Sector permitido.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_sector_check
            CHECK (
                sector IN (
                    'medio_ambiente',
                    'salud',
                    'educacion',
                    'fauna',
                    'desarrollo_social',
                    'cultura',
                    'tecnologia',
                    'agricultura',
                    'emprendimiento',
                    'otro'
                )
            )
        ");

        /*
         * Tipos de proyecto permitidos.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_tipo_proyecto_check
            CHECK (
                tipo_proyecto IN (
                    'piloto',
                    'investigacion',
                    'fortalecimiento',
                    'infraestructura',
                    'desarrollo_social',
                    'educativo',
                    'ambiental',
                    'tecnologico',
                    'productivo',
                    'cultural',
                    'otro'
                )
            )
        ");

        /*
         * Tipos de financiamiento permitidos.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_tipo_financiamiento_check
            CHECK (
                tipo_financiamiento IN (
                    'subvencion',
                    'cofinanciamiento',
                    'prestamo',
                    'donacion',
                    'premio',
                    'otro'
                )
            )
        ");

        /*
         * Valores permitidos para requisitos de alianza.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_requiere_alianza_check
            CHECK (
                requiere_alianza IN (
                    'si',
                    'no',
                    'no_especificado'
                )
            )
        ");

        /*
         * Estados del flujo de la convocatoria.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_estado_check
            CHECK (
                estado IN (
                    'borrador',
                    'registrada',
                    'en_revision',
                    'preseleccionada',
                    'no_viable',
                    'enviada',
                    'aprobada',
                    'rechazada',
                    'archivada',
                    'cerrada',
                    'cancelada'
                )
            )
        ");

        /*
         * Etapas del proceso.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_etapa_check
            CHECK (
                etapa IN (
                    'deteccion',
                    'primer_filtro',
                    'segundo_filtro',
                    'aprobacion',
                    'postulacion',
                    'seguimiento',
                    'cierre'
                )
            )
        ");

        /*
         * Fuentes de búsqueda permitidas.
         */
        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_fuente_busqueda_check
            CHECK (
                fuente_busqueda IS NULL
                OR fuente_busqueda IN (
                    'funds_for_ngos',
                    'devex',
                    'nodoka',
                    'impactia',
                    'innovamos',
                    'grantmakers',
                    'grantwatch',
                    'onu',
                    'bid',
                    'fomin',
                    'alstom_fundation',
                    'funds4impact',
                    'kusanone',
                    'mitsubishi',
                    'funds_for_innovation_in_development',
                    'grant_station',
                    'terra_viva_grants_directory',
                    'grant_forward',
                    'philanthropy_news_digest',
                    'google',
                    'web',
                    'redes_sociales',
                    'correo',
                    'recomendacion',
                    'otro'
                )
            )
        ");

        DB::statement("
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_fuente_busqueda_otro_check
            CHECK (
                (fuente_busqueda = 'otro' AND NULLIF(btrim(fuente_busqueda_otro), '') IS NOT NULL)
                OR (fuente_busqueda IS DISTINCT FROM 'otro' AND fuente_busqueda_otro IS NULL)
            )
        ");

        DB::statement('
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_fechas_check
            CHECK (fecha_cierre IS NULL OR fecha_cierre > fecha_registro)
        ');

        DB::statement('
            ALTER TABLE gp_convocatorias
            ADD CONSTRAINT gp_convocatorias_montos_check
            CHECK (
                (monto_minimo IS NULL OR monto_minimo >= 0)
                AND (monto_maximo IS NULL OR monto_maximo >= 0)
                AND (monto_solicitable IS NULL OR monto_solicitable >= 0)
            )
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_convocatorias');
    }
};
