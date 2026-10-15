# Backend

Complementa el `AGENTS.md` raíz dentro de `backend/`.

## Capas y dominio

* Mantener el flujo `Route → Controller → Form Request/Service → Model → API Resource`.
* Registrar endpoints institucionales en `routes/api.php` bajo `auth:sanctum`, salvo endpoints públicos explícitos.
* Mantener los controladores delgados: no trasladar lógica de negocio compleja al Controller.
* Normalizar y validar entradas con Form Requests; conservar los mensajes y atributos traducidos en `lang/es/validation.php`.
* Mantener la lógica de negocio y transacciones en Services cuando corresponda.
* Reutilizar `InstitutionalAuthorizationService` para autorización y alcance institucional.
* Resolver identidad, usuario y área desde la sesión y la base de datos; no confiar en identificadores de identidad o permisos enviados por el cliente.
* Usar API Resources para definir la representación de salida de la API.
* Cargar relaciones y conteos necesarios antes del Resource para evitar consultas N+1.
* Antes de crear un Service, Resource, Request o helper nuevo, buscar implementaciones reutilizables existentes.

## Rutas y API

* Mantener las rutas agrupadas y organizadas según el módulo correspondiente.
* Respetar los middleware existentes de autenticación y autorización.
* No eliminar ni modificar contratos existentes sin revisar sus consumidores frontend y pruebas.
* Si cambia un endpoint, revisar conjuntamente:

  * ruta;
  * Controller;
  * Form Request;
  * Service;
  * Model;
  * Resource;
  * frontend consumidor;
  * pruebas.
* Mantener respuestas y códigos HTTP consistentes con los patrones existentes del proyecto.

## Autorización y seguridad

* La autorización debe validarse siempre en el backend.
* No considerar suficiente ocultar botones, rutas o componentes en React.
* Respetar el alcance institucional `global`/`area`.
* Reutilizar `InstitutionalAuthorizationService` en lugar de duplicar reglas de permisos.
* No confiar en `user_id`, `area_id`, `integrante_id` u otros identificadores enviados por el navegador cuando puedan resolverse desde la sesión o contexto autorizado.
* No permitir que un usuario acceda, modifique o elimine recursos fuera de su alcance.
* Validar entradas, archivos, relaciones y estados permitidos.
* No exponer secretos, credenciales, cookies, tokens ni valores sensibles en respuestas, logs o mensajes de error.
* No desactivar middleware, autorización o validaciones para hacer que una prueba o endpoint funcione.

## Persistencia

* Desarrollo usa PostgreSQL y las pruebas usan SQLite `:memory:`; proteger SQL específico por driver o proporcionar una alternativa compatible.
* Las Feature tests existentes pueden crear esquemas SQLite mínimos; actualizar esos esquemas cuando cambien sus dependencias.
* Antes de modificar modelos o relaciones, revisar migraciones, FKs, índices, restricciones y consumidores existentes.
* Las migraciones nuevas deben incluir reversión segura, FKs, índices y restricciones pertinentes.
* No editar migraciones históricas que ya puedan estar aplicadas; crear una nueva migración.
* Usar transacciones para operaciones que modifiquen múltiples registros y mantener consistencia ante errores.
* Usar bloqueos o mecanismos de concurrencia cuando existan cupos, asignaciones, estados o conflictos que puedan ser modificados simultáneamente.
* No ejecutar `migrate:fresh`, `db:wipe`, resets o seeders destructivos sin solicitud explícita.

## Archivos y almacenamiento

* Para archivos utilizar el disco Flysystem configurado para el ambiente.
* Validar MIME, extensión y tamaño según las reglas del módulo.
* No confiar únicamente en la extensión proporcionada por el cliente.
* Si una operación de archivo y base de datos forma una única operación lógica, manejar correctamente los fallos parciales.
* Limpiar archivos creados cuando posteriormente falle la operación que debía registrarlos.
* No borrar archivos o rutas que no sean administrados por el sistema.
* Evitar almacenar rutas absolutas dependientes de la máquina local.

## Modelos y Eloquent

* Reutilizar relaciones Eloquent existentes antes de crear consultas paralelas.
* Definir relaciones, casts y scopes en el Model cuando formen parte del comportamiento persistente del dominio.
* Evitar consultas dentro de loops cuando pueda resolverse mediante relaciones, `with`, `withCount`, `whereHas` u otras consultas apropiadas.
* Revisar índices y volumen de datos cuando una consulta pueda ejecutarse sobre tablas grandes.
* No utilizar `select *` innecesariamente cuando el endpoint requiere un conjunto reducido de columnas.
* Mantener consistencia entre nombres de relaciones, columnas, casts y Resources.

## Migraciones y esquema

* Antes de crear una migración, revisar el esquema actual y las migraciones existentes.
* No asumir que una migración histórica representa necesariamente el estado actual de la base de datos.
* Verificar dependencias entre tablas antes de modificar o eliminar columnas.
* Considerar PostgreSQL y SQLite cuando una migración o consulta pueda ejecutarse también durante las pruebas.
* Verificar índices, FKs, `nullable`, valores por defecto, unicidad y restricciones de integridad.
* Para cambios de contrato de datos, actualizar también modelos, validaciones, Resources y pruebas afectadas.

## Comprobaciones

Después de modificar backend:

1. Revisar el diff y `git status`.
2. Ejecutar primero las pruebas relacionadas con el cambio:
   `php artisan test <ruta>`
3. Ampliar a:
   `php artisan test`
   cuando el riesgo o alcance del cambio lo justifique.
4. Ejecutar Pint en los archivos PHP modificados:
   `vendor/bin/pint --test <rutas>`
5. Validar las rutas afectadas:
   `php artisan route:list --path=api/...`
6. Si cambia el esquema, revisar:
   `php artisan migrate:status`
7. Para migraciones potencialmente riesgosas, revisar primero:
   `php artisan migrate --pretend`
8. Si cambia un endpoint, verificar también sus consumidores y pruebas.
9. Si una comprobación no puede ejecutarse, informar explícitamente el motivo.

No afirmar que una prueba, ruta, migración o formato pasó si no fue ejecutado.

## Exploración eficiente

* Utilizar primero búsquedas dirigidas para localizar rutas, Controllers, Requests, Services, Models, Resources y pruebas relacionadas.
* No leer archivos completos de forma preventiva.
* Seguir el flujo real de la petición desde la ruta hasta la respuesta.
* Buscar consumidores antes de modificar contratos.
* Utilizar Atlas como ayuda para localizar símbolos, referencias, callers y dependencias cuando resulte útil.
* Atlas es un punto de partida y no sustituye la investigación del código.
* Si el índice no contiene suficiente información o puede estar desactualizado, continuar con `rg`, lectura de archivos y otras herramientas disponibles.
* Ampliar la exploración cuando existan indicios de relaciones, permisos, estados, transacciones, eventos, jobs, observers o efectos secundarios no considerados inicialmente.

## Simplicidad

* Preferir la solución mínima compatible con la arquitectura existente.
* Reutilizar Services, Requests, Resources, scopes y relaciones existentes antes de crear nuevas abstracciones.
* No introducir patrones arquitectónicos nuevos para resolver una tarea puntual.
* No mover lógica entre capas salvo que sea necesario para corregir el problema o mantener la arquitectura existente.
* No realizar refactors generales no solicitados.

## Criterio de corrección

La reducción de tokens no debe limitar la investigación necesaria.

Ante conflicto entre minimizar contexto y comprender correctamente el flujo backend, priorizar la comprensión y corrección.

Antes de finalizar un cambio, comprobar los consumidores, permisos, estados, persistencia, efectos secundarios y pruebas relevantes.

## Resumen final

Al finalizar un cambio de backend indicar brevemente:

* qué se modificó;
* archivos o capas afectadas;
* pruebas ejecutadas y resultado;
* Pint ejecutado y resultado;
* rutas o migraciones verificadas, si corresponde;
* validaciones pendientes;
* riesgos o decisiones relevantes.
