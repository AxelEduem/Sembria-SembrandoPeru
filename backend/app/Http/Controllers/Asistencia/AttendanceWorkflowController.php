<?php

namespace App\Http\Controllers\Asistencia;

use App\Http\Controllers\Controller;
use App\Http\Requests\Asistencia\AttendanceRangeRequest;
use App\Http\Requests\Asistencia\CloseAttendanceRequest;
use App\Http\Requests\Asistencia\CreateAppealRequest;
use App\Http\Requests\Asistencia\CreateLeaveRequest;
use App\Http\Requests\Asistencia\FinishRecoveryRequest;
use App\Http\Requests\Asistencia\LeaveEstimateRequest;
use App\Http\Requests\Asistencia\ResolveWorkflowRequest;
use App\Http\Requests\Asistencia\SaveNonWorkingDayRequest;
use App\Http\Requests\Asistencia\StartRecoveryRequest;
use App\Http\Requests\Asistencia\SuggestIncidentRecoveryRequest;
use App\Http\Requests\Asistencia\SuggestLeaveRecoveryRequest;
use App\Http\Requests\Asistencia\UpdateAttendanceSettingsRequest;
use App\Http\Requests\Asistencia\UpdateNonWorkingDayTreatmentRequest;
use App\Http\Resources\Asistencia\AsistenciaResource;
use App\Models\Asistencia;
use App\Models\AsistenciaAmonestacion;
use App\Models\AsistenciaApelacion;
use App\Models\AsistenciaPermiso;
use App\Models\AsistenciaRecuperacion;
use App\Services\Asistencia\AttendanceEvidenceUrlService;
use App\Services\Asistencia\AttendanceWorkflowService;
use App\Services\Asistencia\PersonalAttendanceService;
use App\Services\Profile\AvatarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AttendanceWorkflowController extends Controller
{
    public function __construct(
        private readonly AttendanceWorkflowService $service,
        private readonly PersonalAttendanceService $personalAttendance,
        private readonly AttendanceEvidenceUrlService $evidenceUrls,
        private readonly AvatarService $avatars,
    ) {}

    public function personal(Request $request): JsonResponse
    {
        $data = $this->service->personalData($request->user());
        $data['permisos']->each(fn ($item) => $item->adjunto_url = $this->fileUrl($item->adjunto_path));
        $data['justificaciones']->each(fn ($item) => $item->adjunto_url = $this->fileUrl($item->adjunto_path));

        return response()->json(['data' => $data]);
    }

    public function createLeave(CreateLeaveRequest $request): JsonResponse
    {
        return response()->json(['message' => 'Solicitud de permiso enviada.', 'data' => $this->service->createLeave($request->user(), $request->validated(), $request->file('adjunto'))], 201);
    }

    public function estimateLeave(LeaveEstimateRequest $request): JsonResponse
    {
        return response()->json(['data' => ['minutos' => $this->service->estimateLeave(
            $request->user(), $request->validated('fechas')
        )]]);
    }

    public function suggestLeaveRecovery(SuggestLeaveRecoveryRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->service->suggestLeaveRecovery(
            $request->user(),
            $request->validated('fechas'),
            $request->integer('dias'),
        )]);
    }

    public function suggestIncidentRecovery(SuggestIncidentRecoveryRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->service->suggestIncidentRecovery(
            $request->user(),
            $request->integer('minutos'),
            $request->validated('desde'),
            $request->integer('dias'),
        )]);
    }

    public function createAppeal(CreateAppealRequest $request, AsistenciaAmonestacion $amonestacion): JsonResponse
    {
        return response()->json(['message' => 'Apelación enviada.', 'data' => $this->service->createAppeal($request->user(), $amonestacion, $request->validated(), $request->file('adjunto'))], 201);
    }

    public function startRecovery(StartRecoveryRequest $request, AsistenciaRecuperacion $recuperacion): AsistenciaResource
    {
        return new AsistenciaResource($this->personalAttendance->startRecovery(
            $request->user(),
            $recuperacion,
            $request->validated('motivo'),
            $request->validated('ocurrido_en'),
            $request->validated('client_event_id'),
            $request->validated('recuperaciones', []),
        ));
    }

    public function finishRecovery(FinishRecoveryRequest $request, AsistenciaRecuperacion $recuperacion): AsistenciaResource
    {
        return new AsistenciaResource($this->personalAttendance->finishRecovery(
            $request->user(),
            $recuperacion,
            $request->validated('descripcion'),
        ));
    }

    public function admin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seccion' => ['required', Rule::in(['configuracion', 'solicitudes', 'historial'])],
        ]);
        $data = $this->service->adminData($request->user(), $validated['seccion']);
        $data['permisos']->each(fn ($item) => $item->adjunto_url = $this->fileUrl($item->adjunto_path));
        $data['apelaciones']->each(fn ($item) => $item->adjunto_url = $this->fileUrl($item->adjunto_path));
        $data['justificaciones']->each(fn ($item) => $item->adjunto_url = $this->fileUrl($item->adjunto_path));
        foreach (['permisos', 'apelaciones', 'justificaciones'] as $type) {
            $data[$type]->each(fn ($item) => $item->avatar_url = $this->avatars->url($item->avatar_path ?? null));
        }

        return response()->json(['data' => $data]);
    }

    public function settings(UpdateAttendanceSettingsRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->service->updateSettings($request->user(), $request->validated())]);
    }

    public function nonWorkingDay(SaveNonWorkingDayRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->service->addNonWorkingDay($request->user(), $request->validated('fecha'), $request->validated('nombre'))], 201);
    }

    public function calendar(AttendanceRangeRequest $request): JsonResponse
    {
        $from = CarbonImmutable::createFromFormat('!Y-m-d', $request->validated('desde'), 'America/Lima');
        $to = CarbonImmutable::createFromFormat('!Y-m-d', $request->validated('hasta'), 'America/Lima');

        return response()->json(['data' => $this->service->calendar($from, $to)]);
    }

    public function updateNonWorkingDayTreatment(UpdateNonWorkingDayTreatmentRequest $request, int $day): JsonResponse
    {
        return response()->json(['data' => $this->service->updateNonWorkingDayTreatment(
            $request->user(),
            $day,
            $request->boolean('requiere_asistencia'),
            $request->validated('motivo'),
        )]);
    }

    public function removeNonWorkingDay(Request $request, int $day): JsonResponse
    {
        $updated = $this->service->removeNonWorkingDay($request->user(), $day);

        return response()->json(['message' => 'Día habilitado para asistencia.', 'data' => $updated]);
    }

    public function resolveLeave(ResolveWorkflowRequest $request, AsistenciaPermiso $permiso): JsonResponse
    {
        return response()->json(['data' => $this->service->resolveLeave($request->user(), $permiso, $request->validated('estado'), $request->validated('observacion'))]);
    }

    public function resolveAppeal(ResolveWorkflowRequest $request, AsistenciaApelacion $apelacion): JsonResponse
    {
        return response()->json(['data' => $this->service->resolveAppeal($request->user(), $apelacion, $request->validated('estado'), $request->validated('observacion'))]);
    }

    public function close(CloseAttendanceRequest $request, Asistencia $asistencia): AsistenciaResource
    {
        return new AsistenciaResource($this->service->closeAttendance($request->user(), $asistencia, $request->validated()));
    }

    private function fileUrl(?string $path): ?string
    {
        return $this->evidenceUrls->url($path);
    }
}
