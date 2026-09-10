import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  Building2, Search, MapPin, Phone, Clock,
  RefreshCw, Navigation, Stethoscope, Eye, X, ArrowLeft, Package, Calendar
} from 'lucide-react';
import { FacilityMapView } from './FacilityMapView';
import { AppointmentBookingModal } from '../citizen/AppointmentBookingModal';

interface FacilityDirectoryProps {
  onOpenBooking?: (facilityId: string) => void;
}

// Separate, dedicated Public Healthcare Facilities Directory page.
// Reached ONLY via the Patient Dashboard's "Find Nearby Facility" card
// (Explore Facilities) or via the Digital Triage recommendation flow.
export const FacilityDirectory: React.FC<FacilityDirectoryProps> = ({ onOpenBooking }) => {
  const {
    t,
    setCurrentView,
    pendingFacilityType,
    setPendingFacilityType,
    pendingFocusedFacilityId,
    setPendingFocusedFacilityId,
    setPendingInventoryFacilityId
  } = useDemo();

  const [facilities, setFacilities] = useState<any[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState('Satara');
  const [typeFilter, setTypeFilter] = useState(pendingFacilityType || '');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [focusedFacilityId, setFocusedFacilityId] = useState<string | null>(null);

  // Facility Details Modal State
  const [selectedFacilityDetail, setSelectedFacilityDetail] = useState<any | null>(null);
  const [facilityDetailLoading, setFacilityDetailLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Appointment Booking Modal Fallback State (used if onOpenBooking is not provided)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingFacilityId, setBookingFacilityId] = useState<string | undefined>(undefined);

  const handleBookAppointment = (facilityId: string) => {
    if (onOpenBooking) {
      onOpenBooking(facilityId);
    } else {
      setBookingFacilityId(facilityId);
      setIsBookingModalOpen(true);
    }
  };

  // Manual "Refresh" click state - separate from the initial-load `loading`
  // flag so the button gives clear, visible feedback when clicked.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Consume the one-shot recommended-type filter or directions target set by Digital Triage / the
  // dashboard card, so a later visit to this page doesn't reuse a stale value.
  useEffect(() => {
    if (pendingFacilityType !== null) {
      setPendingFacilityType(null);
    }
    if (pendingFocusedFacilityId) {
      setFocusedFacilityId(pendingFocusedFacilityId);
      setViewMode('map');
      setPendingFocusedFacilityId(null);
      setTimeout(() => {
        const mapElem = document.getElementById('facility-map-container');
        if (mapElem) {
          mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable reference: FacilityMapView's marker-refresh effect depends on
  // this callback, so keeping it stable (useCallback) means that effect
  // only re-runs when `facilities` actually changes - not on every
  // unrelated re-render (e.g. the Refresh button's own loading-state
  // toggle), which previously caused the map to spuriously re-fit/re-zoom.
  const handleOpenFacilityDetails = useCallback(async (facilityId: string) => {
    setIsDetailModalOpen(true);
    setFacilityDetailLoading(true);
    try {
      const data = await api.getFacilityById(facilityId);
      setSelectedFacilityDetail(data);
    } catch (err) {
      console.error('Failed to fetch facility details:', err);
    } finally {
      setFacilityDetailLoading(false);
    }
  }, []);

  // In-app navigation to facility on the internal map
  const handleGetDirections = (facility: any) => {
    setFocusedFacilityId(facility.id);
    setViewMode('map');
    setTimeout(() => {
      const mapElem = document.getElementById('facility-map-container');
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const data = await api.getFacilities({
        district: districtFilter || undefined,
        type: typeFilter || undefined,
        emergency: emergencyOnly,
        search: searchTerm || undefined
      });
      setFacilities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtFilter, typeFilter, emergencyOnly]);

  // User-initiated Refresh: re-fetches the same filtered facility data from
  // the existing API (List View and Map View both read from `facilities`,
  // so both update together). Never invents values, never clears valid
  // data on failure.
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const data = await api.getFacilities({
        district: districtFilter || undefined,
        type: typeFilter || undefined,
        emergency: emergencyOnly,
        search: searchTerm || undefined
      });
      setFacilities(data);
    } catch (err) {
      console.error('Failed to refresh facilities:', err);
      setRefreshError('Failed to refresh facilities. Retaining last loaded facilities.');
    } finally {
      setRefreshing(false);
    }
  };

  // Derive the list of districts from the actual facility data (not hardcoded)
  useEffect(() => {
    api.getFacilities({}).then((data: any[]) => {
      const districts = Array.from(new Set(data.map(f => f.district).filter(Boolean))).sort();
      setAvailableDistricts(districts.length > 0 ? districts : ['Satara', 'Pune', 'Solapur', 'Kolhapur']);
    }).catch(err => {
      console.error('Failed to load district list:', err);
      setAvailableDistricts(['Satara', 'Pune', 'Solapur', 'Kolhapur']);
    });
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Quick Back to Patient Dashboard Navigation */}
      <button
        type="button"
        onClick={() => setCurrentView('citizen')}
        aria-label="Back to Patient Dashboard"
        title="Back to Patient Dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          marginBottom: '0.75rem',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          color: '#334155',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={18} />
      </button>

      {/* PUBLIC HEALTHCARE FACILITIES DIRECTORY ("FIND NEARBY FACILITY") */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
              {t.facilityDirectoryTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0.35rem 0 0 0' }}>
              {t.facilityDirectorySubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '0.5rem',
                border: viewMode === 'list' ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                background: viewMode === 'list' ? '#f0fdfa' : '#ffffff',
                color: viewMode === 'list' ? '#0f766e' : '#64748b',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Building2 size={15} /> {t.listView}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '0.5rem',
                border: viewMode === 'map' ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                background: viewMode === 'map' ? '#f0fdfa' : '#ffffff',
                color: viewMode === 'map' ? '#0f766e' : '#64748b',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Navigation size={15} /> {t.mapView}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={t.searchFacilitiesPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchFacilities()}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>{t.districtFilterLabel}</label>
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              style={{ padding: '0.48rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">{t.allDistricts}</option>
              {availableDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>{t.typeFilterLabel}</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '0.48rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">{t.allFacilityTypes}</option>
              <option value="Sub-Centre">{t.subCentres}</option>
              <option value="PHC">{t.primaryHealthCentres}</option>
              <option value="CHC">{t.communityHealthCentres}</option>
              <option value="Rural Hospital">{t.ruralHospitals}</option>
              <option value="Sub-District Hospital">{t.subDistrictHospitals}</option>
              <option value="District Hospital">{t.districtHospitals}</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={e => setEmergencyOnly(e.target.checked)}
            />
            <span>{t.emergencyOnlyFilter}</span>
          </label>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.48rem 0.95rem',
              borderRadius: '0.375rem',
              border: '1px solid #0d9488',
              background: '#0d9488',
              color: '#fff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.75 : 1
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'icon-spin' : undefined} />
            {refreshing ? t.refreshing : t.refresh}
          </button>
        </div>

        {refreshError && (
          <div style={{ marginTop: '-0.75rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.6rem 0.85rem' }}>
            {refreshError}
          </div>
        )}

        {/* View Mode: Map View vs List View */}
        {viewMode === 'map' ? (
          /* ================= MAP VIEW ================= */
          <div
            id="facility-map-container"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{
              padding: '0.85rem 1.25rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {t.facilitiesMap}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} color="#0d9488" /> {facilities.length} {t.facilitiesShown}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    setFocusedFacilityId(null);
                  }}
                  aria-label="Close map"
                  title="Close map"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <FacilityMapView
              facilities={facilities}
              onViewDetails={handleOpenFacilityDetails}
              focusedFacilityId={focusedFacilityId}
            />
          </div>
        ) : (
          /* ================= LIST VIEW ================= */
          loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              {t.loadingDirectory}
            </div>
          ) : facilities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <Building2 size={36} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ color: '#475569', fontWeight: 600 }}>{t.noFacilitiesMatched}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {facilities.map(facility => {
                let typeBadgeBg = '#ccfbf1';
                let typeBadgeColor = '#0f766e';
                if (facility.type === 'Sub-Centre') {
                  typeBadgeBg = '#fef3c7';
                  typeBadgeColor = '#b45309';
                } else if (facility.type === 'Rural Hospital') {
                  typeBadgeBg = '#e0e7ff';
                  typeBadgeColor = '#4338ca';
                } else if (facility.type === 'Sub-District Hospital') {
                  typeBadgeBg = '#f3e8ff';
                  typeBadgeColor = '#7e22ce';
                } else if (facility.type === 'District Hospital') {
                  typeBadgeBg = '#ffe4e6';
                  typeBadgeColor = '#e11d48';
                }

                return (
                  <div
                    key={facility.id}
                    className="glass-panel"
                    onClick={() => handleOpenFacilityDetails(facility.id)}
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      borderTop: facility.emergency_24x7 ? '3px solid #dc2626' : '3px solid #0d9488',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: typeBadgeBg,
                            color: typeBadgeColor,
                            marginBottom: '0.35rem'
                          }}>
                            {facility.type}
                          </span>
                          <h4 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 0.35rem 0', fontWeight: 800 }}>
                            {facility.name}
                          </h4>
                        </div>
                        {facility.emergency_24x7 === 1 && (
                          <span style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {t.emergency24x7Badge}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', margin: '0.35rem 0' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                        <span>{facility.address}</span>
                      </div>
                    </div>

                    {/* Action Buttons: [ Details ] [ Get Directions ] [ Book Appointment ] */}
                    <div style={{ display: 'flex', gap: '0.45rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFacilityDetails(facility.id);
                        }}
                        style={{
                          flex: '1 1 auto',
                          minWidth: '90px',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#0f766e',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Eye size={14} /> {t.detailsBtn}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(facility);
                        }}
                        style={{
                          flex: '1 1 auto',
                          minWidth: '125px',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#0f766e',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Navigation size={14} /> {t.getDirectionsBtn}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookAppointment(facility.id);
                        }}
                        style={{
                          flex: '1 1 auto',
                          minWidth: '135px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #0d9488',
                          background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                        title={`Book Appointment at ${facility.name}`}
                      >
                        <Calendar size={14} /> {t.bookAppointment}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* COMPLETE FACILITY DETAILS MODAL */}
      {isDetailModalOpen && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                padding: '1.25rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building2 size={24} color="#ffffff" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    {selectedFacilityDetail?.facility?.name || 'Public Healthcare Facility'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#ccfbf1', marginTop: '0.15rem' }}>
                    {selectedFacilityDetail?.facility?.type} • Taluka {selectedFacilityDetail?.facility?.taluka}, {selectedFacilityDetail?.facility?.district}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '0.35rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
              {facilityDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  {t.loadingDetails}
                </div>
              ) : selectedFacilityDetail?.facility ? (
                <div>
                  {/* Address & Emergency Status Banner */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        background: '#ccfbf1',
                        color: '#0f766e',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px'
                      }}>
                        {selectedFacilityDetail.facility.type}
                      </span>

                      {selectedFacilityDetail.facility.emergency_24x7 === 1 ? (
                        <span style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px'
                        }}>
                          {t.emergencyServicesAvailable}
                        </span>
                      ) : (
                        <span style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px'
                        }}>
                          {t.daytimeOpd}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.88rem', color: '#334155' }}>
                      <MapPin size={16} color="#0d9488" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                      <span>{selectedFacilityDetail.facility.address}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569', marginTop: '0.4rem' }}>
                      <Phone size={15} color="#0d9488" />
                      <span>{t.helpdeskPhone} <strong>{selectedFacilityDetail.facility.phone}</strong></span>
                    </div>
                  </div>

                  {/* DOCTORS AVAILABLE TODAY */}
                  {(() => {
                    const doctors = selectedFacilityDetail.doctors || [];
                    // Date-aware: Only show doctors scheduled/available for today
                    const doctorsAvailableToday = doctors.filter(
                      (doc: any) => doc.is_available_today === 1 || doc.is_available_today === true
                    );

                    const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '0.85rem',
                            paddingBottom: '0.6rem',
                            borderBottom: '1.5px solid #e2e8f0'
                          }}
                        >
                          <div>
                            <h5
                              style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <Stethoscope size={18} color="#0d9488" /> {t.doctorsAvailableToday}
                            </h5>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                              {t.dutyRosterFor} {currentDateFormatted}
                            </div>
                          </div>

                          <span
                            style={{
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            {doctorsAvailableToday.length} {t.available}
                          </span>
                        </div>

                        {doctorsAvailableToday.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {doctorsAvailableToday.map((doc: any) => (
                              <div
                                key={doc.id}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #e2e8f0',
                                  borderRadius: '10px',
                                  padding: '0.9rem 1.1rem',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem'
                                }}
                              >
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                  <div
                                    style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '10px',
                                      background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                                      border: '1px solid #99f6e4',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.1rem',
                                      flexShrink: 0
                                    }}
                                  >
                                    👨‍⚕️
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem' }}>
                                      {doc.full_name || doc.name}
                                    </div>
                                    {doc.specialty && (
                                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0d9488', marginTop: '0.15rem' }}>
                                        {doc.specialty}
                                      </div>
                                    )}
                                    {doc.room_number && (
                                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                                        {doc.room_number}
                                      </div>
                                    )}
                                    {doc.timing && (
                                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Clock size={12} color="#0d9488" />
                                        <span>{doc.timing}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <span
                                  style={{
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #a7f3d0',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {t.availableToday}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '1.75rem',
                              textAlign: 'center',
                              background: '#f8fafc',
                              borderRadius: '10px',
                              border: '1px dashed #cbd5e1'
                            }}
                          >
                            <div style={{ color: '#475569', fontWeight: 700, fontSize: '0.9rem' }}>
                              {t.noDoctorsScheduledToday}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                              {t.emergencyStaffActive}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Facility information unavailable.
                </div>
              )}
            </div>

            {/* Modal Actions Footer: [ Close ] on left, [ View Inventory ] on right */}
            <div
              style={{
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                padding: '0.85rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.close}
              </button>

              {selectedFacilityDetail?.facility && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setPendingInventoryFacilityId(selectedFacilityDetail.facility.id);
                    setCurrentView('medicines');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid #0d9488',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(13, 148, 136, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Package size={15} /> {t.viewInventory}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fallback Appointment Booking Modal (if onOpenBooking prop not supplied) */}
      {!onOpenBooking && (
        <AppointmentBookingModal
          isOpen={isBookingModalOpen}
          defaultFacilityId={bookingFacilityId}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={(_appt) => {
            setIsBookingModalOpen(false);
            setCurrentView('queue');
          }}
        />
      )}
    </div>
  );
};

export default FacilityDirectory;
