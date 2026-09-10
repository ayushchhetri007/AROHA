// Shared helpers for the internal Live Facility Navigation feature:
// distance/duration math and formatting only - no map or React code here.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  /** Road-following geometry from the routing provider, [lat, lng] pairs. */
  geometry: [number, number][];
}

/**
 * Great-circle ("as the crow flies") distance between two points, in km.
 * Used only as a fallback when real road routing is unavailable - the
 * result must always be labeled as an estimate, never presented as a route.
 */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
  return R * c;
}

const AVG_FALLBACK_SPEED_KMH = 30;

/** Straight-line distance + a rough duration estimate, for when routing fails. */
export function fallbackEstimate(a: LatLng, b: LatLng): { distanceKm: number; durationSeconds: number } {
  const distanceKm = haversineDistanceKm(a, b);
  const durationSeconds = Math.max(60, Math.round((distanceKm / AVG_FALLBACK_SPEED_KMH) * 3600));
  return { distanceKm, durationSeconds };
}

/**
 * Queries the free, keyless OSRM public routing API for a real road route
 * between two points. Returns null (never throws) if the request fails so
 * callers can fall back to the labeled straight-line estimate.
 */
export async function fetchRoadRoute(origin: LatLng, destination: LatLng): Promise<RouteResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route || typeof route.distance !== 'number' || typeof route.duration !== 'number') return null;

    const geometry: [number, number][] = (route.geometry?.coordinates || []).map(
      (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat] -> Leaflet wants [lat, lng]
    );

    return { distanceMeters: route.distance, durationSeconds: route.duration, geometry };
  } catch {
    return null;
  }
}

/**
 * Formats a duration in seconds as a human-readable string, adapting the
 * unit granularity to the magnitude of the value:
 *  - under 60s:      "45 sec"
 *  - under 60min:    "14 min 32 sec"
 *  - 60min or more:  "1 hr 12 min 45 sec"
 * When `hasSeconds` is false (provider only gave minute-level precision),
 * the seconds component is omitted rather than invented.
 */
export function formatDuration(totalSeconds: number, hasSeconds = true): string {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (!hasSeconds) {
    const roundedMins = Math.max(1, Math.round(rounded / 60));
    const h = Math.floor(roundedMins / 60);
    const m = roundedMins % 60;
    if (h > 0) return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
    return `${m} min`;
  }

  if (rounded < 60) return `${rounded} sec`;
  if (hrs === 0) return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
  const parts = [`${hrs} hr`];
  if (mins > 0) parts.push(`${mins} min`);
  if (secs > 0) parts.push(`${secs} sec`);
  return parts.join(' ');
}

/** Formats a distance in metres as "4.8 km" or "320 m" for short hops. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
