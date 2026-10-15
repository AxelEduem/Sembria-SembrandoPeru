<?php

namespace Tests\Unit;

use App\Services\Asistencia\AttendanceEvidenceUrlService;
use DateTimeInterface;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class AttendanceEvidenceUrlServiceTest extends TestCase
{
    public function test_it_generates_a_temporary_url_for_s3_documents(): void
    {
        config(['filesystems.attendance_evidence_disk' => 's3']);
        $path = 'attendance-documents/absence-justifications/document.pdf';
        $disk = Mockery::mock();
        $disk->shouldReceive('temporaryUrl')
            ->once()
            ->with($path, Mockery::type(DateTimeInterface::class))
            ->andReturn('https://s3.example.test/document.pdf?X-Amz-Signature=signed');
        Storage::shouldReceive('disk')->once()->with('s3')->andReturn($disk);

        $url = app(AttendanceEvidenceUrlService::class)->url($path);

        $this->assertSame('https://s3.example.test/document.pdf?X-Amz-Signature=signed', $url);
    }

    public function test_it_keeps_regular_urls_for_local_public_storage(): void
    {
        config(['filesystems.attendance_evidence_disk' => 'public']);
        $path = 'attendance-evidence/evidence.png';
        $disk = Mockery::mock();
        $disk->shouldReceive('url')->once()->with($path)->andReturn('/storage/'.$path);
        Storage::shouldReceive('disk')->once()->with('public')->andReturn($disk);

        $this->assertSame(
            '/storage/'.$path,
            app(AttendanceEvidenceUrlService::class)->url($path),
        );
    }

    public function test_it_rejects_paths_outside_attendance_storage(): void
    {
        Storage::shouldReceive('disk')->never();

        $this->assertNull(app(AttendanceEvidenceUrlService::class)->url('../document.pdf'));
        $this->assertNull(app(AttendanceEvidenceUrlService::class)->url('avatars/photo.png'));
        $this->assertNull(app(AttendanceEvidenceUrlService::class)->url(null));
    }
}
