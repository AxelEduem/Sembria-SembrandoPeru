<?php

namespace App\Http\Controllers;

use App\Http\Requests\Areas\SaveAreaRequest;
use App\Http\Requests\Areas\SetAreaStatusRequest;
use App\Http\Resources\AreaResource;
use App\Models\Area;
use App\Services\Areas\AreaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AreaController extends Controller
{
    public function __construct(private readonly AreaService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return AreaResource::collection($this->service->list($request->user()));
    }

    public function store(SaveAreaRequest $request): JsonResponse
    {
        return (new AreaResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, Area $area): AreaResource
    {
        return new AreaResource($this->service->find($request->user(), $area));
    }

    public function update(SaveAreaRequest $request, Area $area): AreaResource
    {
        return new AreaResource($this->service->update($request->user(), $area, $request->validated()));
    }

    public function setStatus(SetAreaStatusRequest $request, Area $area): AreaResource
    {
        return new AreaResource(
            $this->service->setActive($request->user(), $area, $request->boolean('activo'))
        );
    }
}
