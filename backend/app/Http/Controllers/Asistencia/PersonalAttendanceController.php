<?php

namespace App\Http\Controllers\Asistencia;

use App\Http\Controllers\Controller;
use App\Http\Requests\Asistencia\CreateAttendanceJustificationRequest;
use App\Http\Requests\Asistencia\FinishAttendanceRequest;
use App\Http\Requests\Asistencia\StartAttendanceRequest;
use App\Http\Resources\Asistencia\AsistenciaResource;
use App\Models\Asistencia;
use App\Services\Asistencia\PersonalAttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PersonalAttendanceController extends Controller
{
    public function __construct(private readonly PersonalAttendanceService $service) {}

    public function today(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->today($request->user())]);
    }

    public function history(Request $request): AnonymousResourceCollection
    {
        $limit = max(1, min(1000, $request->integer('limit', 20)));

        return AsistenciaResource::collection($this->service->history($request->user(), $limit));
    }

    public function start(StartAttendanceRequest $request): AsistenciaResource
    {
        return new AsistenciaResource($this->service->start(
            $request->user(),
            $request->integer('horario_id'),
            $request->validated('motivo'),
            $request->validated('ocurrido_en'),
            $request->validated('client_event_id'),
            $request->validated('recuperaciones', []),
        ));
    }

    public function finish(
        FinishAttendanceRequest $request,
        Asistencia $asistencia,
    ): AsistenciaResource {
        return new AsistenciaResource($this->service->finish(
            $request->user(),
            $asistencia,
            $request->validated('descripcion'),
            $request->validated('motivo_salida'),
            $request->validated('ocurrido_en'),
            $request->validated('client_event_id'),
            $request->file('adjunto'),
            $request->validated('recuperaciones', []),
        ));
    }

    public function justify(
        CreateAttendanceJustificationRequest $request,
        Asistencia $asistencia,
    ): AsistenciaResource {
        return new AsistenciaResource($this->service->justify(
            $request->user(),
            $asistencia,
            $request->validated('motivo'),
            $request->file('adjunto'),
            $request->validated('recuperaciones', []),
        ));
    }
}
