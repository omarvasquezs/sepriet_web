<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\ServicioController;
use App\Http\Controllers\Api\ComprobanteController;
use App\Http\Controllers\Api\CajaController;
use App\Http\Controllers\Api\ReporteController;

// Public route: Login with dedicated rate limiter
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');

// Protected routes (Sanctum Bearer token required + API throttle rate limiter)
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Auth & User Profile
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Catalogos
    Route::get('/catalogos', [ComprobanteController::class, 'catalogos']);

    // Clientes CRUD
    Route::apiResource('clientes', ClienteController::class);

    // Servicios CRUD
    Route::apiResource('servicios', ServicioController::class);

    // Comprobantes (Tickets)
    Route::get('/comprobantes', [ComprobanteController::class, 'index']);
    Route::post('/comprobantes', [ComprobanteController::class, 'store']);
    Route::get('/comprobantes/{id}', [ComprobanteController::class, 'show']);
    Route::post('/comprobantes/{id}/abono', [ComprobanteController::class, 'abono']);
    Route::put('/comprobantes/{id}/estado', [ComprobanteController::class, 'cambiarEstado']);
    Route::get('/comprobantes/{id}/pdf', [ComprobanteController::class, 'generarPdf']);
    Route::post('/comprobantes/{id}/send-whatsapp', [ComprobanteController::class, 'enviarWhatsAppTextMeBot']);

    // Caja Chica / Turnos
    Route::get('/caja/estado', [CajaController::class, 'estado']);
    Route::post('/caja/apertura', [CajaController::class, 'apertura']);
    Route::post('/caja/cierre', [CajaController::class, 'cierre']);
    Route::post('/caja/egreso', [CajaController::class, 'registrarEgreso']);

    // Reportes
    Route::get('/reportes/financiero', [ReporteController::class, 'financiero']);
    Route::get('/reportes/trabajo', [ReporteController::class, 'trabajo']);
});
