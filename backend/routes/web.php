<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Autenticación
|--------------------------------------------------------------------------
*/

Route::prefix('api')->group(function () {

    Route::post('/login', [
        AuthController::class,
        'login',
    ])->middleware(['guest', 'throttle:login']);

    Route::post('/logout', [
        AuthController::class,
        'logout',
    ])->middleware('auth');

});
