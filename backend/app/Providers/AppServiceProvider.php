<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;

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
        // General API rate limiter (120 requests per minute per user / IP)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Strict rate limiter for Authentication (10 attempts per minute per user/IP)
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(10)->by($request->input('username') . '|' . $request->ip())->response(function () {
                return response()->json([
                    'message' => 'Demasiados intentos de inicio de sesión. Por favor, espere 1 minuto antes de reintentar.'
                ], 429);
            });
        });
    }
}
