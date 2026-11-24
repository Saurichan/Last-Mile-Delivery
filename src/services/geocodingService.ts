export interface GeocodingResult {
  placeId: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

const geocodeCache = new Map<string, GeocodingResult[]>();

/**
 * Searches for addresses using OpenStreetMap Nominatim with debouncing & caching
 */
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const cacheKey = trimmed.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const hasTumakuru = /tumakuru|tumkur/i.test(trimmed);
    const searchQuery = hasTumakuru ? trimmed : `${trimmed}, Tumakuru, Karnataka`;
    const encoded = encodeURIComponent(searchQuery);
    // Focus search exclusively to Tumakuru and surrounding region in Karnataka, India
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&viewbox=77.00,13.45,77.22,13.25&limit=6&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);

    const data = await res.json();
    const results: GeocodingResult[] = data.map((item: any) => ({
      placeId: String(item.place_id),
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || 'address',
    }));

    geocodeCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.warn('Geocoding service error:', err);
    return [];
  }
}

/**
 * Reverse geocodes coordinates into an address string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `Pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
