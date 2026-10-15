<?php

namespace App\Http\Controllers\Asistencia;

use App\Http\Controllers\Controller;
use App\Http\Requests\Asistencia\AttendanceRangeRequest;
use App\Http\Requests\Asistencia\AttendanceTrackingRequest;
use App\Http\Requests\Asistencia\ResolveJustificationRequest;
use App\Http\Resources\Asistencia\AttendanceTrackingResource;
use App\Models\Asistencia;
use App\Models\AsistenciaJustificacion;
use App\Services\Asistencia\AttendanceTrackingService;
use App\Services\Profile\AvatarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AttendanceTrackingController extends Controller
{
    public function __construct(
        private readonly AttendanceTrackingService $service,
        private readonly AvatarService $avatars,
    ) {}

    public function index(AttendanceTrackingRequest $request): AnonymousResourceCollection
    {
        $date = CarbonImmutable::createFromFormat(
            '!Y-m-d',
            $request->validated('fecha'),
            'America/Lima',
        );

        return AttendanceTrackingResource::collection(
            $this->service->list($request->user(), $date)
        );
    }

    public function metrics(AttendanceRangeRequest $request): JsonResponse
    {
        [$from, $to] = $this->range($request);

        return response()->json([
            'data' => $this->service->metrics($request->user(), $from, $to),
        ]);
    }

    public function warnings(Request $request): JsonResponse
    {
        $warnings = $this->service->warnings($request->user());
        $warnings->each(
            fn ($item) => $item->avatar_url = $this->avatars->url($item->avatar_path ?? null)
        );

        return response()->json([
            'data' => $warnings,
        ]);
    }

    public function audit(Request $request, Asistencia $asistencia): JsonResponse
    {
        return response()->json([
            'data' => $this->service->audit($request->user(), $asistencia),
        ]);
    }

    public function resolveJustification(
        ResolveJustificationRequest $request,
        AsistenciaJustificacion $justificacion,
    ): JsonResponse {
        $attendance = $this->service->resolveJustification(
            $request->user(),
            $justificacion,
            $request->validated('estado'),
            $request->validated('observacion'),
            $request->validated('gravedad_amonestacion'),
        );

        return response()->json([
            'message' => 'La justificación fue resuelta correctamente.',
            'data' => ['id' => $attendance->id],
        ]);
    }

    private function range(AttendanceRangeRequest $request): array
    {
        return [
            CarbonImmutable::createFromFormat('!Y-m-d', $request->validated('desde'), 'America/Lima'),
            CarbonImmutable::createFromFormat('!Y-m-d', $request->validated('hasta'), 'America/Lima'),
        ];
    }
}
