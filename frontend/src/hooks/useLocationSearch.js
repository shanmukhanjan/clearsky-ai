import { useState, useCallback, useRef } from 'react';

// In-memory cache keyed by lowercase query
const resultCache = new Map();

/**
 * Hook that fetches location suggestions directly from Nominatim (OSM).
 * Nominatim supports CORS (Access-Control-Allow-Origin: *) so browser can call it directly.
 * Falls back to backend /api/aqi/search if direct call fails.
 */
export function useLocationSearch() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortRef = useRef(null);
    const debounceRef = useRef(null);

    const search = useCallback((query) => {
        // Cancel any pending debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query || query.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        const q = query.trim().toLowerCase();

        // Return cached result immediately
        if (resultCache.has(q)) {
            setResults(resultCache.get(q));
            return;
        }

        debounceRef.current = setTimeout(async () => {
            // Cancel any in-flight request
            if (abortRef.current) abortRef.current.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setLoading(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1&accept-language=en`,
                    {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'ClearSkyAI/2.0',
                            'Accept-Language': 'en',
                        },
                    }
                );

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                const seen = new Set();
                const mapped = [];

                for (const item of data) {
                    const addr = item.address || {};
                    const city =
                        addr.city || addr.town || addr.village ||
                        addr.suburb || addr.county || addr.municipality ||
                        addr.district || addr.state || item.name || q;
                    const country = addr.country || '';
                    const key = `${city.toLowerCase()}|${country.toLowerCase()}`;
                    if (seen.has(key)) continue;
                    seen.add(key);

                    mapped.push({
                        city,
                        state: addr.state || null,
                        country: country || null,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                    });

                    if (mapped.length >= 6) break;
                }

                if (!controller.signal.aborted) {
                    resultCache.set(q, mapped);
                    setResults(mapped);
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                // Fallback: try our own backend
                try {
                    const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://clearsky-ai.onrender.com';
                    const cleanBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
                    const backendUrl = `${cleanBaseUrl}/aqi/search?q=${encodeURIComponent(q)}`;
                    const res2 = await fetch(backendUrl, { signal: controller.signal });
                    if (res2.ok) {
                        const data2 = await res2.json();
                        const list = Array.isArray(data2) ? data2 : [];
                        if (!controller.signal.aborted) {
                            resultCache.set(q, list);
                            setResults(list);
                        }
                    } else {
                        setResults([]);
                    }
                } catch {
                    if (!controller.signal.aborted) setResults([]);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 300);
    }, []);

    const clear = useCallback(() => {
        setResults([]);
        if (abortRef.current) abortRef.current.abort();
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    return { results, loading, search, clear };
}
