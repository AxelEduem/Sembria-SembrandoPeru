<?php

namespace App\Http\Controllers;

use App\Http\Requests\Bitacora\IndexBitacoraRequest;
use App\Http\Resources\BitacoraResource;
use App\Services\Bitacora\BitacoraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BitacoraController extends Controller
{
    public function __construct(private readonly BitacoraService $service) {}

    public function index(IndexBitacoraRequest $request): AnonymousResourceCollection
    {
        $result = $this->service->search($request->user(), $request->validated());

        return BitacoraResource::collection($result['records'])->additional([
            'summary' => $result['summary'],
            'catalogs' => $result['catalogs'],
        ]);
    }

    public function export(IndexBitacoraRequest $request): AnonymousResourceCollection
    {
        $result = $this->service->export($request->user(), $request->validated());

        return BitacoraResource::collection($result['records'])->additional([
            'meta' => [
                'limit' => $result['limit'],
                'truncated' => $result['truncated'],
            ],
        ]);
    }

    public function metrics(IndexBitacoraRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->service->metrics($request->user())]);
    }
}
