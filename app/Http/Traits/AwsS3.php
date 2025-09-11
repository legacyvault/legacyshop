<?php

namespace App\Http\Traits;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\Log;

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

    public function uploadToS3($file, $productId = null): string
    {
        $extension = $file->getClientOriginalExtension();
        $random    = mt_rand(100000, 999999);

        $pathPrefix = $productId ? "products/{$productId}" : "products";

        $filename = "{$pathPrefix}/legacy-{$random}." . $extension;

        $this->getS3Client()->putObject([
            'Bucket'      => env('AWS_S3_BUCKET'),
            'Key'         => $filename,
            'Body'        => fopen($file->getRealPath(), 'r'),
            'ACL'         => 'public-read',
            'ContentType' => $file->getMimeType()
        ]);

        return rtrim(env('AWS_S3_ENDPOINT'), '/') . '/' . env('AWS_S3_BUCKET') . '/' . $filename;
    }
}
