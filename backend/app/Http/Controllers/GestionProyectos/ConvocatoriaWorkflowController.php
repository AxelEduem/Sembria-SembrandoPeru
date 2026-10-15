<?php

namespace App\Http\Controllers\GestionProyectos;

use App\Http\Controllers\Controller;
use App\Http\Requests\GestionProyectos\ConvocatoriaWorkflowRequest;
use App\Http\Resources\GestionProyectos\ConvocatoriaResource;
use App\Models\GestionProyectos\Convocatoria;
use App\Models\GestionProyectos\Postulacion;
use App\Services\GestionProyectos\ConvocatoriaWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ConvocatoriaWorkflowController extends Controller
{
    public function __construct(private readonly ConvocatoriaWorkflowService $service) {}

    public function approval(Request $request, Convocatoria $convocatoria): JsonResponse
    {
        return response()->json(['data' => $this->service->approval($request->user(), $convocatoria)]);
    }

    public function decide(ConvocatoriaWorkflowRequest $request, Convocatoria $convocatoria): JsonResponse
    {
        return response()->json(['data' => $this->service->decide($request->user(), $convocatoria, $request->validated())]);
    }

    public function activePostulation(Request $request, Convocatoria $convocatoria): JsonResponse
    {
        return response()->json(['data' => $this->service->activePostulation($request->user(), $convocatoria)]);
    }

    public function startPostulation(Request $request, Convocatoria $convocatoria): JsonResponse
    {
        return response()->json(['data' => $this->service->startPostulation($request->user(), $convocatoria)], 201);
    }

    public function postulationDetail(Request $request, Postulacion $postulacion): JsonResponse
    {
        return response()->json(['data' => $this->service->postulationDetail($request->user(), $postulacion)]);
    }

    public function saveItem(ConvocatoriaWorkflowRequest $request, Postulacion $postulacion, string $seccion, ?int $item = null): JsonResponse
    {
        $data = $this->service->savePostulationItem($request->user(), $postulacion, $seccion, $request->validated(), $item);

        return response()->json(['data' => $data], $item ? 200 : 201);
    }

    public function finishPreparation(Request $request, Postulacion $postulacion): JsonResponse
    {
        return response()->json(['data' => $this->service->finishPreparation($request->user(), $postulacion)]);
    }

    public function registerShipment(ConvocatoriaWorkflowRequest $request, Postulacion $postulacion): JsonResponse
    {
        return response()->json(['data' => $this->service->registerShipment($request->user(), $postulacion, $request->validated())]);
    }

    public function users(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->availableUsers($request->user())]);
    }

    public function uploadDocument(ConvocatoriaWorkflowRequest $request, Postulacion $postulacion): JsonResponse
    {
        return response()->json(['data' => ['path' => $this->service->uploadDocument($request->user(), $postulacion, $request->file('archivo'))]], 201);
    }

    public function deleteDocument(ConvocatoriaWorkflowRequest $request): JsonResponse
    {
        $this->service->deleteDocument($request->user(), $request->validated('path'));

        return response()->json(['message' => 'Archivo eliminado.']);
    }

    public function downloadDocument(Request $request, int $documento): StreamedResponse
    {
        $file = $this->service->documentFile($request->user(), $documento);

        return Storage::download($file['path'], $file['name']);
    }

    public function tracking(Request $request, Postulacion $postulacion): JsonResponse
    {
        return response()->json(['data' => $this->service->tracking($request->user(), $postulacion)]);
    }

    public function trackingDetail(Request $request, int $seguimiento): JsonResponse
    {
        return response()->json(['data' => $this->service->trackingDetail($request->user(), $seguimiento)]);
    }

    public function addEvent(ConvocatoriaWorkflowRequest $request, int $seguimiento): JsonResponse
    {
        return response()->json(['data' => $this->service->addEvent($request->user(), $seguimiento, $request->validated())], 201);
    }

    public function saveCommunication(ConvocatoriaWorkflowRequest $request, int $seguimiento, ?int $comunicacion = null): JsonResponse
    {
        $data = $this->service->saveCommunication($request->user(), $seguimiento, $request->validated(), $comunicacion);

        return response()->json(['data' => $data], $comunicacion ? 200 : 201);
    }

    public function deleteCommunication(Request $request, int $seguimiento, int $comunicacion): JsonResponse
    {
        $this->service->deleteCommunication($request->user(), $seguimiento, $comunicacion);

        return response()->json(['message' => 'Comunicación eliminada.']);
    }

    public function saveRequest(ConvocatoriaWorkflowRequest $request, int $seguimiento, ?int $solicitud = null): JsonResponse
    {
        $data = $this->service->saveRequest($request->user(), $seguimiento, $request->validated(), $solicitud);

        return response()->json(['data' => $data], $solicitud ? 200 : 201);
    }

    public function respondRequest(ConvocatoriaWorkflowRequest $request, int $solicitud): JsonResponse
    {
        return response()->json(['data' => $this->service->respondRequest($request->user(), $solicitud, $request->validated())]);
    }

    public function registerResult(ConvocatoriaWorkflowRequest $request, int $seguimiento): JsonResponse
    {
        return response()->json(['data' => $this->service->registerResult($request->user(), $seguimiento, $request->validated())]);
    }

    public function archive(ConvocatoriaWorkflowRequest $request, Convocatoria $convocatoria): ConvocatoriaResource
    {
        return new ConvocatoriaResource($this->service->archive($request->user(), $convocatoria, $request->validated('motivo')));
    }

    public function restore(ConvocatoriaWorkflowRequest $request, Convocatoria $convocatoria): ConvocatoriaResource
    {
        return new ConvocatoriaResource($this->service->restore($request->user(), $convocatoria));
    }
}
