import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RotateCcw, X } from 'lucide-react';
import type { LatLng } from '../../utils/navigation';

// Internal, in-app interactive map for facility navigation. Renders inside
// the Seva Health page (Leaflet + OpenStreetMap tiles) - never redirects to
// an external maps site. Emoji div-icons are used for markers instead of
// Leaflet's default marker images, which avoids the well-known bundler
// asset-path issue and matches the app's existing pin styling elsewhere.
const patientIcon = L.divIcon({
  html: '<div style="width:34px;height:34px;border-radius:50%;background:#2563eb;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(37,99,235,0.45);border:2px solid #fff;font-size:16px;">📍</div>',
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const facilityIcon = L.divIcon({
  html: '<div style="width:38px;height:38px;border-radius:50%;background:#0d9488;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(13,148,136,0.45);border:2px solid #fff;font-size:18px;">🏥</div>',
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

export const FacilityNavigationMap: React.FC<{
  facility: LatLng & { name: string };
  patient: LatLng | null;
  routeGeometry: [number, number][] | null;
  onStop: () => void;
}> = ({ facility, patient, routeGeometry, onStop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const facilityMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = L.latLngBounds([[facility.lat, facility.lng]]);
    if (patient) bounds.extend([patient.lat, patient.lng]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  };

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [facility.lat, facility.lng],
      zoom: 13,
      zoomControl: true
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    facilityMarkerRef.current = L.marker([facility.lat, facility.lng], { icon: facilityIcon })
      .addTo(map)
      .bindPopup(facility.name);

    return () => {
      map.remove();
      mapRef.current = null;
      patientMarkerRef.current = null;
      facilityMarkerRef.current = null;
      routeLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the facility marker if the booked facility itself ever changes.
  useEffect(() => {
    facilityMarkerRef.current?.setLatLng([facility.lat, facility.lng]);
  }, [facility.lat, facility.lng]);

  // Keep the patient marker in sync with live location updates.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!patient) {
      if (patientMarkerRef.current) {
        patientMarkerRef.current.remove();
        patientMarkerRef.current = null;
      }
      return;
    }

    if (!patientMarkerRef.current) {
      patientMarkerRef.current = L.marker([patient.lat, patient.lng], { icon: patientIcon })
        .addTo(map)
        .bindPopup('Your current location');
      recenter();
    } else {
      patientMarkerRef.current.setLatLng([patient.lat, patient.lng]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.lat, patient?.lng]);

  // Draw (or clear) the road-following route line.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (routeGeometry && routeGeometry.length > 1) {
      routeLineRef.current = L.polyline(routeGeometry, { color: '#0d9488', weight: 5, opacity: 0.85 }).addTo(map);
    } else if (patient) {
      // Real road route unavailable: draw a clearly-dashed straight line
      // instead of pretending it is a routed path.
      routeLineRef.current = L.polyline(
        [[patient.lat, patient.lng], [facility.lat, facility.lng]],
        { color: '#94a3b8', weight: 3, dashArray: '6 8' }
      ).addTo(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeGeometry, patient?.lat, patient?.lng]);

  return (
    <div style={{ position: 'relative', borderRadius: '0.85rem', overflow: 'hidden', border: '1.5px solid #e2e8f0', minHeight: '340px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '340px' }} />

      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 1000 }}>
        <button
          type="button"
          onClick={recenter}
          aria-label="Recenter map"
          title="Recenter"
          style={{
            width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1',
            background: '#ffffff', color: '#334155', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          <RotateCcw size={17} />
        </button>
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop navigation"
          title="Stop Navigation"
          style={{
            width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #fca5a5',
            background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
};

export default FacilityNavigationMap;
