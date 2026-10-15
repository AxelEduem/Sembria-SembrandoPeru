# Sembria: instrucciones para agentes

## Alcance

* Este archivo se aplica a todo el repositorio.
* En `frontend/` se aplican además las reglas de `frontend/AGENTS.md`.
* En `backend/` se aplican además las reglas de `backend/AGENTS.md`.
* El `AGENTS.md` más cercano agrega instrucciones específicas sin anular las superiores salvo indicación explícita.

## Proyecto y arquitectura

Sembria es un sistema institucional para integrantes, periodos y horarios, accesos, áreas, cargos, aplicaciones, agenda, asistencia y procesos administrativos.

* Frontend: SPA React en JavaScript/JSX con Vite, React Router y Tailwind CSS.
* Backend: API PHP con Laravel 12, Eloquent, Form Requests, API Resources y Sanctum.
* Datos: PostgreSQL; PHPUnit usa SQLite en memoria. Los archivos usan Flysystem local o S3/R2 según ambiente.
* Migración gradual: autenticación y varios módulos usan Laravel, mientras otros servicios aún usan Supabase. Confirmar el proveedor del módulo antes de editarlo.

Estructura estable: `frontend/src` separa páginas, componentes, hooks y servicios; `backend/app` separa HTTP, servicios y modelos; el esquema Laravel vive en `backend/database/migrations`. `frontend/supabase/migrations` es historial SQL heredado, no evidencia de que una función siga vigente.

## Antes de modificar

1. Leer las instrucciones aplicables según la ruta.
2. Localizar la implementación solicitada y solo sus consumidores, rutas, servicios, esquema y pruebas relevantes.
3. Confirmar el flujo de datos real (`apiRequest`, Supabase o ambos); no copiar el patrón de otro módulo sin verificarlo.
4. Revisar `git status` y preservar cambios existentes del usuario.
5. Buscar componentes, hooks, servicios, helpers y Resources reutilizables antes de crear otros.

Usar búsquedas dirigidas con `rg`/`rg --files`. Evitar inventarios amplios cuando una búsqueda local resuelve la tarea.

## Alcance de los cambios

* Modificar únicamente archivos necesarios para la solicitud.
* No hacer refactors generales, migraciones de proveedor, cambios de arquitectura ni instalaciones salvo necesidad demostrable o petición explícita.
* No duplicar lógica de negocio. Mantenerla en la capa que ya la administra.
* Si cambia un contrato, actualizar juntos productor, consumidores y pruebas.
* No editar archivos generados ni migraciones históricas aplicadas; para instalaciones existentes, crear una migración nueva.

## Reglas por capa

* Frontend: conservar el flujo página/componente → hook → servicio, reutilizar la UI existente y no acceder a datos desde componentes si hay una capa de servicio.
* Backend: mantener controladores delgados; usar Form Requests para entrada, servicios para negocio/autorización/transacciones y API Resources para salida.
* Base de datos: revisar FKs, índices, restricciones y compatibilidad PostgreSQL/SQLite. No ejecutar resets, `migrate:fresh`, `db:wipe` ni seeders destructivos sin solicitud explícita.
* Autenticación: la sesión principal es Laravel Sanctum stateful con cookies y CSRF.
* Autorización: validar en servidor permisos y alcance `global`/`area`; la visibilidad en React solo mejora la UX.
* Identidad: no intercambiar `users.id`, UUID de `cuentas_acceso`, UUID de `personas` e ID de `integrantes`.
* Seguridad: no exponer secretos, `.env`, cookies ni credenciales; validar entradas y archivos; no confiar en IDs o permisos enviados por el navegador.

## Verificación

Después de modificar:

1. Revisar diff y `git status` para detectar cambios accidentales.
2. Ejecutar pruebas focalizadas y ampliar la suite según el riesgo.
3. Ejecutar Pint para PHP y ESLint para JS/JSX modificados.
4. Ejecutar el build del frontend cuando cambie código ejecutable o su configuración.
5. Validar rutas y migraciones cuando cambien contratos HTTP o esquema.

No afirmar que una comprobación pasó si no se ejecutó; informar cualquier validación omitida y su motivo.

## Git

* No sobrescribir cambios ajenos ni usar comandos destructivos como `git reset --hard` o `git checkout --`.
* No crear commits, ramas, tags ni hacer push salvo petición explícita.
* Evitar formateo y cambios no relacionados.

## Exploración eficiente

* No leer archivos completos de forma preventiva.
* Usar `rg` y `rg --files` para localizar símbolos, referencias y estructura.
* Leer únicamente el contexto necesario para comprender la implementación.
* Identificar primero la implementación y sus consumidores directos.
* Ampliar la exploración únicamente cuando la evidencia lo requiera.
* No explorar módulos no relacionados con la tarea.
* Si una búsqueda demuestra que un archivo o módulo no participa en el flujo, no continuar investigándolo salvo nueva evidencia.

## Simplicidad

* Preferir la solución mínima que resuelva correctamente la solicitud.
* Reutilizar código existente antes de crear abstracciones nuevas.
* No crear componentes, hooks, servicios, helpers o capas nuevas sin necesidad.
* No anticipar funcionalidades futuras no solicitadas.
* No realizar refactors generales como parte de una tarea puntual.

## Contexto e indexación

Las herramientas de indexación, mapas o grafos de código son ayudas para localizar contexto y no representan necesariamente todo el alcance de una funcionalidad.

* Utilizar el índice para comenzar la exploración, pero continuar investigando cuando la evidencia indique que existen consumidores, contratos, permisos, estados, esquemas, pruebas o dependencias adicionales.
* No asumir que los archivos encontrados por un índice son el conjunto completo de archivos necesarios.
* Ante incertidumbre, priorizar la corrección y comprensión del sistema sobre minimizar tokens.
* Antes de finalizar un cambio, verificar los consumidores y efectos secundarios relevantes.
* Atlas y otras herramientas de indexación no sustituyen la lectura del código necesario para comprender una modificación.
* Si el índice está desactualizado o no contiene información suficiente, utilizar las herramientas normales de búsqueda y lectura.
* No reducir la investigación necesaria únicamente para ahorrar tokens.

## Criterio de optimización

La reducción de tokens nunca debe lograrse reduciendo el contexto necesario para realizar correctamente una tarea.

Optimizar la exploración, no sacrificar la comprensión del sistema.

Es preferible realizar búsquedas o lecturas adicionales cuando sean necesarias para confirmar:

* dependencias;
* contratos;
* permisos;
* estados;
* esquemas;
* consumidores;
* efectos secundarios;
* pruebas relevantes.

## Resumen final

Indicar brevemente:

* resultado;
* archivos o capas cambiadas;
* verificaciones ejecutadas y su resultado;
* pasos pendientes;
* riesgos o decisiones relevantes, si existen.
