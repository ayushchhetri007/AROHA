import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw } from 'lucide-react';

// Real, geographically accurate map (Leaflet + OpenStreetMap tiles) for the
// Public Healthcare Facilities Directory's Map View. Replaces the previous
// decorative "radar" panel with actual facility coordinates plotted on
// actual geography - never a fake India graphic or randomly placed pins.

const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const INDIA_ZOOM = 5;

const TYPE_COLORS: Record<string, string> = {
  'Sub-Centre': '#d97706',
  PHC: '#0d9488',
  CHC: '#0d9488',
  'Rural Hospital': '#4f46e5',
  'Sub-District Hospital': '#7c3aed',
  'District Hospital': '#dc2626'
};

function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

function createFacilityIcon(type: string, emergency: boolean): L.DivIcon {
  const color = TYPE_COLORS[type] || '#0d9488';
  return L.divIcon({
    html: `
      <div style="position:relative;width:32px;height:32px;">
        <div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.35);border:2px solid #fff;font-size:15px;">🏥</div>
        ${emergency ? '<div style="position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:#dc2626;border:2px solid #fff;"></div>' : ''}
      </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

// Builds the marker popup as plain DOM nodes (Leaflet popups live outside
// React's tree), wiring the same View Details action used elsewhere in the
// directory - no duplicate facility data, just real data rendered into a
// small card.
function buildPopupContent(
  facility: any,
  onViewDetails: (id: string) => void
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'min-width:220px;font-family:inherit;';

  const badge = document.createElement('span');
  badge.textContent = facility.type;
  badge.style.cssText = 'display:inline-block;background:#ccfbf1;color:#0f766e;font-size:11px;font-weight:700;padding:2px 8px;border-radius:9999px;margin-bottom:5px;';
  wrap.appendChild(badge);

  const title = document.createElement('div');
  title.textContent = facility.name;
  title.style.cssText = 'font-weight:800;font-size:14px;color:#0f172a;margin-bottom:4px;';
  wrap.appendChild(title);

  if (facility.address) {
    const addr = document.createElement('div');
    addr.textContent = `📍 ${facility.address}`;
    addr.style.cssText = 'font-size:12px;color:#64748b;margin-bottom:6px;line-height:1.4;';
    wrap.appendChild(addr);
  }

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:6px;margin-top:6px;';

  const detailsBtn = document.createElement('button');
  detailsBtn.type = 'button';
  detailsBtn.textContent = 'View Details';
  detailsBtn.style.cssText = 'flex:1;padding:6px 8px;border-radius:6px;border:1px solid #cbd5e1;background:#ffffff;color:#334155;font-size:12px;font-weight:700;cursor:pointer;';
  detailsBtn.onclick = () => onViewDetails(facility.id);
  btnRow.appendChild(detailsBtn);

  wrap.appendChild(btnRow);
  return wrap;
}

export const FacilityMapView: React.FC<{
  facilities: any[];
  onViewDetails: (id: string) => void;
  focusedFacilityId?: string | null;
}> = ({ facilities, onViewDetails, focusedFacilityId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  // Tracks whether markers have already been plotted once, so the very
  // first paint stays at the India-level overview instead of immediately
  // zooming into whichever district happens to be the default filter.
  const hasPlottedOnceRef = useRef(false);

  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);

  // Initialize the map ONCE per retry. The map/layer-group instance is not
  // recreated on Refresh - only its marker contents are updated (see the
  // effect below), so zoom/position are preserved across refreshes.
  useEffect(() => {
    if (!containerRef.current) return;
    setMapStatus('loading');
    hasPlottedOnceRef.current = false;

    try {
      const map = L.map(containerRef.current, {
        center: INDIA_CENTER,
        zoom: INDIA_ZOOM,
        zoomControl: true
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);

      setMapStatus('ready');
    } catch (err) {
      console.error('Failed to initialize facility map:', err);
      setMapStatus('error');
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      markersRef.current.clear();
    };
  }, [retryKey]);

  // Re-plot markers whenever the filtered facility list changes (search,
  // district, type, emergency filters, or Refresh all flow through here
  // since they all update the same `facilities` array/reference). This does
  // NOT depend on `mapStatus` - the map and layer group are created
  // synchronously above, so a Refresh click always updates markers even if
  // background tile images are still loading.
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    markersRef.current.clear();

    const validFacilities = facilities.filter((f) => isValidCoordinate(f.latitude, f.longitude));

    validFacilities.forEach((f) => {
      const marker = L.marker([f.latitude, f.longitude], {
        icon: createFacilityIcon(f.type, f.emergency_24x7 === 1)
      });
      marker.bindPopup(buildPopupContent(f, onViewDetails));
      layerGroup.addLayer(marker);
      markersRef.current.set(f.id, marker);
    });

    // If a specific facility is focused for in-app directions, focus directly on it
    if (focusedFacilityId) {
      const target = validFacilities.find((f) => f.id === focusedFacilityId);
      if (target) {
        map.setView([target.latitude, target.longitude], 15, { animate: true });
        const marker = markersRef.current.get(focusedFacilityId);
        if (marker) {
          setTimeout(() => marker.openPopup(), 200);
        }
        hasPlottedOnceRef.current = true;
        return;
      }
    }

    // Keep the very first paint at the India-level overview; only fit to
    // results once the user has actually changed a filter/search/refresh.
    if (hasPlottedOnceRef.current && validFacilities.length > 0) {
      const bounds = L.latLngBounds(validFacilities.map((f) => [f.latitude, f.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
    hasPlottedOnceRef.current = true;
  }, [facilities, onViewDetails, focusedFacilityId]);

  // If focusedFacilityId changes while map is already ready, pan to it
  useEffect(() => {
    if (!focusedFacilityId || !mapRef.current) return;
    const target = facilities.find((f) => f.id === focusedFacilityId);
    if (target && isValidCoordinate(target.latitude, target.longitude)) {
      mapRef.current.setView([target.latitude, target.longitude], 15, { animate: true });
      const marker = markersRef.current.get(focusedFacilityId);
      if (marker) {
        setTimeout(() => marker.openPopup(), 200);
      }
    }
  }, [focusedFacilityId, facilities]);

  const invalidCount = facilities.length - facilities.filter((f) => isValidCoordinate(f.latitude, f.longitude)).length;

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '520px' }} />

      {mapStatus === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
          Loading map...
        </div>
      )}

      {mapStatus === 'error' && (
        <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#991b1b', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', padding: '1rem' }}>
          <span>Unable to load map.</span>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0d9488', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      )}

      {invalidCount > 0 && (
        <div style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#b45309', background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
          {invalidCount} {invalidCount === 1 ? 'facility does' : 'facilities do'} not have map coordinates and {invalidCount === 1 ? 'is' : 'are'} not shown on the map. They remain available in List View.
        </div>
      )}
    </div>
  );
};

export default FacilityMapView;
