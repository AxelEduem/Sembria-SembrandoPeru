<?php

namespace App\Http\Controllers;

use App\Http\Requests\Cargos\SaveCargoRequest;
use App\Http\Requests\Cargos\SetCargoStatusRequest;
use App\Http\Resources\CargoResource;
use App\Models\Cargo;
use App\Services\Cargos\CargoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CargoController extends Controller
{
    public function __construct(private readonly CargoService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return CargoResource::collection($this->service->list($request->user()));
    }

    public function store(SaveCargoRequest $request): JsonResponse
    {
        return (new CargoResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, Cargo $cargo): CargoResource
    {
        return new CargoResource($this->service->find($request->user(), $cargo));
    }

    public function update(SaveCargoRequest $request, Cargo $cargo): CargoResource
    {
        return new CargoResource($this->service->update($request->user(), $cargo, $request->validated()));
    }

    public function setStatus(SetCargoStatusRequest $request, Cargo $cargo): CargoResource
    {
        return new CargoResource(
            $this->service->setActive($request->user(), $cargo, $request->boolean('activo'))
        );
    }
}
