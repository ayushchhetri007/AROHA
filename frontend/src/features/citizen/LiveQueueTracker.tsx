import React, { useState, useEffect, useRef } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import { Volume2, CheckCircle2, RefreshCw, MapPin, Navigation, ArrowLeft, LocateFixed, HeartPulse, ArrowRight } from 'lucide-react';
import { FacilityNavigationMap } from './FacilityNavigationMap';
import {
  LatLng,
  RouteResult,
  haversineDistanceKm,
  fallbackEstimate,
  fetchRoadRoute,
  formatDistance,
  formatDuration
} from '../../utils/navigation';
import { buildQueueAnnouncement } from '../../utils/queueAnnouncement';

// Only recompute the route when the patient has moved meaningfully, so we
// don't hammer the routing API on every tiny GPS jitter while navigating.
const SIGNIFICANT_MOVE_METERS = 40;

export const LiveQueueTracker: React.FC = () => {
  const { t, patientProfile, playAudioPrompt, currentUser, setCurrentView, goBack, language } = useDemo();
  const [queueData, setQueueData] = useState<any>(null);
  const [facilityId, setFacilityId] = useState('fac-phc-shirwal');
  const [facilityDetail, setFacilityDetail] = useState<any | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // Manual "Refresh" click state, kept separate from the silent 15s
  // auto-poll so the button gives clear feedback only when the user asks.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Patient's real device location: one-shot while browsing, continuously
  // updated (watchPosition) while internal navigation is active.
  const [patientCoords, setPatientCoords] = useState<LatLng | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);
  const [lastLocatedAt, setLastLocatedAt] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Real road route (OSRM) between patient and facility, or a clearly
  // labeled straight-line fallback if the routing service is unreachable.
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeIsEstimate, setRouteIsEstimate] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  const lastRouteOriginRef = useRef<LatLng | null>(null);

  // Internal, in-app navigation panel (never redirects off Seva Health).
  const [isNavigating, setIsNavigating] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getQueue(facilityId);
      setQueueData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000); // Auto-refresh queue every 15s
    return () => clearInterval(interval);
  }, [facilityId]);

  // User-initiated Refresh: re-fetches the live queue data without a whole-page reload.
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await api.getQueue(facilityId);
      setQueueData(res);
    } catch (err) {
      console.error('Failed to refresh queue:', err);
      setRefreshError('Unable to refresh queue. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Destination facility is resolved from the patient's own appointment/OPD
  // token - Patient -> Appointment -> Facility - never a manual selection.
  useEffect(() => {
    api.getAppointments()
      .then((appts: any[]) => {
        const booked = appts?.find((a) => a.facility_id) || appts?.[0];
        if (booked?.facility_id) setFacilityId(booked.facility_id);
      })
      .catch((err) => console.error('Failed to resolve booked facility from appointments:', err));
  }, []);

  useEffect(() => {
    api.getFacilityById(facilityId)
      .then((data) => setFacilityDetail(data.facility))
      .catch((err) => console.error('Failed to load facility for navigation:', err));
  }, [facilityId]);

  // Fetch patient-specific referrals
  useEffect(() => {
    const pId = patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : null);
    if (!pId) {
      setReferrals([]);
      return;
    }
    api.getReferrals({ patient_id: pId })
      .then((refs: any[]) => {
        const activeRefs = (refs || []).filter((r: any) =>
          ['created', 'pending', 'accepted', 'in_transit', 'active'].includes((r.status || '').toLowerCase()) || !r.status
        );
        setReferrals(activeRefs);
      })
      .catch((err) => {
        console.error('Failed to load patient referrals:', err);
        setReferrals([]);
      });
  }, [patientProfile?.id, currentUser?.id]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Location services are not supported on this device/browser.');
      setLocating(false);
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPatientCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLastLocatedAt(new Date());
        setLocating(false);
        setGeoError(null);
      },
      (err) => {
        console.warn('Geolocation unavailable/denied:', err?.message);
        setGeoError(
          err.code === 1
            ? 'Location access was denied. You can still see facility details and directions.'
            : 'Could not determine your location.'
        );
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Stop any active watch on unmount.
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Resolves the patient's own token from the live token list (by patient_id)
  const myToken = queueData?.tokens?.find((t: any) => t.patient_id === patientProfile.id)
    || queueData?.tokens?.[0]
    || null;

  // The token currently in room
  const currentToken = queueData?.tokens?.find((t: any) => t.status === 'in_progress')
    || (queueData?.tokens && queueData.tokens.length > 0 ? queueData.tokens[0] : null);

  const myTokenIndex = queueData?.tokens && myToken
    ? queueData.tokens.findIndex((t: any) => t.id === myToken.id)
    : -1;
  const currentTokenIndex = queueData?.tokens && currentToken
    ? queueData.tokens.findIndex((t: any) => t.id === currentToken.id)
    : -1;
  const patientsAhead = myTokenIndex >= 0 && currentTokenIndex >= 0
    ? Math.max(0, myTokenIndex - currentTokenIndex)
    : 0;

  // Audio announcement reads out token, patients ahead, and room in chosen language
  const handleAudioAnnouncement = () => {
    if (!myToken) return;
    const message = buildQueueAnnouncement(language, {
      tokenNumber: myToken.token_number,
      patientsAhead,
      counterRoom: myToken.counter_room || 'the OPD counter'
    });
    playAudioPrompt(message, {
      onStart: () => setIsAnnouncing(true),
      onEnd: () => setIsAnnouncing(false)
    });
  };

  const hasFacilityCoords = facilityDetail?.latitude != null && facilityDetail?.longitude != null;
  const facilityCoords: LatLng | null = hasFacilityCoords
    ? { lat: facilityDetail.latitude, lng: facilityDetail.longitude }
    : null;

  const computeRoute = async (origin: LatLng, destination: LatLng) => {
    setRouting(true);
    setRouteError(null);
    lastRouteOriginRef.current = origin;
    const real = await fetchRoadRoute(origin, destination);
    if (real) {
      setRoute(real);
      setRouteIsEstimate(false);
    } else {
      const fb = fallbackEstimate(origin, destination);
      setRoute({ distanceMeters: fb.distanceKm * 1000, durationSeconds: fb.durationSeconds, geometry: [] });
      setRouteIsEstimate(true);
      setRouteError('Unable to calculate the road route right now.');
    }
    setRouting(false);
  };

  // (Re)compute the route whenever we have both points, skipping refetches
  // for insignificant GPS jitter.
  useEffect(() => {
    if (!patientCoords || !facilityCoords) return;
    const last = lastRouteOriginRef.current;
    if (last && haversineDistanceKm(last, patientCoords) * 1000 < SIGNIFICANT_MOVE_METERS) return;
    computeRoute(patientCoords, facilityCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientCoords?.lat, patientCoords?.lng, facilityCoords?.lat, facilityCoords?.lng]);

  const retryRoute = () => {
    if (patientCoords && facilityCoords) computeRoute(patientCoords, facilityCoords);
  };

  const startNavigation = () => {
    if (!facilityCoords) return;
    setIsNavigating(true);
    if (!navigator.geolocation) {
      setGeoError('Location services are not supported on this device/browser.');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPatientCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLastLocatedAt(new Date());
        setGeoError(null);
      },
      () => setGeoError('Location access is required to calculate your route.'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {currentUser?.role === 'patient' && (
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          title="Back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            marginBottom: '1rem',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
      )}
      {/* TOP ROW: LIVE OPD QUEUE TRACKER (LEFT ~62%) | REFERRALS & FOLLOW-UP (RIGHT ~38%) */}
      <div className="live-queue-referrals-grid">
        {/* LEFT COLUMN: LIVE OPD QUEUE TRACKER */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.realTimeTokenSystem}
              </span>
              <h2 style={{ fontSize: '1.75rem', color: '#0f172a', margin: '0.15rem 0 0.35rem 0' }}>{t.liveOpdQueueTracker}</h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                {t.currentQueueUpdatesFor} {facilityDetail?.name || 'the selected facility'}
                {facilityDetail?.taluka ? ` (${facilityDetail.taluka} Taluka)` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.7 : 1
                }}
              >
                <RefreshCw size={14} className={refreshing ? 'icon-spin' : undefined} />
                {refreshing ? t.refreshing : t.refresh}
              </button>
              {refreshError && (
                <span style={{ fontSize: '0.76rem', color: '#b45309' }}>{refreshError}</span>
              )}
            </div>
          </div>

          {/* Tokens: Your Token & Now In Room */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Card 1: Your Token */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '6px solid #0d9488', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                  {t.yourReservedToken}
                </span>
                <span style={{ background: '#ccfbf1', color: '#0f766e', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 700 }}>
                  {myToken?.status === 'waiting' ? t.waitingInQueue : myToken?.status === 'in_progress' ? t.nowInRoom : t.active}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  #{myToken?.token_number || 14}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {t.tokenId}
                </span>
              </div>

              <div style={{ color: '#334155', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
                {t.patientLabel}: <strong>{patientProfile.full_name}</strong> ({patientProfile.village})
              </div>

              <div style={{ background: '#f0fdfa', padding: '0.8rem', borderRadius: '0.5rem', fontSize: '0.84rem', color: '#0f766e', marginBottom: '1rem', border: '1px solid #ccfbf1' }}>
                <div>{t.counterLabel}: <strong>{myToken?.counter_room || 'OPD Room 2 (Dr. Deshmukh)'}</strong></div>
                <div style={{ marginTop: '0.25rem' }}>
                  {t.estimatedWait}: <strong>~{myToken?.estimated_wait_minutes ?? 15} min</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAudioAnnouncement}
                disabled={!myToken}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: !myToken ? '#cbd5e1' : '#0d9488',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: !myToken ? 'not-allowed' : 'pointer'
                }}
              >
                <Volume2 size={16} /> {isAnnouncing ? t.playingAudio : t.audioAnnouncement}
              </button>
            </div>

            {/* Card 2: Current Token Being Served */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '6px solid #0284c7', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                  {t.nowInConsultationRoom}
                </span>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 700 }}>
                  {t.liveCounter}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '3.2rem', fontWeight: 800, color: '#0284c7', lineHeight: 1 }}>
                  #{currentToken?.token_number || 12}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {t.currentlyWithDoctor}
                </span>
              </div>

              <div style={{ color: '#334155', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
                {t.patientLabel}: <strong>{currentToken?.patient_name || 'Prakash Jadhav'}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', background: '#f8fafc', padding: '0.8rem', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>{t.patientsAhead}:</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{patientsAhead} Patient{patientsAhead !== 1 ? 's' : ''}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>{t.doctorOnDuty}:</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f766e' }}>Dr. A. Deshmukh</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#047857', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle2 size={15} /> {t.tokenApproachingNotice}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REFERRALS & FOLLOW-UP */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartPulse size={20} color="#7c3aed" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {t.referralsFollowUp || 'Referrals & Follow-Up'}
              </h3>
            </div>
            {referrals.length > 0 && (
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#7c3aed', background: '#faf5ff', border: '1px solid #ddd6fe', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                {t.activePathway || 'Active Pathway'}
              </span>
            )}
          </div>

          {referrals.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                background: '#ffffff',
                borderRadius: '1rem',
                border: '1.5px dashed #cbd5e1',
                padding: '2rem 1.5rem',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#faf5ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}
              >
                <HeartPulse size={22} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                {t.noActiveReferrals || 'No active referrals'}
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
                {t.noActiveReferralsDesc || 'You currently have no active care referrals.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="glass-panel"
                  style={{
                    background: '#ffffff',
                    borderRadius: '1rem',
                    borderLeft: '6px solid #7c3aed',
                    borderTop: '1px solid #ede9fe',
                    borderRight: '1px solid #ede9fe',
                    borderBottom: '1px solid #ede9fe',
                    boxShadow: '0 4px 18px rgba(124, 58, 237, 0.07)',
                    padding: '1.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed', background: '#faf5ff', border: '1px solid #ddd6fe', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                        {ref.referral_code || ref.id || 'MH-REF-2026-7841'}
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        {t.activePathway || 'Active Pathway'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.6rem 0' }}>
                      {ref.receiving_facility_name || ref.to_facility_name || 'District Hospital Satara'}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.86rem', color: '#475569' }}>
                      <div>
                        {t.specialtyLabel || 'Specialty'}: <strong style={{ color: '#0f172a' }}>{ref.specialty_required || 'Obstetrics & Fetal Medicine'}</strong>
                      </div>
                      <div>
                        {t.sourceLabel || 'Source'}: {t.referredFrom || 'Referred from'} <strong style={{ color: '#0f172a' }}>{ref.referring_facility_name || ref.from_facility_name || 'Primary Health Centre Shirwal'}</strong>
                      </div>
                      <div>
                        {t.referralId || 'Referral ID'}: <strong style={{ color: '#0f172a' }}>{ref.referral_code || ref.id || 'MH-REF-2026-7841'}</strong>
                      </div>
                      <div>
                        {t.referralStatus || 'Referral Status'}: <strong style={{ color: '#7c3aed' }}>{t.activePathway || 'Active Pathway'}</strong>
                      </div>
                      {ref.summary || ref.clinical_reason ? (
                        <div>
                          {t.referralReason || 'Referral Reason'}: <strong style={{ color: '#0f172a' }}>{ref.summary || ref.clinical_reason}</strong>
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, background: '#faf5ff', padding: '0.45rem 0.7rem', borderRadius: '8px', marginTop: '0.35rem' }}>
                        <HeartPulse size={15} />
                        <span>{t.closedLoopActive || 'Closed-Loop Referral Tracking Active'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentView('referrals')}
                      style={{
                        width: '100%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        background: '#faf5ff',
                        color: '#7c3aed',
                        border: '1.5px solid #ddd6fe',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{t.viewCareReferrals || 'View Care Referrals'}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. FACILITY NAVIGATION / MAP */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Navigation size={18} color="#0d9488" /> {t.liveFacilityNavigation}
          </h4>
          {locating && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Locating you...</span>}
        </div>

        {!hasFacilityCoords ? (
          /* Facility has no usable coordinates - never invent a distance. */
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.85rem', padding: '1.25rem', color: '#991b1b', fontSize: '0.88rem' }}>
            Navigation is currently unavailable because the facility location could not be determined.
            {facilityDetail?.address && (
              <div style={{ marginTop: '0.5rem', color: '#7f1d1d', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                <MapPin size={14} style={{ marginTop: '0.15rem', flexShrink: 0 }} /> {facilityDetail.address}
              </div>
            )}
          </div>
        ) : isNavigating ? (
          /* Internal Leaflet + OpenStreetMap panel - navigation stays inside Seva Health. */
          <FacilityNavigationMap
            facility={{ lat: facilityCoords!.lat, lng: facilityCoords!.lng, name: facilityDetail.name }}
            patient={patientCoords}
            routeGeometry={route && !routeIsEstimate ? route.geometry : null}
            onStop={stopNavigation}
          />
        ) : (
          /* Pre-navigation preview: patient -> route -> facility */
          <div style={{
            background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%)',
            border: '1.5px solid #e2e8f0',
            borderRadius: '0.85rem',
            padding: '1.75rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '260px',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ccfbf1',
                color: '#0f766e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={28} />
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', textAlign: 'center', marginTop: '0.25rem' }}>
                {facilityDetail?.name || 'Selected Public Facility'}
              </div>
              {facilityDetail?.address && (
                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', maxWidth: '340px' }}>
                  {facilityDetail.address}
                </div>
              )}
            </div>

            {/* Real Distance + Travel Duration */}
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              margin: '1.25rem 0 0.5rem 0',
              padding: '0.75rem 1.25rem',
              background: '#ffffff',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Distance
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {routing ? 'Calculating…' : route ? formatDistance(route.distanceMeters) : '—'}
                </div>
              </div>
              <div style={{ width: '1px', background: '#e2e8f0' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Est. Travel Time
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {routing ? 'Calculating…' : route ? `~${formatDuration(route.durationSeconds, !routeIsEstimate)}` : '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        {geoError && (
          <div style={{ fontSize: '0.78rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>{geoError}</span>
            <button
              type="button"
              onClick={requestLocation}
              style={{ background: '#fff', border: '1px solid #fbbf24', color: '#92400e', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Allow Location
            </button>
          </div>
        )}

        {!isNavigating && !geoError && lastLocatedAt && (
          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            Location last updated at {lastLocatedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}

        {routeError && (
          <div style={{ fontSize: '0.78rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>{routeError} Showing a straight-line estimate instead.</span>
            <button
              type="button"
              onClick={retryRoute}
              style={{ background: '#fff', border: '1px solid #fbbf24', color: '#92400e', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Try Again
            </button>
          </div>
        )}

        {hasFacilityCoords && (
          <>
            {isNavigating ? (
              <button
                type="button"
                onClick={stopNavigation}
                style={{
                  width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5',
                  padding: '0.7rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                {t.stopNavigation}
              </button>
            ) : (
              <button
                type="button"
                onClick={startNavigation}
                style={{
                  width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: '#0d9488', color: '#fff', border: 'none',
                  padding: '0.7rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                <Navigation size={16} /> {t.startNavigation}
              </button>
            )}
          </>
        )}
      </div>

      {/* Full Queue Roster */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
        <h4 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '1rem' }}>
          {t.todaysOpdQueueRoster} {facilityDetail?.name || 'Selected Facility'}
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{t.tokenHash}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t.patientName}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t.departmentPriority}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t.status}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{t.consultingDoctor}</th>
              </tr>
            </thead>
            <tbody>
              {queueData?.tokens?.map((tok: any) => {
                const isMe = tok.patient_id === patientProfile.id;
                return (
                  <tr
                    key={tok.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isMe ? '#f0fdfa' : 'transparent',
                      fontWeight: isMe ? 700 : 400
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: tok.status === 'in_progress' ? '#0284c7' : isMe ? '#0d9488' : '#e2e8f0',
                        color: tok.status === 'in_progress' || isMe ? '#fff' : '#334155',
                        fontWeight: 700
                      }}>
                        #{tok.token_number}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {tok.patient_name} {isMe && <span style={{ color: '#0d9488' }}>(You)</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {tok.service_name || 'General OPD'}
                      {tok.priority === 'urgent' && <span style={{ color: '#dc2626', marginLeft: '0.4rem', fontWeight: 700 }}>[Urgent]</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: tok.status === 'in_progress' ? '#e0f2fe' : tok.status === 'completed' ? '#f1f5f9' : '#fef3c7',
                        color: tok.status === 'in_progress' ? '#0369a1' : tok.status === 'completed' ? '#64748b' : '#b45309'
                      }}>
                        {tok.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                      {tok.doctor_name || 'Dr. Anand Deshmukh'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

