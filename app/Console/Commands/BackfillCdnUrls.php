<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One-off backfill: rewrites image URLs that were persisted before
 * AWS_S3_CDN_URL was set, so they point at the CDN instead of the raw
 * path-style S3 endpoint.
 *
 * Only rewrites the URL prefix — the object key (everything after the
 * bucket name) is untouched, since CloudFront fronts the same bucket with
 * the same keys. Safe to re-run: rows that already start with the CDN URL
 * are skipped automatically because the WHERE clause only matches the old
 * prefix.
 */
class BackfillCdnUrls extends Command
{
    protected $signature = 'app:backfill-cdn-urls {--dry-run : Show what would change without writing anything}';

    protected $description = 'Rewrite S3 object URLs stored in the database to use AWS_S3_CDN_URL instead of the raw S3 endpoint';

    /**
     * table => [column => whether it exists on this table]
     * Every column here was uploaded via AwsS3::buildPublicUrl(), so all of
     * them can carry the old raw-S3 prefix.
     */
    private array $targets = [
        'product_pictures' => ['url', 'thumbnail_url'],
        'banner'            => ['picture_url'],
        'articles'          => ['image_cover', 'thumbnail_url'],
        'unit'              => ['picture_url', 'thumbnail_url'],
        'events'            => ['picture_url', 'thumbnail_url'],
    ];

    public function handle(): int
    {
        $cdnUrl = trim((string) env('AWS_S3_CDN_URL'));

        if ($cdnUrl === '') {
            $this->error('AWS_S3_CDN_URL is not set in .env — nothing to backfill to.');
            return self::FAILURE;
        }

        $oldPrefix = rtrim((string) env('AWS_S3_ENDPOINT'), '/') . '/' . env('AWS_S3_BUCKET') . '/';
        $newPrefix = rtrim($cdnUrl, '/') . '/';

        if ($oldPrefix === '/') {
            $this->error('AWS_S3_ENDPOINT / AWS_S3_BUCKET are not set — cannot determine the old URL prefix.');
            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');

        $this->info(($dryRun ? '[DRY RUN] ' : '') . "Rewriting:\n  {$oldPrefix}*\n  -> {$newPrefix}*");
        $this->newLine();

        $totalMatched = 0;
        $totalUpdated = 0;

        foreach ($this->targets as $table => $columns) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                $this->warn("Skipping '{$table}' — table not found.");
                continue;
            }

            foreach ($columns as $column) {
                if (! DB::getSchemaBuilder()->hasColumn($table, $column)) {
                    continue;
                }

                $matched = DB::table($table)
                    ->where($column, 'like', $oldPrefix . '%')
                    ->count();

                $totalMatched += $matched;

                if ($matched === 0) {
                    continue;
                }

                $this->line("{$table}.{$column}: {$matched} row(s) matched");

                if ($dryRun) {
                    DB::table($table)
                        ->where($column, 'like', $oldPrefix . '%')
                        ->limit(3)
                        ->pluck($column)
                        ->each(fn ($val) => $this->line("    e.g. {$val}"));
                    continue;
                }

                // Portable prefix replace: works on MySQL, Postgres, SQLite.
                $updated = DB::table($table)
                    ->where($column, 'like', $oldPrefix . '%')
                    ->update([
                        $column => DB::raw(
                            "CONCAT('{$newPrefix}', SUBSTRING({$column}, " . (strlen($oldPrefix) + 1) . "))"
                        ),
                    ]);

                $totalUpdated += $updated;
            }
        }

        $this->newLine();

        if ($dryRun) {
            $this->info("Dry run complete. {$totalMatched} row(s) would be updated. Re-run without --dry-run to apply.");
        } else {
            $this->info("Done. {$totalUpdated} row(s) updated.");
        }

        return self::SUCCESS;
    }
}
