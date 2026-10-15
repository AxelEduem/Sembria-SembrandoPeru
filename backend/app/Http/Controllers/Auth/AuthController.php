<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ChangeTemporaryPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Auth\AuthProfileService;
use App\Services\Auth\LoginThrottleService;
use App\Services\Auth\ProfilePasswordService;
use App\Services\Auth\TemporaryPasswordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthProfileService $profileService,
        private readonly TemporaryPasswordService $temporaryPasswordService,
        private readonly ProfilePasswordService $profilePasswordService,
        private readonly LoginThrottleService $loginThrottle,
    ) {}

    /**
     * Inicia sesión.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = [
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
        ];

        $remember = false;
        $ip = (string) ($request->ip() ?: 'unknown');
        $retryAfter = $this->loginThrottle->retryAfter($credentials['email'], $ip);

        if ($retryAfter > 0) {
            $this->loginThrottle->logBlockedAttempt($credentials['email'], $ip, $retryAfter);

            return response()->json([
                'success' => false,
                'message' => "Demasiados intentos fallidos. Inténtalo nuevamente en {$retryAfter} segundos.",
                'code' => 'LOGIN_RATE_LIMITED',
                'retry_after' => $retryAfter,
            ], 429, ['Retry-After' => (string) $retryAfter]);
        }

        if (! Auth::attempt($credentials, $remember)) {
            $this->loginThrottle->registerFailure($credentials['email'], $ip);

            return response()->json([
                'success' => false,
                'message' => 'Las credenciales proporcionadas no son válidas.',
            ], 401);
        }

        $this->loginThrottle->clearEmailFailures($credentials['email']);

        $request->session()->regenerate();

        try {
            $user = Auth::user();

            $profile = $this->profileService->buildProfile(
                (int) $user->id
            );

            /*
             * Una contraseña temporal no debería poder utilizarse
             * después de su fecha de expiración.
             */
            if (
                $profile['must_change_password'] &&
                $profile['persona']['password_temporal_expira_en'] !== null &&
                now()->greaterThan(
                    $profile['persona']['password_temporal_expira_en']
                )
            ) {
                Auth::logout();

                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña temporal ha expirado. Solicita nuevas credenciales al administrador.',
                    'code' => 'TEMPORARY_PASSWORD_EXPIRED',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'message' => 'Inicio de sesión correcto.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'profile' => $profile,
            ]);
        } catch (Throwable $exception) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            Log::error('Error construyendo el perfil institucional después del login.', [
                'user_id' => Auth::id(),
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'La cuenta no está correctamente configurada para acceder al sistema.',
                'code' => 'ACCOUNT_CONFIGURATION_ERROR',
            ], 403);
        }
    }

    /**
     * Devuelve el usuario y perfil autenticados.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        try {
            $profile = $this->profileService->buildProfile(
                (int) $user->id
            );

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'profile' => $profile,
            ]);
        } catch (Throwable $exception) {
            Log::error('Error obteniendo el perfil institucional.', [
                'user_id' => $user->id,
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No fue posible cargar el perfil institucional.',
                'code' => 'PROFILE_LOAD_ERROR',
            ], 403);
        }
    }

    /**
     * Devuelve una firma ligera de los permisos efectivos del usuario.
     */
    public function permissionsVersion(Request $request): JsonResponse
    {
        return response()
            ->json([
                'success' => true,
                'permissions_version' => $this->profileService->permissionsVersion(
                    (int) $request->user()->id
                ),
            ])
            ->header('Cache-Control', 'no-store, private');
    }

    /**
     * Sustituye la contraseña temporal del usuario autenticado.
     */
    public function changeTemporaryPassword(ChangeTemporaryPasswordRequest $request): JsonResponse
    {
        $this->temporaryPasswordService->complete(
            $request->user(),
            $request->validated('password'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $this->profilePasswordService->change(
            $user,
            $request->validated('current_password'),
            $request->validated('password'),
        );

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente. Inicia sesión nuevamente.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}
