# Documentación de Endpoints — API Sembrando Perú

**Versión:** 1.0
**Última actualización:** 23/09/2026
**Base URL:** `http://localhost:8000/api`
**Autenticación:** Laravel Sanctum (cookie de sesión HTTP)
**Content-Type:** `application/json`

---

## Índice

1. [Autenticación](#1-autenticación)
2. [Perfil](#2-perfil)
3. [Áreas](#3-áreas)
4. [Cargos](#4-cargos)
5. [Aplicaciones](#5-aplicaciones)
6. [Agenda](#6-agenda)
7. [Integrantes](#7-integrantes)
8. [Ciclo de vida de Integrantes](#8-ciclo-de-vida-de-integrantes)
9. [Horarios](#9-horarios)
10. [Accesos a Aplicaciones](#10-accesos-a-aplicaciones)
11. [Pendientes de implementar](#11-pendientes-de-implementar)

---

## 1. Autenticación

**Controller:** `Auth\AuthController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| POST | `/api/login` | `guest` | No | Autentica al usuario con email/password, regenera sesión y devuelve el perfil institucional completo. Rechaza contraseñas temporales expiradas (código `TEMPORARY_PASSWORD_EXPIRED`). |
| POST | `/api/logout` | `auth` | Sí | Cierra la sesión web actual, invalida la sesión y regenera el token CSRF. |
| GET | `/api/me` | `auth:sanctum` | Sí | Devuelve el usuario autenticado + perfil institucional completo (persona, cuenta, integrante/trabajador, historial, rol, cargo, permisos). |

---

## 2. Perfil

**Controller:** `ProfileController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| POST | `/api/profile/avatar` | `auth:sanctum` | Sí | Sube y reemplaza la foto de perfil del usuario autenticado. Devuelve el nuevo `avatar_path` y `avatar_url`. |
| DELETE | `/api/profile/avatar` | `auth:sanctum` | Sí | Elimina la foto de perfil del usuario autenticado y limpia el `avatar_path` asociado. |

---

## 3. Áreas

**Controller:** `AreaController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| GET | `/api/areas` | `auth:sanctum` | Sí | Lista las áreas visibles según los permisos del usuario autenticado. |
| POST | `/api/areas` | `auth:sanctum` | Sí | Crea una nueva área institucional. |
| GET | `/api/areas/{area}` | `auth:sanctum` | Sí | Muestra el detalle de un área específica (validando permisos). |
| PUT | `/api/areas/{area}` | `auth:sanctum` | Sí | Actualiza los datos de un área existente. |
| PATCH | `/api/areas/{area}/status` | `auth:sanctum` | Sí | Activa o desactiva un área (`activo: true/false`). |

---

## 4. Cargos

**Controller:** `CargoController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| GET | `/api/cargos` | `auth:sanctum` | Sí | Lista los cargos visibles según los permisos del usuario autenticado. |
| POST | `/api/cargos` | `auth:sanctum` | Sí | Crea un nuevo cargo asociado a un área y un rol. |
| GET | `/api/cargos/{cargo}` | `auth:sanctum` | Sí | Muestra el detalle de un cargo específico. |
| PUT | `/api/cargos/{cargo}` | `auth:sanctum` | Sí | Actualiza los datos de un cargo existente. |
| PATCH | `/api/cargos/{cargo}/status` | `auth:sanctum` | Sí | Activa o desactiva un cargo. |

---

## 5. Aplicaciones

**Controller:** `AplicacionController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| GET | `/api/aplicaciones` | `auth:sanctum` | Sí | Lista las aplicaciones visibles según los permisos del usuario. |
| POST | `/api/aplicaciones` | `auth:sanctum` | Sí | Registra una nueva aplicación institucional (con logo y licencias). |
| GET | `/api/aplicaciones/{aplicacion}` | `auth:sanctum` | Sí | Muestra el detalle de una aplicación específica. |
| PUT | `/api/aplicaciones/{aplicacion}` | `auth:sanctum` | Sí | Actualiza los datos de una aplicación existente. |
| PATCH | `/api/aplicaciones/{aplicacion}/status` | `auth:sanctum` | Sí | Activa o desactiva una aplicación. |

---

## 6. Agenda

**Controller:** `AgendaController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| GET | `/api/agenda/people` | `auth:sanctum` | Sí | Lista las personas disponibles para invitar a reuniones. |
| GET | `/api/agenda/me` | `auth:sanctum` | Sí | Devuelve la persona vinculada al usuario autenticado (para agenda). |
| GET | `/api/agenda/meetings` | `auth:sanctum` | Sí | Lista las reuniones donde el usuario participa (organizador o invitado). |
| POST | `/api/agenda/meetings` | `auth:sanctum` | Sí | Crea una nueva reunión e invita a los participantes. |
| PATCH | `/api/agenda/meetings/{meeting}/response` | `auth:sanctum` | Sí | Registra la respuesta del usuario a una invitación (aceptar/rechazar). |
| PATCH | `/api/agenda/meetings/{meeting}/cancel` | `auth:sanctum` | Sí | Cancela una reunión (solo organizador). |
| GET | `/api/agenda/notas` | `auth:sanctum` | Sí | Lista únicamente las notas personales de la cuenta autenticada. |
| POST | `/api/agenda/notas` | `auth:sanctum` | Sí | Crea una nota privada para la cuenta autenticada. |
| PUT | `/api/agenda/notas/{notaPersonal}` | `auth:sanctum` | Sí | Actualiza una nota propia. |
| DELETE | `/api/agenda/notas/{notaPersonal}` | `auth:sanctum` | Sí | Elimina una nota propia. |

---

## 7. Integrantes

**Controller:** `Integrantes\IntegranteController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| GET | `/api/integrantes/me` | `auth:sanctum` | Sí | Devuelve el registro de integrante vinculado al usuario autenticado. |
| GET | `/api/integrantes/catalogs` | `auth:sanctum` | Sí | Devuelve catálogos auxiliares (tipos, modalidades, estados, etc.). |
| GET | `/api/integrantes` | `auth:sanctum` | Sí | Lista los integrantes visibles según permisos. Acepta filtros `inactive` y `tipo_integrante`. |
| POST | `/api/integrantes` | `auth:sanctum` | Sí | Crea un integrante con persona + cuenta + historial + credenciales (transaccional). |
| GET | `/api/integrantes/{integrante}` | `auth:sanctum` | Sí | Muestra el detalle completo del integrante (con historial y accesos). |
| GET | `/api/integrantes/{integrante}/history` | `auth:sanctum` | Sí | Devuelve el historial completo del integrante. |
| PUT | `/api/integrantes/{integrante}` | `auth:sanctum` | Sí | Actualiza los datos del integrante y su persona asociada. |

---

## 8. Ciclo de vida de Integrantes

**Controller:** `Integrantes\IntegranteLifecycleController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| POST | `/api/integrantes/{integrante}/deactivate` | `auth:sanctum` | Sí | Desactiva al integrante registrando el motivo. Cierra su historial vigente. |
| POST | `/api/integrantes/{integrante}/restore` | `auth:sanctum` | Sí | Reactiva a un integrante previamente desactivado. |
| POST | `/api/integrantes/{integrante}/rehire` | `auth:sanctum` | Sí | Recontrata al integrante creando un nuevo historial con cargo y período nuevos. |
| POST | `/api/integrantes/{integrante}/confirm-access-removal` | `auth:sanctum` | Sí | Confirma el retiro de accesos pendientes del integrante. |

---

## 9. Horarios

**Controller:** `Integrantes\HorarioController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| GET | `/api/integrante-histories/{historial}/schedules` | `auth:sanctum` | Sí | Lista los bloques de horario asociados a un historial. |
| PUT | `/api/integrante-histories/{historial}/schedules` | `auth:sanctum` | Sí | Reemplaza por completo los bloques del historial (borra y recrea). |
| DELETE | `/api/integrante-histories/{historial}/schedules` | `auth:sanctum` | Sí | Elimina todos los bloques del historial. |
| POST | `/api/integrante-schedules` | `auth:sanctum` | Sí | Crea un bloque de horario individual (recibe `historial_id`). |
| PUT | `/api/integrante-schedules/{horario}` | `auth:sanctum` | Sí | Actualiza un bloque de horario específico. |
| DELETE | `/api/integrante-schedules/{horario}` | `auth:sanctum` | Sí | Elimina un bloque de horario específico. |

---

## 10. Accesos a Aplicaciones

**Controller:** `Integrantes\IntegranteAccessController`

| Método | Endpoint | Middleware | Auth | Descripción |
|--------|----------|------------|------|-------------|
| GET | `/api/integrantes/{integrante}/accesses` | `auth:sanctum` | Sí | Lista los accesos a aplicaciones del integrante. |
| GET | `/api/integrante-histories/{historial}/access-count` | `auth:sanctum` | Sí | Devuelve el conteo de accesos activos para un historial. |
| GET | `/api/integrante-access-assignments` | `auth:sanctum` | Sí | Lista todas las asignaciones de acceso (filtrable por `inactive`). |
| POST | `/api/integrante-access-assignments` | `auth:sanctum` | Sí | Asigna una aplicación a un historial (crea el acceso). |
| DELETE | `/api/integrante-access-assignments/{assignment}` | `auth:sanctum` | Sí | Revoca un acceso específico a una aplicación. |

---

## 11. Pendientes de implementar

Endpoints planificados en el Kanban pero aún no implementados:

| Endpoint | Fase | Tarea | Prioridad |
|----------|------|-------|-----------|
| `GET /api/roles` | F3 | F3-03 | 🟠 Alta |
| `GET /api/permisos` | F3 | F3-04 | 🟠 Alta |
| `GET /api/cumpleanos` | F3 | F3-05 | 🟡 Media |
| `POST /api/password/change` | F2 | F2-06 | 🟠 Alta |
| `POST /api/password/forgot` | F2 | F2-07 | 🟡 Media |
| `POST /api/files/upload` | F7 | F7-02 | 🟡 Media |
| `GET /api/files/{path}` | F7 | F7-03 | 🟡 Media |
| `GET /api/mi-horario` | F5 | F5-01 | 🟠 Alta |
| `GET /api/mi-asistencia` | F5 | F5-02 | 🟠 Alta |
| `POST /api/asistencia/iniciar` | F5 | F5-03 | 🟠 Alta |
| `POST /api/asistencia/terminar` | F5 | F5-04 | 🟠 Alta |
| `POST /api/asistencia/terminar-anticipada` | F5 | F5-05 | 🟡 Media |
| `POST /api/asistencia/justificar` | F5 | F5-06 | 🟡 Media |
| `GET /api/mi-historial` | F5 | F5-07 | 🟡 Media |
| `GET /api/asistencia/seguimiento` | F5 | F5-08 | 🟡 Media |
| `GET /api/asistencia/administracion` | F5 | F5-09 | 🟡 Media |
| `POST /api/asistencia/procesar-faltas` | F5 | F5-10 | 🟡 Media |
| `POST /api/solicitudes-cambio-horario` | F5 | F5-11 | 🟡 Media |
| `POST /api/solicitudes/{id}/aprobar` | F5 | F5-12 | 🟡 Media |
| `POST /api/solicitudes/{id}/rechazar` | F5 | F5-13 | 🟡 Media |

---

## Convenciones

### Respuestas exitosas

```json
{
  "success": true,
  "message": "Descripción de la operación",
  "data": { }
}
```

### Respuestas de error

```json
{
  "success": false,
  "message": "Descripción del error",
  "code": "ERROR_CODE_OPCIONAL"
}
```

### Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | Operación exitosa |
| 201 | Recurso creado |
| 401 | No autenticado |
| 403 | Sin permisos (o cuenta no configurada) |
| 404 | Recurso no encontrado |
| 422 | Error de validación |
| 429 | Demasiadas peticiones |

---

## Autenticación

Todas las rutas (excepto `POST /api/login`) requieren una sesión válida de **Laravel Sanctum**.

**Flujo:**
1. El frontend solicita `GET /sanctum/csrf-cookie` para obtener la cookie CSRF.
2. Envía `POST /api/login` con credenciales.
3. Sanctum crea una cookie de sesión segura (HttpOnly).
4. Las peticiones posteriores incluyen automáticamente la cookie.
5. El frontend verifica la sesión con `GET /api/me` al montar.

---

## Notas de mantenimiento

- **Última sincronización con el código:** commit `99794d1`
- **Total de endpoints operativos:** 49
- **Total de endpoints pendientes:** 20
- **Cobertura estimada:** 71% de los endpoints planificados
