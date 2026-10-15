<?php

namespace App\Http\Controllers;

use App\Http\Requests\Aplicaciones\SaveAplicacionRequest;
use App\Http\Requests\Aplicaciones\SetAplicacionStatusRequest;
use App\Http\Resources\AplicacionResource;
use App\Models\Aplicacion;
use App\Services\Aplicaciones\AplicacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AplicacionController extends Controller
{
    public function __construct(private readonly AplicacionService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return AplicacionResource::collection($this->service->list($request->user()));
    }

    public function store(SaveAplicacionRequest $request): JsonResponse
    {
        return (new AplicacionResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, Aplicacion $aplicacion): AplicacionResource
    {
        return new AplicacionResource($this->service->find($request->user(), $aplicacion));
    }

    public function update(SaveAplicacionRequest $request, Aplicacion $aplicacion): AplicacionResource
    {
        return new AplicacionResource(
            $this->service->update($request->user(), $aplicacion, $request->validated())
        );
    }

    public function setStatus(
        SetAplicacionStatusRequest $request,
        Aplicacion $aplicacion,
    ): AplicacionResource {
        return new AplicacionResource(
            $this->service->setActive($request->user(), $aplicacion, $request->boolean('activo'))
        );
    }
}
