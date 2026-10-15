<?php

namespace App\Http\Middleware;

use App\Services\Bitacora\BitacoraService;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class RecordBitacora
{
    public function __construct(private readonly BitacoraService $service) {}

    public function handle(Request $request, Closure $next): Response
    {
        try {
            $response = $next($request);
            $this->recordSafely($request, $response->getStatusCode(), $response);

            return $response;
        } catch (Throwable $exception) {
            $this->recordSafely($request, $this->statusFor($exception));

            throw $exception;
        }
    }

    private function recordSafely(Request $request, int $status, ?Response $response = null): void
    {
        try {
            $this->service->record($request, $status, $response);
        } catch (Throwable) {
            // Una falla secundaria de auditoría no debe ocultar la respuesta original.
        }
    }

    private function statusFor(Throwable $exception): int
    {
        return match (true) {
            $exception instanceof ValidationException => 422,
            $exception instanceof AuthorizationException => 403,
            $exception instanceof AuthenticationException => 401,
            $exception instanceof ModelNotFoundException => 404,
            $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
            default => 500,
        };
    }
}
