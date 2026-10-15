<?php

use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AplicacionController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\Asistencia\AttendanceNotificationController;
use App\Http\Controllers\Asistencia\AttendanceTrackingController;
use App\Http\Controllers\Asistencia\AttendanceWorkflowController;
use App\Http\Controllers\Asistencia\PersonalAttendanceController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\BitacoraController;
use App\Http\Controllers\CargoController;
use App\Http\Controllers\GestionProyectos\CapacitacionController;
use App\Http\Controllers\GestionProyectos\ConvocatoriaController;
use App\Http\Controllers\GestionProyectos\ConvocatoriaWorkflowController;
use App\Http\Controllers\GestionProyectos\EquipoController;
use App\Http\Controllers\GestionProyectos\FuenteFinanciamientoController;
use App\Http\Controllers\InicioController;
use App\Http\Controllers\Integrantes\HorarioController;
use App\Http\Controllers\Integrantes\IntegranteAccessController;
use App\Http\Controllers\Integrantes\IntegranteController;
use App\Http\Controllers\Integrantes\IntegranteLifecycleController;
use App\Http\Controllers\Integrantes\SolicitudCambioHorarioController;
use App\Http\Controllers\NotaPersonalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\Usuarios\UsuarioController;
use App\Http\Middleware\RecordBitacora;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/me/permissions-version', [
    AuthController::class,
    'permissionsVersion',
]);

Route::middleware(['auth:sanctum', RecordBitacora::class])->group(function () {

    Route::get('/bitacora/exportar', [BitacoraController::class, 'export']);
    Route::get('/bitacora/metricas', [BitacoraController::class, 'metrics']);
    Route::get('/bitacora', [BitacoraController::class, 'index']);

    Route::get('/inicio', InicioController::class);

    Route::get('/me', [
        AuthController::class,
        'me',
    ]);

    // Contraseña temporal (primer login)
    Route::post('/profile/password', [
        AuthController::class,
        'changeTemporaryPassword',
    ]);

    // Cambio de contraseña voluntario (usuario logueado)
    Route::put('/profile/password', [
        AuthController::class,
        'changePassword',
    ]);

    Route::post(
        '/profile/avatar',
        [ProfileController::class, 'storeAvatar']
    );

    Route::delete(
        '/profile/avatar',
        [ProfileController::class, 'destroyAvatar']
    );

    Route::patch('/profile', [ProfileController::class, 'update']);

    Route::get('/areas', [AreaController::class, 'index']);
    Route::post('/areas', [AreaController::class, 'store']);
    Route::get('/areas/{area}', [AreaController::class, 'show'])->whereNumber('area');
    Route::put('/areas/{area}', [AreaController::class, 'update'])->whereNumber('area');
    Route::patch('/areas/{area}/status', [AreaController::class, 'setStatus'])->whereNumber('area');

    Route::get('/cargos', [CargoController::class, 'index']);
    Route::post('/cargos', [CargoController::class, 'store']);
    Route::get('/cargos/{cargo}', [CargoController::class, 'show'])->whereNumber('cargo');
    Route::put('/cargos/{cargo}', [CargoController::class, 'update'])->whereNumber('cargo');
    Route::patch('/cargos/{cargo}/status', [CargoController::class, 'setStatus'])->whereNumber('cargo');

    Route::get('/roles/permissions/catalog', [RoleController::class, 'permissionCatalog']);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::get('/roles/{role}', [RoleController::class, 'show'])->whereNumber('role');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->whereNumber('role');
    Route::patch('/roles/{role}/status', [RoleController::class, 'setStatus'])->whereNumber('role');
    Route::get('/roles/{role}/permissions', [RoleController::class, 'permissions'])->whereNumber('role');
    Route::put('/roles/{role}/permissions', [RoleController::class, 'replacePermissions'])->whereNumber('role');
    Route::get('/roles/{role}/cargos', [RoleController::class, 'cargos'])->whereNumber('role');
    Route::put('/roles/{role}/cargos', [RoleController::class, 'replaceCargos'])->whereNumber('role');

    Route::get('/aplicaciones', [AplicacionController::class, 'index']);
    Route::post('/aplicaciones', [AplicacionController::class, 'store']);
    Route::get('/aplicaciones/{aplicacion}', [AplicacionController::class, 'show'])->whereNumber('aplicacion');
    Route::put('/aplicaciones/{aplicacion}', [AplicacionController::class, 'update'])->whereNumber('aplicacion');
    Route::patch('/aplicaciones/{aplicacion}/status', [AplicacionController::class, 'setStatus'])->whereNumber('aplicacion');

    Route::prefix('gestion-proyectos')->group(function () {
        Route::get('/capacitaciones', [CapacitacionController::class, 'index']);
        Route::patch('/capacitaciones/{integrante}/etapas/{etapa}', [CapacitacionController::class, 'completeStage'])
            ->whereNumber('integrante')->whereIn('etapa', ['1', '2', '3']);
        Route::get('/equipos/contexto', [EquipoController::class, 'context']);
        Route::get('/equipos/metricas', [EquipoController::class, 'metrics']);
        Route::get('/equipos/integrantes-disponibles', [EquipoController::class, 'candidates']);
        Route::get('/equipos', [EquipoController::class, 'index']);
        Route::post('/equipos', [EquipoController::class, 'store']);
        Route::get('/equipos/{equipo}/historial', [EquipoController::class, 'history'])->whereNumber('equipo');
        Route::patch('/equipos/{equipo}/desactivar', [EquipoController::class, 'deactivate'])->whereNumber('equipo');
        Route::patch('/equipos/{equipo}/reactivar', [EquipoController::class, 'reactivate'])->whereNumber('equipo');
        Route::put('/equipos/{equipo}', [EquipoController::class, 'update'])->whereNumber('equipo');
        Route::get('/fuentes-financiamiento', [FuenteFinanciamientoController::class, 'index']);
        Route::post('/fuentes-financiamiento', [FuenteFinanciamientoController::class, 'store']);
        Route::get('/convocatorias', [ConvocatoriaController::class, 'index']);
        Route::post('/convocatorias', [ConvocatoriaController::class, 'store']);
        Route::get('/convocatorias/{convocatoria}', [ConvocatoriaController::class, 'show'])
            ->whereNumber('convocatoria');
        Route::put('/convocatorias/{convocatoria}', [ConvocatoriaController::class, 'update'])
            ->whereNumber('convocatoria');
        Route::get('/convocatorias/{convocatoria}/primer-filtro', [ConvocatoriaController::class, 'primerFiltro'])
            ->whereNumber('convocatoria');
        Route::post('/convocatorias/{convocatoria}/primer-filtro', [ConvocatoriaController::class, 'savePrimerFiltro'])
            ->whereNumber('convocatoria');
        Route::get('/convocatorias/{convocatoria}/segundo-filtro', [ConvocatoriaController::class, 'segundoFiltro'])
            ->whereNumber('convocatoria');
        Route::post('/convocatorias/{convocatoria}/segundo-filtro', [ConvocatoriaController::class, 'saveSegundoFiltro'])
            ->whereNumber('convocatoria');
        Route::get('/convocatorias/{convocatoria}/aprobacion', [ConvocatoriaWorkflowController::class, 'approval'])
            ->whereNumber('convocatoria');
        Route::post('/convocatorias/{convocatoria}/aprobacion', [ConvocatoriaWorkflowController::class, 'decide'])
            ->whereNumber('convocatoria')->name('gp.convocatorias.aprobacion.store');
        Route::get('/convocatorias/{convocatoria}/postulacion', [ConvocatoriaWorkflowController::class, 'activePostulation'])
            ->whereNumber('convocatoria');
        Route::post('/convocatorias/{convocatoria}/postulacion', [ConvocatoriaWorkflowController::class, 'startPostulation'])
            ->whereNumber('convocatoria');
        Route::post('/convocatorias/{convocatoria}/archivar', [ConvocatoriaWorkflowController::class, 'archive'])
            ->whereNumber('convocatoria')->name('gp.convocatorias.archive');
        Route::post('/convocatorias/{convocatoria}/restaurar', [ConvocatoriaWorkflowController::class, 'restore'])
            ->whereNumber('convocatoria')->name('gp.convocatorias.restore');
        Route::get('/postulaciones/usuarios-disponibles', [ConvocatoriaWorkflowController::class, 'users']);
        Route::delete('/postulaciones/documentos', [ConvocatoriaWorkflowController::class, 'deleteDocument'])
            ->name('gp.postulaciones.documentos.delete');
        Route::get('/postulaciones/documentos/{documento}/archivo', [ConvocatoriaWorkflowController::class, 'downloadDocument'])
            ->whereNumber('documento');
        Route::get('/postulaciones/{postulacion}/detalle', [ConvocatoriaWorkflowController::class, 'postulationDetail'])
            ->whereNumber('postulacion');
        Route::post('/postulaciones/{postulacion}/items/{seccion}', [ConvocatoriaWorkflowController::class, 'saveItem'])
            ->whereNumber('postulacion')->whereIn('seccion', ['checklist', 'documentos', 'propuestas'])
            ->name('gp.postulaciones.items.store');
        Route::put('/postulaciones/{postulacion}/items/{seccion}/{item}', [ConvocatoriaWorkflowController::class, 'saveItem'])
            ->whereNumber('postulacion')->whereNumber('item')->whereIn('seccion', ['checklist', 'documentos', 'propuestas'])
            ->name('gp.postulaciones.items.update');
        Route::post('/postulaciones/{postulacion}/finalizar-preparacion', [ConvocatoriaWorkflowController::class, 'finishPreparation'])
            ->whereNumber('postulacion');
        Route::post('/postulaciones/{postulacion}/envio', [ConvocatoriaWorkflowController::class, 'registerShipment'])
            ->whereNumber('postulacion')->name('gp.postulaciones.envio.store');
        Route::post('/postulaciones/{postulacion}/documentos', [ConvocatoriaWorkflowController::class, 'uploadDocument'])
            ->whereNumber('postulacion')->name('gp.postulaciones.documentos.upload');
        Route::get('/postulaciones/{postulacion}/seguimiento', [ConvocatoriaWorkflowController::class, 'tracking'])
            ->whereNumber('postulacion');

        Route::get('/seguimientos/{seguimiento}', [ConvocatoriaWorkflowController::class, 'trackingDetail'])
            ->whereNumber('seguimiento');
        Route::post('/seguimientos/{seguimiento}/eventos', [ConvocatoriaWorkflowController::class, 'addEvent'])
            ->whereNumber('seguimiento')->name('gp.seguimientos.eventos.store');
        Route::post('/seguimientos/{seguimiento}/comunicaciones', [ConvocatoriaWorkflowController::class, 'saveCommunication'])
            ->whereNumber('seguimiento')->name('gp.seguimientos.comunicaciones.store');
        Route::put('/seguimientos/{seguimiento}/comunicaciones/{comunicacion}', [ConvocatoriaWorkflowController::class, 'saveCommunication'])
            ->whereNumber('seguimiento')->whereNumber('comunicacion')->name('gp.seguimientos.comunicaciones.update');
        Route::delete('/seguimientos/{seguimiento}/comunicaciones/{comunicacion}', [ConvocatoriaWorkflowController::class, 'deleteCommunication'])
            ->whereNumber('seguimiento')->whereNumber('comunicacion');
        Route::post('/seguimientos/{seguimiento}/solicitudes', [ConvocatoriaWorkflowController::class, 'saveRequest'])
            ->whereNumber('seguimiento')->name('gp.seguimientos.solicitudes.store');
        Route::put('/seguimientos/{seguimiento}/solicitudes/{solicitud}', [ConvocatoriaWorkflowController::class, 'saveRequest'])
            ->whereNumber('seguimiento')->whereNumber('solicitud')->name('gp.seguimientos.solicitudes.update');
        Route::post('/seguimientos/solicitudes/{solicitud}/respuesta', [ConvocatoriaWorkflowController::class, 'respondRequest'])
            ->whereNumber('solicitud')->name('gp.seguimientos.solicitudes.respond');
        Route::post('/seguimientos/{seguimiento}/resultado', [ConvocatoriaWorkflowController::class, 'registerResult'])
            ->whereNumber('seguimiento')->name('gp.seguimientos.resultado.store');
    });

    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::post('/usuarios/{integrante}/access', [UsuarioController::class, 'configureAccess'])
        ->whereNumber('integrante');
    Route::post('/usuarios/{integrante}/resend-credentials', [UsuarioController::class, 'resendCredentials'])
        ->whereNumber('integrante');
    Route::patch('/usuarios/{integrante}/email', [UsuarioController::class, 'updateEmail'])
        ->whereNumber('integrante');

    Route::prefix('agenda')->group(function () {
        Route::get('/notas', [NotaPersonalController::class, 'index']);
        Route::post('/notas', [NotaPersonalController::class, 'store']);
        Route::put('/notas/{notaPersonal}', [NotaPersonalController::class, 'update'])->whereNumber('notaPersonal');
        Route::delete('/notas/{notaPersonal}', [NotaPersonalController::class, 'destroy'])->whereNumber('notaPersonal');
        Route::get('/people', [AgendaController::class, 'people']);
        Route::get('/me', [AgendaController::class, 'currentPerson']);
        Route::get('/meetings', [AgendaController::class, 'meetings']);
        Route::get('/history', [AgendaController::class, 'history']);
        Route::get('/metrics', [AgendaController::class, 'metrics']);
        Route::post('/meetings', [AgendaController::class, 'store']);
        Route::patch('/meetings/{meeting}/response', [AgendaController::class, 'respond'])->whereNumber('meeting');
        Route::patch('/meetings/{meeting}/cancel', [AgendaController::class, 'cancel'])->whereNumber('meeting');
    });

    Route::prefix('tareas')->group(function () {
        Route::get('/integrantes', [TareaController::class, 'people']);
        Route::get('/', [TareaController::class, 'index']);
        Route::post('/', [TareaController::class, 'store']);
        Route::put('/{tarea}', [TareaController::class, 'update'])->whereNumber('tarea');
        Route::patch('/{tarea}/estado', [TareaController::class, 'updateStatus'])->whereNumber('tarea');
        Route::post('/{tarea}/notas', [TareaController::class, 'addNote'])->whereNumber('tarea');
    });

    Route::prefix('mi-asistencia')->group(function () {
        Route::get('/', [PersonalAttendanceController::class, 'today']);
        Route::get('/historial', [PersonalAttendanceController::class, 'history']);
        Route::post('/iniciar', [PersonalAttendanceController::class, 'start']);
        Route::patch('/{asistencia}/terminar', [PersonalAttendanceController::class, 'finish'])
            ->whereNumber('asistencia');
        Route::post('/{asistencia}/justificaciones', [PersonalAttendanceController::class, 'justify'])
            ->whereNumber('asistencia');
        Route::get('/solicitudes', [AttendanceWorkflowController::class, 'personal']);
        Route::post('/permisos', [AttendanceWorkflowController::class, 'createLeave']);
        Route::get('/permisos/estimar', [AttendanceWorkflowController::class, 'estimateLeave']);
        Route::get('/permisos/proponer-recuperacion', [AttendanceWorkflowController::class, 'suggestLeaveRecovery']);
        Route::get('/recuperaciones/proponer', [AttendanceWorkflowController::class, 'suggestIncidentRecovery']);
        Route::post('/amonestaciones/{amonestacion}/apelaciones', [AttendanceWorkflowController::class, 'createAppeal'])->whereNumber('amonestacion');
        Route::post('/recuperaciones/{recuperacion}/iniciar', [AttendanceWorkflowController::class, 'startRecovery'])->whereNumber('recuperacion');
        Route::patch('/recuperaciones/{recuperacion}/terminar', [AttendanceWorkflowController::class, 'finishRecovery'])->whereNumber('recuperacion');
    });

    Route::get('/notificaciones', [AttendanceNotificationController::class, 'index']);
    Route::patch('/notificaciones/leer-todas', [AttendanceNotificationController::class, 'readAll']);
    Route::patch('/notificaciones/{notification}/leer', [AttendanceNotificationController::class, 'read'])->whereNumber('notification');
    Route::delete('/notificaciones/{notification}', [AttendanceNotificationController::class, 'destroy'])->whereNumber('notification');

    Route::get('/asistencia/seguimiento', [AttendanceTrackingController::class, 'index']);
    Route::get('/asistencia/metricas', [AttendanceTrackingController::class, 'metrics']);
    Route::get('/asistencia/amonestaciones', [AttendanceTrackingController::class, 'warnings']);
    Route::get('/asistencia/{asistencia}/auditoria', [AttendanceTrackingController::class, 'audit'])
        ->whereNumber('asistencia');
    Route::patch('/asistencia/justificaciones/{justificacion}/resolver', [AttendanceTrackingController::class, 'resolveJustification'])
        ->whereNumber('justificacion');
    Route::get('/asistencia/flujos', [AttendanceWorkflowController::class, 'admin']);
    Route::get('/asistencia/calendario', [AttendanceWorkflowController::class, 'calendar']);
    Route::patch('/asistencia/configuracion', [AttendanceWorkflowController::class, 'settings']);
    Route::post('/asistencia/dias-no-laborables', [AttendanceWorkflowController::class, 'nonWorkingDay']);
    Route::patch('/asistencia/dias-no-laborables/{day}/tratamiento', [AttendanceWorkflowController::class, 'updateNonWorkingDayTreatment'])->whereNumber('day');
    Route::delete('/asistencia/dias-no-laborables/{day}', [AttendanceWorkflowController::class, 'removeNonWorkingDay'])->whereNumber('day');
    Route::patch('/asistencia/permisos/{permiso}/resolver', [AttendanceWorkflowController::class, 'resolveLeave'])->whereNumber('permiso');
    Route::patch('/asistencia/apelaciones/{apelacion}/resolver', [AttendanceWorkflowController::class, 'resolveAppeal'])->whereNumber('apelacion');
    Route::patch('/asistencia/{asistencia}/cierre-administrativo', [AttendanceWorkflowController::class, 'close'])->whereNumber('asistencia');

    Route::prefix('integrantes')->group(function () {
        Route::get('/me/schedule-history', [HorarioController::class, 'mineHistory']);
        Route::get('/me/attendance-hours', [IntegranteController::class, 'mineAttendanceHours']);
        Route::get('/me', [IntegranteController::class, 'mine']);
        Route::get('/catalogs', [IntegranteController::class, 'catalogs']);
        Route::get('/exportar', [IntegranteController::class, 'export']);
        Route::get('/', [IntegranteController::class, 'index']);
        Route::post('/', [IntegranteController::class, 'store']);
        Route::get('/{integrante}/history', [IntegranteController::class, 'history'])->whereNumber('integrante');
        Route::get('/{integrante}/attendance-hours', [IntegranteController::class, 'attendanceHours'])->whereNumber('integrante');
        Route::get('/{integrante}', [IntegranteController::class, 'show'])->whereNumber('integrante');
        Route::put('/{integrante}', [IntegranteController::class, 'update'])->whereNumber('integrante');
        Route::post('/{integrante}/deactivate', [IntegranteLifecycleController::class, 'deactivate'])->whereNumber('integrante');
        Route::post('/{integrante}/restore', [IntegranteLifecycleController::class, 'restore'])->whereNumber('integrante');
        Route::post('/{integrante}/rehire', [IntegranteLifecycleController::class, 'rehire'])->whereNumber('integrante');
        Route::post('/{integrante}/confirm-access-removal', [IntegranteLifecycleController::class, 'confirmAccessRemoval'])->whereNumber('integrante');
        Route::get('/{integrante}/accesses', [IntegranteAccessController::class, 'forIntegrante'])->whereNumber('integrante');
    });

    Route::get('/cumpleanos', [IntegranteController::class, 'birthdays']);

    Route::get('/integrante-histories/{historial}/schedules', [HorarioController::class, 'index'])->whereNumber('historial');
    Route::get('/integrante-histories/{historial}/access-count', [IntegranteAccessController::class, 'count'])->whereNumber('historial');
    Route::put('/integrante-histories/{historial}/schedules', [HorarioController::class, 'replace'])->whereNumber('historial');
    Route::delete('/integrante-histories/{historial}/schedules', [HorarioController::class, 'destroyAll'])->whereNumber('historial');
    Route::delete('/integrante-schedules/{horario}', [HorarioController::class, 'destroy'])->whereNumber('horario');
    Route::post('/integrante-schedules', [HorarioController::class, 'store']);
    Route::put('/integrante-schedules/{horario}', [HorarioController::class, 'update'])->whereNumber('horario');

    Route::get('/schedule-change-requests/mine', [SolicitudCambioHorarioController::class, 'mine']);
    Route::get('/schedule-change-requests', [SolicitudCambioHorarioController::class, 'index']);
    Route::post('/schedule-change-requests', [SolicitudCambioHorarioController::class, 'store']);
    Route::patch('/schedule-change-requests/{solicitud}/resolve', [SolicitudCambioHorarioController::class, 'resolve'])
        ->whereNumber('solicitud');

    Route::get('/integrante-access-assignments', [IntegranteAccessController::class, 'index']);
    Route::post('/integrante-access-assignments', [IntegranteAccessController::class, 'store']);
    Route::delete('/integrante-access-assignments/{assignment}', [IntegranteAccessController::class, 'destroy'])->whereNumber('assignment');

});
