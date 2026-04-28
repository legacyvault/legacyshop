import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { MapLayerMouseEvent, MapRef, Marker } from 'react-map-gl/maplibre';

type LatLng = { lat: number; lng: number };
type Picked = LatLng & { address?: string; featureId?: string };

type Props = {
    value?: Picked;
    onChange?: (v: Picked) => void;
    initialCenter?: LatLng; // default Jakarta
    zoom?: number;
    className?: string;
    country?: string | string[]; // e.g., 'ID' or ['ID']
    language?: string; // e.g., 'id'
};

export default function MapLibreLocationPicker({
    value,
    onChange,
    initialCenter = { lat: -6.2, lng: 106.816666 },
    zoom = 18,
    className = 'relative min-h-[420px] w-full',
    country,
    language = 'id',
}: Props) {
    const key = import.meta.env.VITE_MAPTILER_KEY as string | undefined;

    // Bug fix: guard against missing API key — show a clear error instead of a
    // broken blank map with silent 401 failures everywhere.
    if (!key) {
        return (
            <div className={cn('flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-sm text-red-600', className)}>
                Map API key is not configured. Please set <code className="mx-1 font-mono">VITE_MAPTILER_KEY</code> in your environment.
            </div>
        );
    }

    const [coords, setCoords] = useState<LatLng>(value ?? initialCenter);
    const [address, setAddress] = useState<string>(value?.address ?? '');
    const [featureId, setFeatureId] = useState<string | undefined>(value?.featureId);
    const [query, setQuery] = useState<string>('');
    const [openList, setOpenList] = useState(false);
    const [suggestions, setSuggestions] = useState<{ id: string; label: string; lat: number; lng: number }[]>([]);
    const [geoError, setGeoError] = useState<string | null>(null);

    const mapRef = useRef<MapRef | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);

    // Browser-side cache for reverse geocode results keyed by "lat4,lng4"
    // (4 decimal places ≈ 11 m precision — good enough to avoid duplicate API
    // calls when the user barely moves the pin).
    // NOTE: Using a plain Record instead of Map to avoid a name collision with the
    // react-map-gl/maplibre default export which is also called "Map".
    const geocodeCache = useRef<Record<string, { address: string; featureId?: string }>>({});

    const flyTo = useCallback((ll: { lat: number; lng: number }, z = 18) => {
        mapRef.current?.getMap().flyTo({
            center: [ll.lng, ll.lat],
            zoom: z,
            essential: true,
            duration: 800,
        });
    }, []);

    // emit up
    const emit = useCallback((v: Picked) => onChange?.(v), [onChange]);

    // Map style from MapTiler
    const mapStyle = useMemo(() => `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`, [key]);

    useEffect(() => {
        if (!value) return;
        setCoords((prev) => {
            if (prev.lat === value.lat && prev.lng === value.lng) {
                return prev;
            }
            return { lat: value.lat, lng: value.lng };
        });
        if (value.address !== undefined) {
            setAddress(value.address);
        }
        setFeatureId(value.featureId);
    }, [value]);

    // --- Geocoding helpers (MapTiler Geocoding API) ---
    const forwardGeocode = useCallback(
        async (q: string) => {
            if (!q.trim()) return [];
            const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json`);
            url.searchParams.set('key', key);
            url.searchParams.set('limit', '5');
            url.searchParams.set('language', language);
            url.searchParams.set('proximity', `${coords.lng},${coords.lat}`);

            // Bug fix: restrict search results to the user's country when provided,
            // so Indonesian users don't get results from other countries.
            if (country) {
                const countryList = Array.isArray(country) ? country.join(',') : country;
                url.searchParams.set('country', countryList.toLowerCase());
            }

            const res = await fetch(url.toString());
            const data = await res.json();
            const list = (data?.features ?? [])
                .map((f: any) => {
                    const coords = f.center ?? f.geometry?.coordinates; // [lng, lat]
                    const label = f.place_name ?? f.properties?.label ?? f.text ?? f.name ?? 'Unknown';
                    return {
                        id: f.id ?? f.properties?.id ?? label,
                        label,
                        lng: coords?.[0],
                        lat: coords?.[1],
                    };
                })
                .filter((x: any) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
            return list as { id: string; label: string; lat: number; lng: number }[];
        },
        [key, language, coords, country],
    );

    // Nominatim reverse geocode — used only as a silent fallback when MapTiler
    // fails (rate limit / quota exhausted). We do NOT use Nominatim for
    // autocomplete/search because their usage policy forbids it and the
    // single-request-per-second global limit would cause queue pile-ups.
    const nominatimReverseGeocode = useCallback(async ({ lat, lng }: LatLng): Promise<string> => {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('lat', String(lat));
        url.searchParams.set('lon', String(lng));
        url.searchParams.set('format', 'jsonv2');
        if (language) url.searchParams.set('accept-language', language);

        const res = await fetch(url.toString(), {
            headers: {
                // Nominatim policy requires a descriptive User-Agent with contact info.
                'User-Agent': 'MapLocationPicker/1.0 (fallback; contact: admin)',
            },
        });
        if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
        const data = await res.json();
        return (data?.display_name as string) ?? '';
    }, [language]);

    // reverseGeocode checks the browser cache first, then calls MapTiler, and
    // falls back to Nominatim if MapTiler fails (quota / network error). Coords
    // are always emitted so the form is never left with empty lat/lng.
    const reverseGeocode = useCallback(
        async ({ lat, lng }: LatLng) => {
            // Cache key at 4 dp ≈ 11 m — tight enough to be useful, loose enough
            // that tiny jitter from dragging doesn't always bypass the cache.
            const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
            const cached = geocodeCache.current[cacheKey];

            if (cached) {
                setAddress(cached.address);
                setFeatureId(cached.featureId);
                emit({ lat, lng, address: cached.address, featureId: cached.featureId });
                return;
            }

            let label = '';
            let fid: string | undefined;

            try {
                const url = new URL(`https://api.maptiler.com/geocoding/${lng},${lat}.json`);
                url.searchParams.set('key', key);
                url.searchParams.set('language', language);
                const res = await fetch(url.toString());

                if (!res.ok) {
                    throw new Error(`MapTiler geocoding returned ${res.status}`);
                }

                const data = await res.json();
                const top = data?.features?.[0];
                label = top?.place_name ?? top?.properties?.label ?? '';
                fid = top?.id ?? top?.properties?.id;
            } catch (mapTilerErr) {
                console.warn('[MapLocationPicker] MapTiler reverseGeocode failed, trying Nominatim fallback:', mapTilerErr);

                try {
                    label = await nominatimReverseGeocode({ lat, lng });
                } catch (nominatimErr) {
                    // Both providers failed — coords still saved, address left blank.
                    console.warn('[MapLocationPicker] Nominatim fallback also failed:', nominatimErr);
                }
            }

            // Store result (even empty string) so we don't call the API twice
            // for the same spot during the same session.
            geocodeCache.current[cacheKey] = { address: label, featureId: fid };

            setAddress(label);
            setFeatureId(fid);
            emit({ lat, lng, address: label, featureId: fid });
        },
        [key, language, emit, nominatimReverseGeocode],
    );

    // --- Autocomplete (debounced) ---
    useEffect(() => {
        const t = setTimeout(async () => {
            if (!query.trim()) {
                setSuggestions([]);
                setOpenList(false);
                return;
            }
            try {
                const list = await forwardGeocode(query);
                setSuggestions(list);
            } catch {
                // noop
            }
        }, 200);
        return () => clearTimeout(t);
    }, [query, forwardGeocode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setOpenList(false);
            }
        };

        if (openList) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openList]);

    const chooseSuggestion = (s: { id: string; label: string; lat: number; lng: number }) => {
        const ll = { lat: s.lat, lng: s.lng };
        setCoords(ll);
        setAddress(s.label);
        setFeatureId(s.id);
        setQuery(s.label);
        setOpenList(false);
        emit({ ...ll, address: s.label, featureId: s.id });
        flyTo(ll);
    };

    // Map interactions
    const onMapClick = (e: MapLayerMouseEvent) => {
        const ll = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setCoords(ll);
        reverseGeocode(ll);
        flyTo(ll, 16);
    };

    const onMarkerDragEnd = (e: any) => {
        const ll = { lat: e.lngLat.lat, lng: e.lngLat.lng };
        setCoords(ll);
        reverseGeocode(ll);
    };

    // Bug fix: added error callback to getCurrentPosition. Previously, if the user
    // denied geolocation permission or the browser timed out, nothing happened at all —
    // no feedback, the button appeared broken. Now shows an inline error message.
    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            return;
        }
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCoords(ll);
                reverseGeocode(ll);
                flyTo(ll);
            },
            (err) => {
                const messages: Record<number, string> = {
                    1: 'Location access was denied. Please allow location access in your browser settings.',
                    2: 'Your location could not be determined. Please pin manually.',
                    3: 'Location request timed out. Please pin manually.',
                };
                setGeoError(messages[err.code] ?? 'Failed to get your location. Please pin manually.');
            },
            { timeout: 10000 },
        );
    };

    return (
        <div className={cn('relative h-full w-full rounded-lg border border-gray-200 bg-white shadow-sm', className)}>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-4">
                <div className="pointer-events-auto w-full max-w-2xl rounded-md border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div ref={searchContainerRef} className="relative flex-1">
                            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <Input
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setOpenList(true);
                                }}
                                onFocus={() => setOpenList(true)}
                                placeholder="Search location"
                                className="pl-9"
                            />
                            {openList && suggestions.length > 0 && (
                                <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-20 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => chooseSuggestion(suggestion)}
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            {suggestion.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
                            Use my location
                        </Button>
                    </div>
                    {geoError && (
                        <p className="mt-2 text-xs text-red-500">{geoError}</p>
                    )}
                </div>
            </div>

            <Map
                ref={mapRef}
                initialViewState={{ latitude: coords.lat, longitude: coords.lng, zoom }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                onClick={onMapClick}
            >
                <Marker latitude={coords.lat} longitude={coords.lng} draggable onDragEnd={onMarkerDragEnd} />
            </Map>

            {address && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4">
                    <div className="pointer-events-auto w-full max-w-2xl rounded-md border border-gray-200 bg-white/95 p-4 text-sm shadow-sm backdrop-blur">
                        <div className="grid hidden gap-4 text-sm text-gray-700 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Latitude</p>
                                <p className="mt-1 text-base font-semibold text-gray-900">{coords.lat.toFixed(6)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Longitude</p>
                                <p className="mt-1 text-base font-semibold text-gray-900">{coords.lng.toFixed(6)}</p>
                            </div>
                        </div>
                        <div className="border-gray-100 text-sm text-gray-600">
                            <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">Nearest address</p>
                            <p className="mt-1 text-gray-700">{address}</p>
                        </div>
                        {featureId && <p className="mt-3 hidden text-xs text-gray-400">featureId: {featureId}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
