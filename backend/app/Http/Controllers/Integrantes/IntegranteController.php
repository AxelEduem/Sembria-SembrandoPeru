<?php

namespace App\Http\Controllers\Integrantes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Integrantes\IndexIntegranteRequest;
use App\Http\Requests\Integrantes\SaveIntegranteRequest;
use App\Http\Resources\Integrantes\CumpleanosResource;
use App\Http\Resources\Integrantes\IntegranteResource;
use App\Models\Integrante;
use App\Services\Integrantes\IntegranteQueryService;
use App\Services\Integrantes\IntegranteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IntegranteController extends Controller
{
    public function __construct(
        private readonly IntegranteQueryService $queries,
        private readonly IntegranteService $service,
    ) {}

    public function index(IndexIntegranteRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();

        return IntegranteResource::collection($this->queries->list(
            $request->user(),
            $filters,
            $filters['por_pagina'] ?? null,
        ));
    }

    public function export(IndexIntegranteRequest $request): AnonymousResourceCollection
    {
        return IntegranteResource::collection(
            $this->queries->export($request->user(), $request->validated())
        );
    }

    public function store(SaveIntegranteRequest $request): JsonResponse
    {
        return (new IntegranteResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function mine(Request $request): IntegranteResource
    {
        return new IntegranteResource($this->queries->mine($request->user()));
    }

    public function mineAttendanceHours(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'hours' => $this->queries->mineAttendanceHours($request->user()),
            ],
        ]);
    }

    public function catalogs(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->queries->catalogs($request->user())]);
    }

    public function birthdays(Request $request): AnonymousResourceCollection
    {
        return CumpleanosResource::collection($this->queries->birthdays($request->user()));
    }

    public function show(IndexIntegranteRequest $request, Integrante $integrante): IntegranteResource
    {
        return new IntegranteResource($this->queries->find($request->user(), $integrante->id));
    }

    public function history(IndexIntegranteRequest $request, Integrante $integrante): IntegranteResource
    {
        return new IntegranteResource($this->queries->history($request->user(), $integrante->id));
    }

    public function attendanceHours(IndexIntegranteRequest $request, Integrante $integrante): JsonResponse
    {
        return response()->json([
            'data' => [
                'hours' => $this->queries->attendanceHours($request->user(), $integrante->id),
            ],
        ]);
    }

    public function update(SaveIntegranteRequest $request, Integrante $integrante): IntegranteResource
    {
        return new IntegranteResource($this->service->update($request->user(), $integrante, $request->validated()));
    }
}
