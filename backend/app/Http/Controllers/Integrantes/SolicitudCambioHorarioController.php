<?php

namespace App\Http\Controllers\Integrantes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Integrantes\IndexSolicitudCambioHorarioRequest;
use App\Http\Requests\Integrantes\ResolveSolicitudCambioHorarioRequest;
use App\Http\Requests\Integrantes\StoreSolicitudCambioHorarioRequest;
use App\Http\Resources\Integrantes\SolicitudCambioHorarioResource;
use App\Models\SolicitudCambioHorario;
use App\Services\Integrantes\SolicitudCambioHorarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SolicitudCambioHorarioController extends Controller
{
    public function __construct(private readonly SolicitudCambioHorarioService $service) {}

    public function mine(IndexSolicitudCambioHorarioRequest $request): AnonymousResourceCollection
    {
        $result = $this->service->mine($request->user(), $request->validated());

        return SolicitudCambioHorarioResource::collection($result['requests'])
            ->additional([
                'has_pending' => $result['has_pending'],
                'creation_eligibility' => $result['creation_eligibility'],
            ]);
    }

    public function index(IndexSolicitudCambioHorarioRequest $request): AnonymousResourceCollection
    {
        return SolicitudCambioHorarioResource::collection(
            $this->service->list($request->user(), $request->validated('estado'))
        );
    }

    public function store(StoreSolicitudCambioHorarioRequest $request): JsonResponse
    {
        return (new SolicitudCambioHorarioResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function resolve(
        ResolveSolicitudCambioHorarioRequest $request,
        SolicitudCambioHorario $solicitud,
    ): SolicitudCambioHorarioResource {
        return new SolicitudCambioHorarioResource(
            $this->service->resolve($request->user(), $solicitud, $request->validated())
        );
    }
}
