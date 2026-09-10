import React, { useState, useEffect, useCallback } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  ArrowLeft, Search, RefreshCw, MapPin, Building2, Pill, Stethoscope, Users,
  Bed, FlaskConical, Siren, Package, Phone, Navigation,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';

type SearchType = 'medicine' | 'equipment' | 'specialist' | 'service';

// Small icon+text availability indicator - never color-only, for accessibility.
const StatusBadge: React.FC<{ status: 'available' | 'low' | 'unavailable'; label?: string }> = ({ status, label }) => {
  const config = {
    available: { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', text: label || 'Available' },
    low: { icon: AlertTriangle, color: '#b45309', bg: '#fffbeb', text: label || 'Low Stock' },
    unavailable: { icon: XCircle, color: '#dc2626', bg: '#fef2f2', text: label || 'Not Available' }
  }[status];
  const Icon = config.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '6px', background: config.bg, color: config.color, fontSize: '0.78rem', fontWeight: 700 }}>
      <Icon size={13} /> {config.text}
    </span>
  );
};

function medicineStatus(status: string): 'available' | 'low' | 'unavailable' {
  if (status === 'out_of_stock') return 'unavailable';
  if (status === 'low_stock') return 'low';
  return 'available';
}

function formatTimestamp(ts?: string | null): string {
  if (!ts) return 'Update time unavailable';
  const d = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return 'Update time unavailable';
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return isToday ? `Today, ${time}` : `${d.toLocaleDateString()}, ${time}`;
}

export const Inventory: React.FC = () => {
  const { currentUser, setCurrentView, pendingInventoryFacilityId, setPendingInventoryFacilityId } = useDemo();

  const [mode, setMode] = useState<'browse' | 'search'>('browse');

  // Browse-by-facility state (reuses the same facility API as Find Nearby Facility)
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Selected facility inventory
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [inventoryData, setInventoryData] = useState<any | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullInventory, setShowFullInventory] = useState(false);

  // Search-by-requirement state ("find a facility that has this")
  const [searchType, setSearchType] = useState<SearchType>('medicine');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchRan, setSearchRan] = useState(false);

  const fetchFacilities = useCallback(async () => {
    setFacilitiesLoading(true);
    try {
      const data = await api.getFacilities({
        district: districtFilter || undefined,
        type: typeFilter || undefined,
        search: searchTerm || undefined
      });
      setFacilities(data);
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setFacilitiesLoading(false);
    }
  }, [districtFilter, typeFilter, searchTerm]);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  useEffect(() => {
    api.getFacilities({}).then((data: any[]) => {
      setAvailableDistricts(Array.from(new Set(data.map((f) => f.district).filter(Boolean))).sort());
    }).catch((err) => console.error('Failed to load district list:', err));
  }, []);

  const loadInventory = useCallback(async (facilityId: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) { setInventoryLoading(true); setInventoryError(null); }
    else { setRefreshing(true); }
    try {
      const data = await api.getFacilityById(facilityId);
      setInventoryData(data);
      if (opts?.silent) setInventoryError(null);
    } catch (err) {
      console.error('Failed to load facility inventory:', err);
      if (opts?.silent) setInventoryError('Unable to refresh facility inventory. Please try again.');
      else setInventoryError('Unable to load facility inventory. Please try again.');
    } finally {
      if (!opts?.silent) setInventoryLoading(false); else setRefreshing(false);
    }
  }, []);

  const selectFacility = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setShowFullInventory(false);
    loadInventory(facilityId);
  };

  // Deep-link hand-off from Find Nearby Facility's "View Inventory" action.
  useEffect(() => {
    if (pendingInventoryFacilityId) {
      selectFacility(pendingInventoryFacilityId);
      setPendingInventoryFacilityId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInventoryFacilityId]);

  const handleRefresh = () => {
    if (selectedFacilityId) loadInventory(selectedFacilityId, { silent: true });
  };

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchRan(true);
    try {
      const res = await api.searchInventory(searchType, searchQuery.trim());
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('Inventory search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const facility = inventoryData?.facility;
  const services: any[] = inventoryData?.services || [];
  const doctors: any[] = inventoryData?.doctors || [];
  const medicines: any[] = inventoryData?.medicines || [];
  const equipment: any[] = inventoryData?.equipment || [];
  const wards: any[] = inventoryData?.wards || [];

  const medicinesAvailable = medicines.filter((m) => m.status !== 'out_of_stock').length;
  const equipmentAvailable = equipment.filter((e) => e.is_available).length;
  const doctorsOnDuty = doctors.filter((d) => d.is_available_today).length;
  const specialistList = Array.from(new Set(doctors.filter((d) => d.is_available_today).map((d) => d.specialty)));
  const diagnosticServices = services.filter((s) => s.category === 'Laboratory' && s.is_available);
  const emergencyServices = services.filter((s) => s.category === 'Emergency');
  const otherServices = services.filter((s) => s.category !== 'Laboratory' && s.category !== 'Emergency');
  const hasEmergency = facility?.emergency_24x7 === 1;
  const overallAvailable = services.some((s) => s.is_available) || medicinesAvailable > 0 || doctorsOnDuty > 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {currentUser?.role === 'patient' && (
        <button
          type="button"
          onClick={() => setCurrentView('citizen')}
          aria-label="Back to Patient Dashboard"
          title="Back to Patient Dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', marginBottom: '0.75rem',
            background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px',
            color: '#334155', cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>Inventory</h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0.35rem 0 0 0' }}>
          Check medicines, equipment, doctors, specialists, beds, diagnostics and services available at public healthcare facilities.
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setMode('browse')}
          style={{
            padding: '0.5rem 1rem', borderRadius: '0.5rem',
            border: mode === 'browse' ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
            background: mode === 'browse' ? '#f0fdfa' : '#ffffff',
            color: mode === 'browse' ? '#0f766e' : '#64748b',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          Browse by Facility
        </button>
        <button
          type="button"
          onClick={() => setMode('search')}
          style={{
            padding: '0.5rem 1rem', borderRadius: '0.5rem',
            border: mode === 'search' ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
            background: mode === 'search' ? '#f0fdfa' : '#ffffff',
            color: mode === 'search' ? '#0f766e' : '#64748b',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
          }}
        >
          Search by Requirement
        </button>
      </div>

      {mode === 'search' ? (
        /* ================= SEARCH BY REQUIREMENT ================= */
        <div>
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="medicine">Medicine</option>
              <option value="equipment">Equipment</option>
              <option value="specialist">Specialist</option>
              <option value="service">Service</option>
            </select>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={
                  searchType === 'medicine' ? 'e.g. Paracetamol' :
                  searchType === 'equipment' ? 'e.g. X-Ray' :
                  searchType === 'specialist' ? 'e.g. Gynecologist' : 'e.g. Blood Test'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #0d9488', background: '#0d9488', color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <Search size={14} /> Find Facilities
            </button>
          </div>

          {searching ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Searching...</div>
          ) : searchRan && searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#64748b' }}>
              No facilities currently have this available. Try a different search term.
            </div>
          ) : searchResults.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {searchResults.map((r, idx) => (
                <div key={`${r.facility_id}-${idx}`} className="glass-panel" style={{ padding: '1.1rem' }}>
                  <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, background: '#ccfbf1', color: '#0f766e', marginBottom: '0.4rem' }}>
                    {r.facility_type}
                  </span>
                  <h4 style={{ fontSize: '1.05rem', color: '#0f172a', margin: '0 0 0.3rem 0', fontWeight: 800 }}>{r.facility_name}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    <MapPin size={13} style={{ marginTop: '0.15rem', flexShrink: 0 }} /> {r.address}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '0.75rem' }}>
                    {searchType === 'medicine' && <>💊 {r.medicine_name} — {r.stock_quantity} units</>}
                    {searchType === 'equipment' && <>🩺 {r.equipment_name}{r.quantity_available != null ? ` — ${r.quantity_available} available` : ''}</>}
                    {searchType === 'specialist' && <>👨‍⚕️ {r.doctor_name} ({r.specialty})</>}
                    {searchType === 'service' && <>✓ {r.service_name}</>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMode('browse'); selectFacility(r.facility_id); }}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #0d9488', background: '#f0fdfa', color: '#0f766e', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    View Full Inventory
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              Search for a medicine, equipment, specialist, or service to find facilities that have it.
            </div>
          )}
        </div>
      ) : (
        /* ================= BROWSE BY FACILITY ================= */
        <div className="live-queue-nav-layout">
          {/* LEFT: Facility search + list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="glass-panel" style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search facility name, taluka, village..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFacilities()}
                  style={{ width: '100%', padding: '0.5rem 0.65rem 0.5rem 2rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                  <option value="">All Districts</option>
                  {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ flex: 1, padding: '0.4rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                  <option value="">All Types</option>
                  <option value="Sub-Centre">Sub-Centre</option>
                  <option value="PHC">PHC</option>
                  <option value="CHC">CHC</option>
                  <option value="Rural Hospital">Rural Hospital</option>
                  <option value="Sub-District Hospital">Sub-District Hospital</option>
                  <option value="District Hospital">District Hospital</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '600px', overflowY: 'auto' }}>
              {facilitiesLoading ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>Loading facilities...</div>
              ) : facilities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>No facilities matched your search.</div>
              ) : (
                facilities.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectFacility(f.id)}
                    style={{
                      textAlign: 'left', padding: '0.85rem 1rem', borderRadius: '0.6rem',
                      border: selectedFacilityId === f.id ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                      background: selectedFacilityId === f.id ? '#f0fdfa' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'inline-block', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700, background: '#ccfbf1', color: '#0f766e', marginBottom: '0.3rem' }}>
                      {f.type}
                    </span>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{f.name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{f.taluka}, {f.district}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Selected facility inventory */}
          <div>
            {!selectedFacilityId ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <Building2 size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                Select a facility to view its inventory and capabilities.
              </div>
            ) : inventoryLoading ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                Loading facility inventory...
              </div>
            ) : inventoryError && !inventoryData ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#991b1b' }}>
                {inventoryError}
              </div>
            ) : facility ? (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: '#ccfbf1', color: '#0f766e', marginBottom: '0.4rem' }}>
                      {facility.type}
                    </span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{facility.name}</h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                      <MapPin size={13} /> {facility.taluka}, {facility.district}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.45rem 0.8rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.82rem', cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.7 : 1 }}
                  >
                    <RefreshCw size={13} className={refreshing ? 'icon-spin' : undefined} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {inventoryError && (
                  <div style={{ fontSize: '0.78rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.55rem 0.75rem', marginBottom: '0.75rem' }}>
                    {inventoryError}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: overallAvailable ? '#16a34a' : '#b45309', marginBottom: '0.25rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: overallAvailable ? '#16a34a' : '#b45309', display: 'inline-block' }} />
                  {overallAvailable ? 'Services Available' : 'Limited Availability'}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Last updated: {formatTimestamp(facility.last_updated)}
                </div>

                {/* Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  {[
                    { icon: Pill, label: 'Medicines', value: `${medicinesAvailable} available`, color: '#0d9488' },
                    { icon: Package, label: 'Equipment', value: `${equipmentAvailable} available`, color: '#4f46e5' },
                    { icon: Users, label: 'Doctors', value: `${doctorsOnDuty} on duty`, color: '#2563eb' },
                    { icon: Stethoscope, label: 'Specialists', value: `${specialistList.length} available`, color: '#7c3aed' },
                    { icon: Bed, label: 'Beds', value: `${facility.available_beds} available`, color: '#d97706' },
                    { icon: FlaskConical, label: 'Diagnostics', value: `${diagnosticServices.length} services`, color: '#0891b2' },
                    { icon: Siren, label: 'Emergency', value: hasEmergency ? 'Available' : 'Not Available', color: hasEmergency ? '#dc2626' : '#94a3b8' }
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: row.color, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          <Icon size={13} /> {row.label}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{row.value}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowFullInventory((v) => !v)}
                    style={{ flex: 1, minWidth: '160px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #0d9488', background: '#f0fdfa', color: '#0f766e', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer' }}
                  >
                    {showFullInventory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {showFullInventory ? 'Hide Full Inventory' : 'View Full Inventory'}
                  </button>
                  {facility.latitude && facility.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', color: '#334155', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 700 }}
                    >
                      <Navigation size={15} /> Directions
                    </a>
                  )}
                  {facility.phone && (
                    <a
                      href={`tel:${facility.phone}`}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem 0.9rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', color: '#334155', textDecoration: 'none' }}
                      title="Call facility"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>

                {showFullInventory && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                    {/* Medicines */}
                    <div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Pill size={16} color="#0d9488" /> Medicines
                      </h5>
                      {medicines.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Information not available</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
                          {medicines.map((m) => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.55rem 0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                                {m.status !== 'out_of_stock' && (
                                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{m.stock_quantity} {m.unit || 'units'}</div>
                                )}
                              </div>
                              <StatusBadge status={medicineStatus(m.status)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Equipment */}
                    <div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Package size={16} color="#4f46e5" /> Medical Equipment
                      </h5>
                      {equipment.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Information not available</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
                          {equipment.map((e) => (
                            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.55rem 0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{e.equipment_name}</div>
                                {e.quantity_available != null && (
                                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{e.quantity_available} available</div>
                                )}
                              </div>
                              <StatusBadge status={e.is_available ? 'available' : 'unavailable'} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Doctors */}
                    <div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={16} color="#2563eb" /> Doctors
                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b' }}>({doctorsOnDuty} of {doctors.length} on duty)</span>
                      </h5>
                      {doctors.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Information not available</div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                          {doctors.map((d) => (
                            <div key={d.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.55rem 0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{d.full_name}</div>
                                <StatusBadge status={d.is_available_today ? 'available' : 'unavailable'} label={d.is_available_today ? 'On Duty' : 'Off Duty'} />
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#0d9488' }}>{d.specialty}</div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Room {d.room_number}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Specialists (derived from available doctors) */}
                    <div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Stethoscope size={16} color="#7c3aed" /> Specialists Available
                      </h5>
                      {specialistList.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Information not available</div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {specialistList.map((s) => (
                            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', background: '#faf5ff', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700 }}>
                              <CheckCircle2 size={12} /> {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Beds */}
                    <div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Bed size={16} color="#d97706" /> Bed Availability
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: wards.length > 0 ? '0.6rem' : 0 }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Total (All Wards)</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{facility.available_beds} / {facility.total_beds}</div>
                        </div>
                      </div>
                      {wards.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                          {wards.map((w: any) => {
                            const total = w.beds?.length || 0;
                            const available = (w.beds || []).filter((b: any) => b.status === 'Available').length;
                            return (
                              <div key={w.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}>
                                <div style={{ fontSize: '0.74rem', color: '#92400e' }}>{w.name} ({w.department})</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{available} / {total}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Diagnostics */}
                    <div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FlaskConical size={16} color="#0891b2" /> Diagnostics
                      </h5>
                      {diagnosticServices.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Information not available</div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {diagnosticServices.map((s) => (
                            <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#ecfeff', color: '#0e7490', fontSize: '0.78rem', fontWeight: 600 }}>
                              <CheckCircle2 size={12} /> {s.service_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Emergency */}
                    <div>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Siren size={16} color="#dc2626" /> Emergency Services
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <StatusBadge status={hasEmergency ? 'available' : 'unavailable'} label={hasEmergency ? '24/7 Emergency' : '24/7 Emergency: Not Available'} />
                        {emergencyServices.map((s) => (
                          <StatusBadge key={s.id} status={s.is_available ? 'available' : 'unavailable'} label={s.service_name} />
                        ))}
                      </div>
                    </div>

                    {/* Other Services */}
                    {otherServices.length > 0 && (
                      <div>
                        <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
                          Other Facility Services
                        </h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {otherServices.map((s) => (
                            <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#f1f5f9', color: '#334155', fontSize: '0.78rem', fontWeight: 600 }}>
                              {s.service_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
