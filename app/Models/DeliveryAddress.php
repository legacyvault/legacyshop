<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DeliveryAddress extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'delivery_address';

    protected $fillable = [
        'name',
        'profile_id',
        'biteship_destination_id',
        'contact_name',
        'contact_phone',
        'country',
        'province',
        'address',
        'city',
        'district',
        'village',
        'postal_code',
        'is_active',
        'latitude',
        'longitude',
    ];

    protected $appends = [
        'province_code',
        'city_code',
        'district_code',
        'village_code',
    ];

    /**
     * Cached lookup tables to minimise repeated queries.
     *
     * @var array<string, \App\Models\IndonesiaProvince|null>
     */
    protected static array $provinceCache = [];

    /**
     * @var array<string, \App\Models\IndonesiaCity|null>
     */
    protected static array $cityCache = [];

    /**
     * @var array<string, \App\Models\IndonesiaDistrict|null>
     */
    protected static array $districtCache = [];

    /**
     * @var array<string, \App\Models\IndonesiaVillage|null>
     */
    protected static array $villageCache = [];

    public function profile()
    {
        return $this->belongsTo(Profile::class, 'profile_id', 'id');
    }

    public function getProvinceAttribute($value)
    {
        if (! $this->isIndonesiaAddress() || ! $value) {
            return $value;
        }

        $province = $this->resolveProvince($value);

        return $province?->name ?? $value;
    }

    public function getProvinceCodeAttribute(): ?string
    {
        if (! $this->isIndonesiaAddress()) {
            return null;
        }

        $stored = $this->getRawAttributeValue('province');
        if (! $stored) {
            return null;
        }

        return $this->resolveProvince($stored)?->code;
    }

    public function getCityAttribute($value)
    {
        if (! $this->isIndonesiaAddress() || ! $value) {
            return $value;
        }

        $city = $this->resolveCity($value);

        if (! $city) {
            return $value;
        }

        $prefix = $city->type === 'kota' ? 'Kota' : 'Kabupaten';

        return trim($prefix.' '.$city->name);
    }

    public function getCityCodeAttribute(): ?string
    {
        if (! $this->isIndonesiaAddress()) {
            return null;
        }

        $stored = $this->getRawAttributeValue('city');
        if (! $stored) {
            return null;
        }

        return $this->resolveCity($stored)?->code;
    }

    public function getDistrictAttribute($value)
    {
        if (! $this->isIndonesiaAddress() || ! $value) {
            return $value;
        }

        $district = $this->resolveDistrict($value);

        return $district?->name ?? $value;
    }

    public function getDistrictCodeAttribute(): ?string
    {
        if (! $this->isIndonesiaAddress()) {
            return null;
        }

        $stored = $this->getRawAttributeValue('district');
        if (! $stored) {
            return null;
        }

        return $this->resolveDistrict($stored)?->code;
    }

    public function getVillageAttribute($value)
    {
        if (! $this->isIndonesiaAddress() || ! $value) {
            return $value;
        }

        $village = $this->resolveVillage($value);

        return $village?->name ?? $value;
    }

    public function getVillageCodeAttribute(): ?string
    {
        if (! $this->isIndonesiaAddress()) {
            return null;
        }

        $stored = $this->getRawAttributeValue('village');
        if (! $stored) {
            return null;
        }

        return $this->resolveVillage($stored)?->code;
    }

    protected function isIndonesiaAddress(): bool
    {
        $country = strtoupper((string) ($this->attributes['country'] ?? ''));

        return in_array($country, ['ID', 'IDN'], true);
    }

    protected function resolveProvince(string $value): ?IndonesiaProvince
    {
        if (isset(self::$provinceCache[$value])) {
            return self::$provinceCache[$value];
        }

        $province = IndonesiaProvince::where('code', $value)->first();
        if ($province) {
            return self::$provinceCache[$value] = $province;
        }

        $normalized = strtolower($value);
        if (isset(self::$provinceCache[$normalized])) {
            return self::$provinceCache[$normalized];
        }

        $province = IndonesiaProvince::whereRaw('LOWER(name) = ?', [$normalized])->first();

        if ($province) {
            self::$provinceCache[$normalized] = $province;
        }

        return $province;
    }

    protected function resolveCity(string $value): ?IndonesiaCity
    {
        if (isset(self::$cityCache[$value])) {
            return self::$cityCache[$value];
        }

        $city = IndonesiaCity::where('code', $value)->first();
        if ($city) {
            return self::$cityCache[$value] = $city;
        }

        $normalized = $this->normalizeCityName($value);
        if (isset(self::$cityCache[$normalized])) {
            return self::$cityCache[$normalized];
        }

        $city = IndonesiaCity::whereRaw('LOWER(name) = ?', [$normalized])->first();

        if ($city) {
            self::$cityCache[$normalized] = $city;
        }

        return $city;
    }

    protected function resolveDistrict(string $value): ?IndonesiaDistrict
    {
        if (isset(self::$districtCache[$value])) {
            return self::$districtCache[$value];
        }

        $district = IndonesiaDistrict::where('code', $value)->first();
        if ($district) {
            return self::$districtCache[$value] = $district;
        }

        $normalized = strtolower($value);
        $cacheKey = $normalized.'|'.($this->city_code ?? '');
        if (isset(self::$districtCache[$cacheKey])) {
            return self::$districtCache[$cacheKey];
        }

        $query = IndonesiaDistrict::whereRaw('LOWER(name) = ?', [$normalized]);

        if ($this->city_code) {
            $query->where('city_code', $this->city_code);
        }

        $district = $query->first();

        if ($district) {
            self::$districtCache[$cacheKey] = $district;
        }

        return $district;
    }

    protected function resolveVillage(string $value): ?IndonesiaVillage
    {
        if (isset(self::$villageCache[$value])) {
            return self::$villageCache[$value];
        }

        $village = IndonesiaVillage::where('code', $value)->first();
        if ($village) {
            return self::$villageCache[$value] = $village;
        }

        $normalized = strtolower($value);
        $cacheKey = $normalized.'|'.($this->district_code ?? '');
        if (isset(self::$villageCache[$cacheKey])) {
            return self::$villageCache[$cacheKey];
        }

        $query = IndonesiaVillage::whereRaw('LOWER(name) = ?', [$normalized]);

        if ($this->district_code) {
            $query->where('district_code', $this->district_code);
        }

        $village = $query->first();

        if ($village) {
            self::$villageCache[$cacheKey] = $village;
        }

        return $village;
    }

    protected function getRawAttributeValue(string $key): ?string
    {
        $value = $this->attributes[$key] ?? null;

        return $value !== null ? (string) $value : null;
    }

    protected function normalizeCityName(string $value): string
    {
        $normalized = strtolower(trim($value));

        if (Str::startsWith($normalized, 'kota ')) {
            return trim(substr($normalized, 5));
        }

        if (Str::startsWith($normalized, 'kabupaten ')) {
            return trim(substr($normalized, 9));
        }

        return $normalized;
    }
}
