<?php

namespace App\Services\Asistencia;

use Illuminate\Support\Facades\Storage;
use Throwable;

class AttendanceEvidenceUrlService
{
    private const TEMPORARY_URL_MINUTES = 30;

    private const MANAGED_PREFIXES = [
        'attendance-documents/',
        'attendance-evidence/',
    ];

    public function url(?string $path): ?string
    {
        if (! $this->isManagedPath($path)) {
            return null;
        }

        $diskName = (string) config('filesystems.attendance_evidence_disk');
        $disk = Storage::disk($diskName);

        if ($diskName === 's3') {
            try {
                return $disk->temporaryUrl(
                    $path,
                    now()->addMinutes(self::TEMPORARY_URL_MINUTES),
                );
            } catch (Throwable $exception) {
                report($exception);

                return null;
            }
        }

        return $disk->url($path);
    }

    private function isManagedPath(?string $path): bool
    {
        return is_string($path)
            && collect(self::MANAGED_PREFIXES)->contains(
                fn (string $prefix): bool => str_starts_with($path, $prefix)
            );
    }
}
