<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request): array {
            $email = mb_strtolower(trim((string) $request->input('email')));
            $ip = (string) ($request->ip() ?: 'unknown');
            $response = static function (Request $request, array $headers) {
                $retryAfter = max(1, (int) ($headers['Retry-After'] ?? 60));

                return response()->json([
                    'success' => false,
                    'message' => "Demasiadas solicitudes de inicio de sesión. Inténtalo nuevamente en {$retryAfter} segundos.",
                    'code' => 'LOGIN_RATE_LIMITED',
                    'retry_after' => $retryAfter,
                ], 429, $headers);
            };

            return [
                Limit::perMinute(30)
                    ->by('login:route:ip:'.hash('sha256', $ip))
                    ->response($response),
                Limit::perMinute(10)
                    ->by('login:route:email-ip:'.hash('sha256', $email.'|'.$ip))
                    ->response($response),
            ];
        });
    }
}
