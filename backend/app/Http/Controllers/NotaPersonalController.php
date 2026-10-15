<?php

namespace App\Http\Controllers;

use App\Http\Requests\Agenda\SaveNotaPersonalRequest;
use App\Http\Resources\NotaPersonalResource;
use App\Models\NotaPersonal;
use App\Services\Agenda\NotaPersonalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class NotaPersonalController extends Controller
{
    public function __construct(private readonly NotaPersonalService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return NotaPersonalResource::collection($this->service->list($request->user()));
    }

    public function store(SaveNotaPersonalRequest $request): JsonResponse
    {
        return (new NotaPersonalResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function update(SaveNotaPersonalRequest $request, NotaPersonal $notaPersonal): NotaPersonalResource
    {
        return new NotaPersonalResource(
            $this->service->update($request->user(), $notaPersonal, $request->validated())
        );
    }

    public function destroy(Request $request, NotaPersonal $notaPersonal): Response
    {
        $this->service->delete($request->user(), $notaPersonal);

        return response()->noContent();
    }
}
