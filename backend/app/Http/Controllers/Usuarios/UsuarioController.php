<?php

namespace App\Http\Controllers\Usuarios;

use App\Http\Controllers\Controller;
use App\Http\Requests\Usuarios\ConfigureUsuarioAccessRequest;
use App\Http\Requests\Usuarios\ResetUsuarioCredentialsRequest;
use App\Http\Requests\Usuarios\UpdateUsuarioEmailRequest;
use App\Http\Resources\Usuarios\UsuarioResource;
use App\Models\Integrante;
use App\Services\Usuarios\UsuarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UsuarioController extends Controller
{
    public function __construct(private readonly UsuarioService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return UsuarioResource::collection($this->service->list($request->user()));
    }

    public function configureAccess(
        ConfigureUsuarioAccessRequest $request,
        Integrante $integrante,
    ): JsonResponse {
        $result = $this->service->configureAccess(
            $request->user(),
            $integrante,
            $request->validated(),
        );

        return response()->json([
            'success' => true,
            'email_sent' => $result['email_sent'],
            'email_warning' => $result['email_warning'],
            'user' => (new UsuarioResource($result['integrante']))->resolve($request),
        ], 201);
    }

    public function resendCredentials(
        ResetUsuarioCredentialsRequest $request,
        Integrante $integrante,
    ): JsonResponse {
        $result = $this->service->resendCredentials(
            $request->user(),
            $integrante,
            $request->boolean('enviar_correo'),
        );

        return response()->json([
            'success' => true,
            'email_sent' => $result['email_sent'],
            'email_warning' => $result['email_warning'],
            'password' => $result['password'],
        ]);
    }

    public function updateEmail(
        UpdateUsuarioEmailRequest $request,
        Integrante $integrante,
    ): UsuarioResource {
        $target = $this->service->updateEmail(
            $request->user(),
            $integrante,
            $request->validated('correo'),
        );

        return new UsuarioResource($target);
    }
}
