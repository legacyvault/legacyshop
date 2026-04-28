<?php

namespace App\Http\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GeoIpTrait — shared IP-to-country resolution for all controllers.
 *
 * Why a trait:
 *   Multiple controllers (Carts, Misc, Order, Product, User, View) all need to
 *   know whether the current visitor is in Indonesia to apply correct pricing,
 *   shipping options, and field validation. The naive implementation was copied
 *   and pasted into each controller with three recurring bugs:
 *     1. Reading the spoofable X-Forwarded-For header directly.
 *     2. No HTTP timeout — ip-api.com timeouts caused 30-second request hangs.
 *     3. No caching — every page load hit ip-api.com's free quota; bot traffic
 *        with forged IPs drained the quota and blocked real users.
 *
 * Usage:
 *   use App\Http\Traits\GeoIpTrait;
 *   class MyController extends Controller {
 *       use GeoIpTrait;
 *       ...
 *       $countryCode  = $this->resolveCountryCodeFromIp($request); // e.g. 'ID', 'US', null
 *       $isIndonesian = $countryCode === 'ID';
 *   }
 */
trait GeoIpTrait
{
    /**
     * Return the real client IP.
     *
     * SECURITY: Never read X-Forwarded-For directly — it is a user-controlled
     * header and trivially spoofable. $request->ip() honours the header only
     * when the request comes from a configured trusted proxy.
     *
     * Configure trusted proxies in config/trustedproxies.php or via the
     * TRUSTED_PROXIES env variable if you run behind a load-balancer / CDN.
     */
    protected function getClientIp(Request $request): string
    {
        // Fixed Indonesian IP in local dev for reproducible tests.
        if (env('APP_ENV') === 'local') {
            return '36.84.152.11';
        }

        return $request->ip();
    }

    /**
     * Resolve the ISO-3166 country code for the current request via ip-api.com.
     *
     * Returns null when the lookup fails so callers can handle the absence
     * gracefully instead of silently assuming a default country.
     *
     * Results are cached per unique IP for 24 hours. This eliminates:
     *   - Repeated lookups for the same user across page loads.
     *   - Bot traffic with forged IPs burning through the free-plan quota.
     *   - Retry storms when ip-api.com is rate-limiting (null is cached too).
     */
    protected function resolveCountryCodeFromIp(Request $request): ?string
    {
        $ip = $this->getClientIp($request);

        return Cache::remember("geo_ip:{$ip}", now()->addHours(24), function () use ($ip) {
            try {
                $response = Http::timeout(5)->get(
                    "http://ip-api.com/json/{$ip}?fields=status,countryCode"
                );
                $data = $response->json();

                if (isset($data['status']) && $data['status'] !== 'fail') {
                    return strtoupper($data['countryCode'] ?? '') ?: null;
                }
            } catch (\Exception $e) {
                Log::warning("[GeoIpTrait] IP geo-lookup failed for {$ip}: " . $e->getMessage());
            }

            // Cache null so failing IPs are not retried on every request.
            return null;
        });
    }
}
