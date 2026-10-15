<?php

namespace App\Http\Controllers\Asistencia;

use App\Http\Controllers\Controller;
use App\Models\NotificacionAsistencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = NotificacionAsistencia::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('dismissed_at')
            ->latest()
            ->get();

        return response()->json(['data' => $items]);
    }

    public function read(Request $request, NotificacionAsistencia $notification): JsonResponse
    {
        $this->ensureOwner($request, $notification);
        $notification->update(['read_at' => now()]);

        return response()->json(['data' => $notification->fresh()]);
    }

    public function destroy(Request $request, NotificacionAsistencia $notification): JsonResponse
    {
        $this->ensureOwner($request, $notification);
        $notification->update(['dismissed_at' => now()]);

        return response()->json(['message' => 'Notificación eliminada.']);
    }

    public function readAll(Request $request): JsonResponse
    {
        NotificacionAsistencia::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('dismissed_at')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Notificaciones marcadas como leídas.']);
    }

    private function ensureOwner(Request $request, NotificacionAsistencia $notification): void
    {
        abort_unless((int) $notification->user_id === (int) $request->user()->id, 403);
    }
}
