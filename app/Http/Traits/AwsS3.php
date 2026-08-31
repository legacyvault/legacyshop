<?php

namespace App\Http\Traits;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\Log;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

trait AwsS3
{
    public function getS3Client(): S3Client
    {
        $s3_config = [
            'version'     => '2006-03-01',
            'region'      => env('AWS_DEFAULT_REGION'),
            'endpoint'    => env('AWS_S3_ENDPOINT'),
            'credentials' => [
                'key'     => env('AWS_ACCESS_KEY_ID'),
                'secret'  => env('AWS_SECRET_ACCESS_KEY'),
            ],
            'use_path_style_endpoint' => true,
            'http' => ['verify' => false]
        ];

        return new S3Client($s3_config);
    }

    /**
     * Builds the public URL for an object key.
     *
     * If AWS_S3_CDN_URL is set (e.g. a CloudFront domain fronting the
     * bucket), objects are served from there instead of the raw S3
     * endpoint — no other code needs to change once a CDN is provisioned,
     * just set the env var. Falls back to the existing path-style S3 URL
     * when it's empty.
     */
    private function buildPublicUrl(string $key): string
    {
        $cdnUrl = trim((string) env('AWS_S3_CDN_URL'));

        if ($cdnUrl !== '') {
            return rtrim($cdnUrl, '/') . '/' . $key;
        }

        return rtrim(env('AWS_S3_ENDPOINT'), '/') . '/' . env('AWS_S3_BUCKET') . '/' . $key;
    }

    /**
     * Generates a small (~400px) resized JPEG copy of an uploaded image and
     * uploads it to S3 alongside the original, returning its public URL.
     *
     * Wrapped defensively: if image processing fails for any reason (GD not
     * available on this server, corrupt/unsupported file, etc.) this logs
     * and returns null rather than failing the whole upload — the product
     * picture still gets its full-size `url`, the frontend just falls back
     * to that instead of a thumbnail.
     */
    private function uploadThumbnailToS3(string $sourcePath, string $keyPrefix, string $filenameStem): ?string
    {
        try {
            $manager = new ImageManager(new Driver());
            $thumbnail = $manager->read($sourcePath)->scaleDown(width: 400);
            $encoded = $thumbnail->toJpeg(80);

            $thumbKey = "{$keyPrefix}/{$filenameStem}-thumb.jpg";

            $this->getS3Client()->putObject([
                'Bucket'      => env('AWS_S3_BUCKET'),
                'Key'         => $thumbKey,
                'Body'        => (string) $encoded,
                'ContentType' => 'image/jpeg',
            ]);

            return $this->buildPublicUrl($thumbKey);
        } catch (\Throwable $e) {
            Log::error('Failed to generate/upload product thumbnail: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Uploads a product picture (full-size original) plus a resized
     * thumbnail for use in the product grid, cart, and search suggestions.
     *
     * @return array{url: string, thumbnail_url: ?string}
     */
    public function uploadToS3($file, $productId = null): array
    {
        $extension = $file->getClientOriginalExtension();
        $random    = mt_rand(100000, 999999);

        $pathPrefix = $productId ? "products/{$productId}" : "products";
        $filenameStem = "legacy-{$random}";

        $filename = "{$pathPrefix}/{$filenameStem}." . $extension;

        $this->getS3Client()->putObject([
            'Bucket'      => env('AWS_S3_BUCKET'),
            'Key'         => $filename,
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ContentType' => $file->getMimeType()
        ]);

        $thumbnailUrl = $this->uploadThumbnailToS3($file->getRealPath(), $pathPrefix, $filenameStem);

        return [
            'url'           => $this->buildPublicUrl($filename),
            'thumbnail_url' => $thumbnailUrl,
        ];
    }

    /**
     * Uploads a unit showcase image (full-size original) plus a resized
     * thumbnail for use in the storefront showcase tiles.
     *
     * @return array{url: string, thumbnail_url: ?string}
     */
    public function uploadUnitImageToS3($file, $unitId = null): array
    {
        $extension = $file->getClientOriginalExtension();
        $random    = mt_rand(100000, 999999);

        $pathPrefix = $unitId ? "unit/{$unitId}" : "unit";
        $filenameStem = "image-{$random}";

        $filename = "{$pathPrefix}/{$filenameStem}." . $extension;

        $this->getS3Client()->putObject([
            'Bucket'      => env('AWS_S3_BUCKET'),
            'Key'         => $filename,
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ContentType' => $file->getMimeType(),
        ]);

        $thumbnailUrl = $this->uploadThumbnailToS3($file->getRealPath(), $pathPrefix, $filenameStem);

        return [
            'url'           => $this->buildPublicUrl($filename),
            'thumbnail_url' => $thumbnailUrl,
        ];
    }

    /**
     * Uploads an event showcase image (full-size original) plus a resized
     * thumbnail for use in the storefront showcase tiles.
     *
     * @return array{url: string, thumbnail_url: ?string}
     */
    public function uploadEventImageToS3($file, $eventId = null): array
    {
        $extension = $file->getClientOriginalExtension();
        $random    = mt_rand(100000, 999999);

        $pathPrefix = $eventId ? "event/{$eventId}" : "event";
        $filenameStem = "image-{$random}";

        $filename = "{$pathPrefix}/{$filenameStem}." . $extension;

        $this->getS3Client()->putObject([
            'Bucket'      => env('AWS_S3_BUCKET'),
            'Key'         => $filename,
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ContentType' => $file->getMimeType(),
        ]);

        $thumbnailUrl = $this->uploadThumbnailToS3($file->getRealPath(), $pathPrefix, $filenameStem);

        return [
            'url'           => $this->buildPublicUrl($filename),
            'thumbnail_url' => $thumbnailUrl,
        ];
    }


    /**
     * @return array{url: string, thumbnail_url: ?string}
     */
    public function uploadTestimonialImageToS3($file, $testimonialId = null): array
    {
        $extension = $file->getClientOriginalExtension();
        $random    = mt_rand(100000, 999999);

        $pathPrefix   = $testimonialId ? "testimonial/{$testimonialId}" : "testimonial";
        $filenameStem = "image-{$random}";

        $filename = "{$pathPrefix}/{$filenameStem}." . $extension;

        $this->getS3Client()->putObject([
            'Bucket'      => env('AWS_S3_BUCKET'),
            'Key'         => $filename,
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ContentType' => $file->getMimeType(),
        ]);

        return [
            'url'           => $this->buildPublicUrl($filename),
            'thumbnail_url' => $this->uploadThumbnailToS3($file->getRealPath(), $pathPrefix, $filenameStem),
        ];
    }


    public function uploadBannerImageToS3($file, $bannerId = null): string
    {
        $extension = $file->getClientOriginalExtension();
        $random    = mt_rand(100000, 999999);

        $pathPrefix = $bannerId ? "banner/{$bannerId}" : "banner";

        $filename = "{$pathPrefix}/image-{$random}." . $extension;

        $this->getS3Client()->putObject([
            'Bucket'      => env('AWS_S3_BUCKET'),
            'Key'         => $filename,
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ContentType' => $file->getMimeType(),
        ]);

        return $this->buildPublicUrl($filename);
    }

    /**
     * Uploads an article image (full-size original) plus a resized
     * thumbnail. Used for both article cover images (where the thumbnail is
     * actually used) and in-body content images (where the caller can just
     * ignore thumbnail_url and use the full-size url).
     *
     * @return array{url: string, thumbnail_url: ?string}
     */
    public function uploadArticleImageToS3($file, $articleId = null): array
    {
        $extension = $file->getClientOriginalExtension();
        $random    = mt_rand(100000, 999999);

        $pathPrefix = $articleId ? "articles/{$articleId}" : "articles";
        $filenameStem = "image-{$random}";

        $filename = "{$pathPrefix}/{$filenameStem}." . $extension;

        $this->getS3Client()->putObject([
            'Bucket'      => env('AWS_S3_BUCKET'),
            'Key'         => $filename,
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ContentType' => $file->getMimeType(),
        ]);

        $thumbnailUrl = $this->uploadThumbnailToS3($file->getRealPath(), $pathPrefix, $filenameStem);

        return [
            'url'           => $this->buildPublicUrl($filename),
            'thumbnail_url' => $thumbnailUrl,
        ];
    }

    public function uploadPdfToS3(string $pdfBinary, string $filename): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'pdf_');

        file_put_contents($tmp, $pdfBinary);

        $this->getS3Client()->putObject([
            'Bucket' => env('AWS_S3_BUCKET'),
            'Key' => $filename,
            'Body' => fopen($tmp, 'r'),
            'ContentType' => 'application/pdf',
        ]);

        unlink($tmp);

        return $this->buildPublicUrl($filename);
    }


    public function deleteFromS3(string $fileUrl): void
    {
        try {
            $bucket = env('AWS_S3_BUCKET');

            $parsedUrl = parse_url($fileUrl, PHP_URL_PATH);

            $key = ltrim(str_replace($bucket, '', $parsedUrl), '/');

            $this->getS3Client()->deleteObject([
                'Bucket' => $bucket,
                'Key'    => $key,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to delete S3 file: " . $e->getMessage());
        }
    }
}
