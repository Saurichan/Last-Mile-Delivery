import { DistanceTimeMatrix } from '../types';

// In-memory cache for matrix and geometry calculations to avoid duplicate calls
const matrixCache = new Map<string, DistanceTimeMatrix>();
const geometryCache = new Map<string, [number, number][]>();

/**
 * Calculates Haversine great-circle distance between two points in km
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates an estimated distance and duration matrix using Haversine
 * with urban tortuosity (1.35x) and 25 km/h avg city speed
 */
export function generateHaversineMatrix(
  coords: { lat: number; lng: number }[]
): DistanceTimeMatrix {
  const n = coords.length;
  const distances: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const durations: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  const TORTUOSITY_FACTOR = 1.35; // Urban road network factor
  const AVG_URBAN_SPEED_KMH = 26; // 26 km/h in city traffic

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
        durations[i][j] = 0;
      } else {
        const straightKm = calculateHaversineDistance(
          coords[i].lat,
          coords[i].lng,
          coords[j].lat,
          coords[j].lng
        );
        const roadDistKm = Number((straightKm * TORTUOSITY_FACTOR).toFixed(2));
        const travelTimeMin = Number(((roadDistKm / AVG_URBAN_SPEED_KMH) * 60).toFixed(1));
        
        distances[i][j] = roadDistKm;
        durations[i][j] = Math.max(1, travelTimeMin);
      }
    }
  }

  return {
    distances,
    durations,
    sources: coords,
    destinations: coords,
    isRoadMatrix: false,
  };
}

/**
 * Fetches real road distance and time matrix using OSRM Table API,
 * with graceful fallback to Haversine straight-line estimation.
 */
export async function getDistanceTimeMatrix(
  coords: { lat: number; lng: number }[]
): Promise<DistanceTimeMatrix> {
  if (coords.length <= 1) {
    return {
      distances: [[0]],
      durations: [[0]],
      sources: coords,
      destinations: coords,
      isRoadMatrix: true,
    };
  }

  // Generate cache key
  const cacheKey = coords.map((c) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`).join(';');
  if (matrixCache.has(cacheKey)) {
    return matrixCache.get(cacheKey)!;
  }

  // If coordinates list is large (> 70) or offline, avoid overloading public OSRM
  if (coords.length > 70) {
    const fallback = generateHaversineMatrix(coords);
    matrixCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const coordinatesString = coords.map((c) => `${c.lng},${c.lat}`).join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${coordinatesString}?annotations=distance,duration`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM Table API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.distances || !data.durations) {
      throw new Error(`OSRM Table API error: ${data.message || 'No matrix data'}`);
    }

    // Convert meters to km and seconds to minutes
    const distances: number[][] = data.distances.map((row: number[]) =>
      row.map((meters: number) => Number((meters / 1000).toFixed(2)))
    );

    const durations: number[][] = data.durations.map((row: number[]) =>
      row.map((seconds: number) => Number((seconds / 60).toFixed(1)))
    );

    const result: DistanceTimeMatrix = {
      distances,
      durations,
      sources: coords,
      destinations: coords,
      isRoadMatrix: true,
    };

    matrixCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('OSRM Matrix API unavailable or timed out. Using high-precision urban Haversine fallback:', error);
    const fallback = generateHaversineMatrix(coords);
    matrixCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Fetches road polyline geometry using OSRM Route API for map rendering
 */
export async function getRouteGeometry(
  coords: { lat: number; lng: number }[]
): Promise<[number, number][]> {
  if (coords.length < 2) {
    return coords.map((c) => [c.lat, c.lng]);
  }

  const cacheKey = coords.map((c) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`).join(';');
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!;
  }

  try {
    const coordinatesString = coords.map((c) => `${c.lng},${c.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM Route API returned ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
      // GeoJSON is [lng, lat], Leaflet polyline expects [lat, lng]
      const geometry: [number, number][] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      geometryCache.set(cacheKey, geometry);
      return geometry;
    }
    throw new Error('No route geometry returned');
  } catch (err) {
    console.warn('OSRM Route geometry unavailable. Falling back to direct waypoint sequence:', err);
    const directLine: [number, number][] = coords.map((c) => [c.lat, c.lng]);
    geometryCache.set(cacheKey, directLine);
    return directLine;
  }
}
