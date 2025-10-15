<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\LazyCollection;
use SplFileObject;

class IndonesiaGeoImport extends Command
{
    protected $signature = 'indo:import
        {--dir= : Folder CSV, default storage/app/kodepos}
        {--delimiter=, : Delimiter CSV}
        {--truncate : Kosongkan tabel sebelum import}
        {--batch=1000 : Batch upsert}';

    protected $description = 'Import prov/kabkota/kec/desakel CSV ke tabel indonesia_*';

    public function handle(): int
    {
        $dir  = $this->option('dir') ?: storage_path('app/kodepos');
        $del  = (string)$this->option('delimiter');
        $batch= (int)$this->option('batch');
        ini_set('memory_limit', '512M');   
        DB::connection()->disableQueryLog();  

        $paths = [
            'prov'    => $this->must($dir.'/prov.csv'),
            'kabkota' => $this->must($dir.'/kabkota.csv'),
            'kec'     => $this->must($dir.'/kec.csv'),
            'desakel' => $this->must($dir.'/desakel.csv'),
        ];
    
        // --- FK OFF untuk TRUNCATE & IMPORT ---
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
    
        if ($this->option('truncate')) {
            $this->warn('Truncating indonesia_* tables…');
            DB::table('indonesia_postal_codes')->truncate();
            DB::table('indonesia_villages')->truncate();
            DB::table('indonesia_districts')->truncate();
            DB::table('indonesia_cities')->truncate();
            DB::table('indonesia_provinces')->truncate();
        }
    
        // 1..4 import
        $this->info('Import provinces…');  $this->importProvinces($paths['prov'], $del, $batch);
        $this->info('Import cities…');     $this->importCities($paths['kabkota'], $del, $batch);
        $this->info('Import districts…');  $this->importDistricts($paths['kec'], $del, $batch);
        $this->info('Import villages & postal codes…');
        $this->importVillagesAndZips($paths['desakel'], $del, $batch);
    
        // --- hidupkan lagi FK ---
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    
        $this->info('Done.');
        return self::SUCCESS;
    }
    

    /* ---------- Importers ---------- */

    private function importProvinces(string $file, string $del, int $batch): void
    {
        $progress = $this->output->createProgressBar();
        $buf=[]; $cnt=0;

        $this->readCsvAssoc($file, $del)->each(function($r) use (&$buf,&$cnt,$batch,$progress){
            $code = trim((string)($r['id'] ?? ''));
            $name = trim((string)($r['nm'] ?? ''));
            if ($code==='' || $name==='') { $progress->advance(); return; }

            $buf[] = ['code'=>$code,'name'=>$name,'created_at'=>now(),'updated_at'=>now()];
            if (count($buf) >= $batch) { $this->upsert('indonesia_provinces',$buf,['code'],['name','updated_at']); $cnt+=count($buf); $buf=[]; }
            $progress->advance();
        });
        if ($buf) { $this->upsert('indonesia_provinces',$buf,['code'],['name','updated_at']); $cnt+=count($buf); }
        $progress->finish(); $this->newLine(); $this->line("Provinces: {$cnt}");
    }

    private function importCities(string $file, string $del, int $batch): void
    {
        $progress = $this->output->createProgressBar();
        $buf=[]; $cnt=0;

        $this->readCsvAssoc($file, $del)->each(function($r) use (&$buf,&$cnt,$batch,$progress){
            $code = trim((string)($r['id'] ?? ''));
            $name = trim((string)($r['nm'] ?? ''));
            $type = mb_strtolower(trim((string)($r['type'] ?? '')));
            if ($code==='' || $name==='') { $progress->advance(); return; }
            [$prov] = explode('.', $code) + [null];
            $prov = trim((string)$prov);

            $buf[] = [
                'code'=>$code,
                'province_code'=>$prov,
                'name'=>$name,
                'type'=> in_array($type,['kota','kabupaten']) ? $type : 'kabupaten',
                'created_at'=>now(),'updated_at'=>now()
            ];
            if (count($buf) >= $batch) { $this->upsert('indonesia_cities',$buf,['code'],['province_code','name','type','updated_at']); $cnt+=count($buf); $buf=[]; }
            $progress->advance();
        });
        if ($buf) { $this->upsert('indonesia_cities',$buf,['code'],['province_code','name','type','updated_at']); $cnt+=count($buf); }
        $progress->finish(); $this->newLine(); $this->line("Cities: {$cnt}");
    }

    private function importDistricts(string $file, string $del, int $batch): void
    {
        $progress = $this->output->createProgressBar();
        $buf=[]; $cnt=0;

        $this->readCsvAssoc($file, $del)->each(function($r) use (&$buf,&$cnt,$batch,$progress){
            $code = trim((string)($r['id'] ?? ''));
            $name = trim((string)($r['nm'] ?? ''));
            if ($code==='' || $name==='') { $progress->advance(); return; }

            $parts = array_map('trim', explode('.', $code)); // jaga-jaga ada spasi
            if (count($parts) < 3) { $progress->advance(); return; }
            
            $prov = $parts[0];
            $city = $parts[0].'.'.$parts[1];
            
            $buf[] = [
              'code'          => $code,
              'city_code'     => $city,
              'province_code' => $prov,
              'name'          => $name,
              'created_at'    => now(),
              'updated_at'    => now(),
            ];
            if (count($buf) >= $batch) { $this->upsert('indonesia_districts', $buf, ['code'], ['name','updated_at']); $cnt+=count($buf); $buf=[]; }
            $progress->advance();
        });
        if ($buf) { $this->upsert('indonesia_districts', $buf, ['code'], ['name','updated_at']); $cnt+=count($buf); }
        $progress->finish(); $this->newLine(); $this->line("Districts: {$cnt}");
    }

    private function importVillagesAndZips(string $file, string $del, int $batch): void
    {
        $this->info('Import villages & postal codes (low-memory)…');
        $progress = $this->output->createProgressBar();
        $progress->start();

        $insertedV = 0;
        $insertedZ = 0;

        // baca CSV per chunk agar RAM kecil
        $this->readCsvAssoc($file, $del)
            ->chunk($batch)
            ->each(function ($chunk) use (&$insertedV, &$insertedZ, $progress) {

                $bufV = [];
                $bufZ = [];

                foreach ($chunk as $r) {
                    $code = trim((string)($r['id'] ?? ''));
                    $name = trim((string)($r['nm'] ?? ''));
                    $zip  = preg_replace('/\D+/', '', (string)($r['zip'] ?? ''));

                    if ($code === '' || $name === '') { $progress->advance(); continue; }

                    $parts = array_map('trim', explode('.', $code)); // ["11","01","01","2001"]
                    if (count($parts) < 4) { $progress->advance(); continue; }

                    $prov = $parts[0];
                    $city = $parts[0].'.'.$parts[1];
                    $dist = $parts[0].'.'.$parts[1].'.'.$parts[2];

                    $bufV[] = [
                        'code'          => $code,
                        'district_code' => $dist,
                        'city_code'     => $city,
                        'province_code' => $prov,
                        'name'          => $name,
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ];

                    if ($zip !== '') {
                        $bufZ[] = [
                            'village_code' => $code,
                            'postal_code'  => $zip,
                            'created_at'   => now(),
                            'updated_at'   => now(),
                        ];
                    }

                    $progress->advance();
                }

                if (!empty($bufV)) {
                    // lebih ringan dibanding upsert (karena key "code" sudah unique)
                    DB::table('indonesia_villages')->insertOrIgnore($bufV);
                    $insertedV += count($bufV);
                }
                if (!empty($bufZ)) {
                    DB::table('indonesia_postal_codes')->insertOrIgnore($bufZ);
                    $insertedZ += count($bufZ);
                }

                // buang buffer chunk agar tidak menumpuk di memory
                unset($bufV, $bufZ, $chunk);
                gc_collect_cycles();
            });

        $progress->finish();
        $this->newLine();
        $this->line("Villages inserted: {$insertedV} | Postal codes inserted: {$insertedZ}");
    }


    /* ---------- Utils ---------- */

    private function readCsvAssoc(string $filePath, string $delimiter): LazyCollection
    {
        $f = new SplFileObject($filePath, 'r');
        $f->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::DROP_NEW_LINE);
        $f->setCsvControl($delimiter);

        return LazyCollection::make(function () use ($f) {
            $headers = null;
            foreach ($f as $row) {
                if ($row === [null] || $row === false) continue;
                if ($headers === null) {
                    $headers = array_map(fn($h)=>mb_strtolower(trim((string)$h)), $row);
                    continue;
                }
                $assoc = [];
                foreach ($headers as $i=>$key) { $assoc[$key] = $row[$i] ?? null; }
                yield $assoc;
            }
        });
    }

    private function upsert(string $table, array $rows, array $uniqueBy, array $updateColumns): void
    {
        DB::table($table)->upsert($rows, $uniqueBy, $updateColumns);
    }

    private function must(string $path): string
    {
        if (!file_exists($path)) { $this->error("File not found: {$path}"); exit(self::FAILURE); }
        return $path;
    }
}
