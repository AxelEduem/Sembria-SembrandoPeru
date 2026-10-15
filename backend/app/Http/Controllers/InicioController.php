<?php

namespace App\Http\Controllers;

use App\Http\Resources\InicioResource;
use App\Services\Inicio\InicioService;

class InicioController extends Controller
{
    public function __construct(private readonly InicioService $service) {}

    public function __invoke(): InicioResource
    {
        return new InicioResource($this->service->summary());
    }
}
