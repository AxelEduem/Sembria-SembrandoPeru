# Frontend

Complementa el `AGENTS.md` raíz dentro de `frontend/`.

## Convenciones

* Usar ESM en JavaScript/JSX y el alias `@/`; no introducir TypeScript de forma aislada.
* `pages` compone vistas, `components` presenta UI, `hooks` coordina estado/caché y `services` encapsula acceso a datos.
* Reutilizar `components/ui`, filtros, helpers de permisos y utilidades de exportación existentes.
* Centralizar rutas protegidas y permisos en `src/routes` y `src/utils/permissions.js`; no autorizar únicamente por nombre de rol.
* Consumir sesión y perfil Laravel mediante `AuthContext`/`authService`; no crear un estado de autenticación paralelo.
* Mantener las convenciones de nombres, estructura y organización ya utilizadas por el módulo que se modifica.

## Arquitectura de datos

* Para Laravel usar `src/services/api.js`; conservar cookies, manejo de errores normalizado y CSRF en escrituras.
* Antes de editar un servicio, comprobar si actualmente utiliza `apiRequest` o `src/services/supabase.js`.
* Confirmar siempre qué proveedor utiliza realmente el módulo antes de modificarlo.
* No asumir que un módulo utiliza Laravel solo porque otros módulos ya fueron migrados.
* No reintroducir Supabase en módulos migrados.
* Una migración de Supabase a Laravel debe abarcar, cuando corresponda:

  * consultas;
  * mutaciones;
  * autenticación;
  * archivos;
  * permisos;
  * validaciones;
  * estados;
  * consumidores;
  * manejo de errores.
* No crear llamadas directas a `fetch`, Supabase o APIs externas desde componentes cuando ya existe una capa de servicio para ese flujo.
* Mantener la separación `page/component → hook → service → API`.

## Estado y hooks

* Reutilizar hooks existentes antes de crear nuevos.
* Mantener en los hooks la coordinación de estado, carga, caché y efectos relacionados con los datos.
* Evitar duplicar llamadas API o lógica de caché entre páginas y componentes.
* Revisar dependencias de `useEffect`, `useMemo` y `useCallback` cuando se modifique lógica relacionada.
* No introducir estado global para información que pueda permanecer local al módulo.
* No duplicar en frontend lógica de negocio que corresponde al backend.

## Rutas y autorización

* Mantener las rutas protegidas y su estructura existente en `src/routes`.
* Utilizar los helpers existentes de `src/utils/permissions.js`.
* No determinar autorización únicamente mediante nombres de roles.
* La UI puede ocultar o deshabilitar acciones para mejorar la UX, pero la autorización real debe permanecer en el backend.
* Cuando se modifiquen permisos, revisar conjuntamente:

  * rutas;
  * navegación;
  * componentes;
  * helpers de permisos;
  * llamadas API;
  * backend;
  * pruebas relevantes.

## UI y experiencia

* Conservar los patrones visuales existentes del módulo.
* Reutilizar componentes de `components/ui` antes de crear componentes equivalentes.
* Mantener Tailwind CSS y los patrones Radix existentes cuando correspondan.
* No introducir una librería de UI nueva para resolver una necesidad puntual si ya existe una solución en el proyecto.
* Mantener accesibilidad en controles, formularios, diálogos, tablas y navegación.
* Mantener comportamiento responsive.
* Conservar estados de:

  * carga;
  * error;
  * vacío;
  * éxito;
  * deshabilitado.
* No eliminar estados de carga o error existentes únicamente para simplificar la implementación.
* Mantener consistencia visual con las páginas y componentes relacionados.

## Formularios y validación

* Reutilizar componentes, helpers y patrones de formularios existentes.
* Validar en cliente para mejorar la experiencia, pero no asumir que la validación frontend sustituye la validación del servidor.
* Mantener los nombres y formatos de campos compatibles con el contrato de la API.
* Cuando cambie un contrato de backend, revisar formularios, servicios, hooks, componentes y pruebas que consuman esos campos.
* Mostrar errores de validación del backend mediante los mecanismos existentes del proyecto.

## Exportaciones y archivos

* Reutilizar las utilidades de exportación existentes.
* Antes de implementar una nueva exportación, buscar funcionalidades equivalentes en el proyecto.
* Para subida de archivos, respetar el servicio y contrato existentes.
* Validar en frontend tipo y tamaño para mejorar la UX, sin sustituir la validación del backend.
* Mantener correctamente estados de progreso, éxito y error durante operaciones de archivos.

## Exploración eficiente

* Utilizar búsquedas dirigidas con `rg` y `rg --files`.
* Localizar primero la página, componente, hook y service relacionados con la tarea.
* Identificar consumidores antes de modificar contratos o props.
* No leer archivos completos de forma preventiva.
* Ampliar la exploración cuando existan indicios de dependencias, permisos, rutas, estados o efectos secundarios.
* No explorar módulos no relacionados con la tarea.
* Buscar componentes y utilidades reutilizables antes de crear nuevas implementaciones.

## Atlas e indexación

* Utilizar Atlas como ayuda para localizar símbolos, referencias, callers, dependencias y relaciones cuando resulte útil.
* El índice de Atlas es un punto de partida para la exploración y no representa necesariamente todo el alcance de una funcionalidad.
* No asumir que los archivos encontrados por Atlas son el conjunto completo de archivos necesarios.
* Si Atlas no proporciona suficiente información o puede estar desactualizado, continuar con `rg`, lectura de archivos y otras herramientas disponibles.
* Verificar los consumidores y efectos secundarios relevantes antes de finalizar cambios.
* La reducción de tokens no debe limitar la investigación necesaria para comprender correctamente un flujo frontend.

## Comprobaciones

Después de modificar frontend:

1. Revisar `git diff` y `git status`.
2. Ejecutar ESLint sobre los archivos modificados:
   `npx eslint <rutas>`
3. Si el cambio es amplio o afecta configuración compartida, ejecutar:
   `npm run lint`
4. Si cambia código ejecutable, configuración, rutas, dependencias o integración con backend, ejecutar:
   `npm run build`
5. Si cambia un contrato API, verificar también los consumidores afectados.
6. Si se modifica una migración de proveedor, usar `rg` para detectar referencias residuales al proveedor anterior.
7. Informar cualquier comprobación que no se haya podido ejecutar y el motivo.

No afirmar que una comprobación pasó si no fue ejecutada.

## Simplicidad

* Preferir la solución mínima compatible con la arquitectura existente.
* Reutilizar componentes, hooks, servicios y utilidades existentes.
* No crear abstracciones nuevas sin necesidad.
* No introducir TypeScript, librerías, patrones de estado o frameworks adicionales para resolver una tarea puntual.
* No realizar refactors generales no solicitados.
* No modificar módulos no relacionados.

## Contratos frontend-backend

Cuando un cambio afecte una comunicación con el backend, revisar como mínimo:

* endpoint;
* método HTTP;
* parámetros;
* payload;
* autenticación;
* CSRF;
* respuesta;
* códigos HTTP;
* errores de validación;
* permisos;
* consumidores frontend.

Si cambia un contrato, actualizar productor, consumidores y pruebas relevantes de forma coordinada.

## Resumen final

Al finalizar un cambio indicar brevemente:

* qué se modificó;
* archivos o capas afectadas;
* verificaciones ejecutadas y resultado;
* build ejecutado y resultado, cuando corresponda;
* referencias residuales o pasos pendientes;
* riesgos o decisiones relevantes.
