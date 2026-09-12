/**
 * Location, on the user's terms.
 *
 * - Nothing is read until the user clicks Approve on a consent panel that
 *   says exactly what will be shared.
 * - Coordinates are rounded to two decimals (~1 km) before they are stored or
 *   sent anywhere. Full precision never leaves the geolocation callback.
 * - The label comes from OpenStreetMap's reverse geocoder using the coarse
 *   point. If that fails, the coarse coordinates are the label.
 * - Revoking deletes it from the vault. Exa searches only use it while it exists.
 */
import type { UserLocation } from "./user-bio";

export const LOCATION_CONSENT_TEXT = [
  "Your browser will be asked for your position once.",
  "Internet U rounds it to about 1 km before storing it in your vault.",
  "It is used only to ground the web searches you run (\"near Louisville, KY\") and is shown on every search that uses it.",
  "You can revoke it here at any time and it is deleted from the vault.",
];

function coarse(n: number): number {
  return Math.round(n * 100) / 100;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address || {};
    const place = a.city || a.town || a.village || a.county || a.municipality;
    const region = a.state || a.region || a.country;
    if (place && region) return `${place}, ${region}`;
    return place || region || null;
  } catch {
    return null;
  }
}

export async function requestCoarseLocation(): Promise<UserLocation> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("This browser does not expose geolocation.");
  }
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 })
  );
  const lat = coarse(pos.coords.latitude);
  const lng = coarse(pos.coords.longitude);
  const label = (await reverseGeocode(lat, lng)) || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  return { label, lat, lng, precision: "coarse", grantedAt: new Date().toISOString() };
}

/** Append the location to a search query, visibly, so the grounding is auditable. */
export function localizeQuery(query: string, location: UserLocation | null): string {
  if (!location) return query;
  const q = query.trim();
  if (q.toLowerCase().includes(location.label.toLowerCase())) return q;
  return `${q} near ${location.label}`;
}
