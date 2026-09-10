import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useDemo } from '../../store/demoContext';
import {
  Activity,
  CheckCircle2,
  Calendar,
  X,
  PhoneCall,
  Stethoscope,
  Info,
  Navigation,
  RotateCcw,
  Building2
} from 'lucide-react';
import {
  matchRecommendedFacility,
  TRIAGE_CATEGORY_STYLES
} from './triageEngine';
import { SymptomChatAssessment, GeminiTriageResult } from './SymptomChatAssessment';
import { FacilityNavigationMap } from './FacilityNavigationMap';
import {
  LatLng,
  RouteResult,
  fallbackEstimate,
  fetchRoadRoute,
  formatDistance,
  formatDuration
} from '../../utils/navigation';

function hasValidCoords(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

const FALLBACK_FACILITY = {
  id: 'fac-phc-shirwal',
  name: 'Primary Health Centre Shirwal',
  type: 'PHC',
  taluka: 'Khandala',
  district: 'Satara',
  address: 'Near Main Bazaar, Shirwal, Maharashtra 412801',
  phone: '02169-244120',
  emergency_24x7: 1,
  queue_wait_minutes: 15
};

interface SymptomAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: (facilityId?: string) => void;
  onOpenToken?: () => void;
  onOpenEmergency: () => void;
  onExploreFacilities?: (recommendedType?: string) => void;
  onGetDirections?: (facilityId: string) => void;
  onViewFacilityDetails?: (facilityId: string) => void;
}

export const SymptomAssessmentModal: React.FC<SymptomAssessmentModalProps> = ({
  isOpen,
  onClose,
  onOpenBooking,
  onOpenToken,
  onOpenEmergency,
  onExploreFacilities,
  onGetDirections,
  onViewFacilityDetails
}) => {
  const { language, patientProfile, currentUser, showToast, setCurrentView, setPendingFocusedFacilityId } = useDemo();

  const [chatResult, setChatResult] = useState<GeminiTriageResult | null>(null);
  const [reportedSymptomsText, setReportedSymptomsText] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const [nearbyFacilities, setNearbyFacilities] = useState<any[]>([]);
  const [facilityDoctors, setFacilityDoctors] = useState<any[]>([]);
  const [selectedFacilityDetail, setSelectedFacilityDetail] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);

  // In-modal "Get Directions" map overlay (never navigates away from this
  // assessment, so the completed result underneath is never lost).
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [recommendedFacilityDetail, setRecommendedFacilityDetail] = useState<any | null>(null);
  const [mapPatientCoords, setMapPatientCoords] = useState<LatLng | null>(null);
  const [mapGeoError, setMapGeoError] = useState<string | null>(null);
  const [mapLocating, setMapLocating] = useState(false);
  const [mapRoute, setMapRoute] = useState<RouteResult | null>(null);
  const [mapRouteIsEstimate, setMapRouteIsEstimate] = useState(false);
  const [mapRouting, setMapRouting] = useState(false);

  const currentLang = language === 'mr' ? 'mr' : language === 'hi' ? 'hi' : 'en';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setChatResult(null);
      setReportedSymptomsText('');
      setIsCompleted(false);
      setIsDetailModalOpen(false);
      setIsMapModalOpen(false);
      setMapPatientCoords(null);
      setMapGeoError(null);
      setMapRoute(null);
      setMapRouteIsEstimate(false);

      const district = patientProfile?.district || 'Satara';
      api
        .getFacilities({ district })
        .then((data) => setNearbyFacilities(data || []))
        .catch((err) => console.error('Failed to load facilities for assessment:', err));
    }
  }, [isOpen, patientProfile?.district]);

  // Triage styling (badge colors/title/care-tier label) for the current
  // category, derived from Gemini's response once available.
  const triageStyle = chatResult ? TRIAGE_CATEGORY_STYLES[chatResult.triage_level] : TRIAGE_CATEGORY_STYLES.PHC;
  const matchedFacilityInfo = matchRecommendedFacility(
    triageStyle.category,
    nearbyFacilities,
    patientProfile
  );
  const recommendedFacility = matchedFacilityInfo.facility || FALLBACK_FACILITY;


  // Fetch real doctors (and full facility record, for map coordinates) for
  // the recommended facility whenever it changes.
  useEffect(() => {
    if (recommendedFacility && recommendedFacility.id) {
      api
        .getFacilityById(recommendedFacility.id)
        .then((data) => {
          if (data && data.doctors) {
            setFacilityDoctors(data.doctors);
          }
          if (data && data.facility) {
            setRecommendedFacilityDetail(data.facility);
          }
        })
        .catch((e) => console.warn('Could not fetch doctor roster:', e));
    }
  }, [recommendedFacility?.id]);

  // Prefer coordinates already present on the matched facility; fall back to
  // the freshly-fetched full facility record (covers the hardcoded fallback
  // facility object, which doesn't carry lat/lng itself).
  const mapFacilityCoords: LatLng | null = hasValidCoords(recommendedFacility.latitude, recommendedFacility.longitude)
    ? { lat: recommendedFacility.latitude, lng: recommendedFacility.longitude }
    : hasValidCoords(recommendedFacilityDetail?.latitude, recommendedFacilityDetail?.longitude)
    ? { lat: recommendedFacilityDetail.latitude, lng: recommendedFacilityDetail.longitude }
    : null;

  const computeMapRoute = async (origin: LatLng, destination: LatLng) => {
    setMapRouting(true);
    try {
      const realRoute = await fetchRoadRoute(origin, destination);
      if (realRoute) {
        setMapRoute(realRoute);
        setMapRouteIsEstimate(false);
      } else {
        const est = fallbackEstimate(origin, destination);
        setMapRoute({ distanceMeters: est.distanceKm * 1000, durationSeconds: est.durationSeconds, geometry: [] });
        setMapRouteIsEstimate(true);
      }
    } finally {
      setMapRouting(false);
    }
  };

  // One-shot geolocation lookup for the "Get Directions" map overlay (not a
  // continuous watch - this is a quick directions preview, not turn-by-turn
  // navigation, which already exists elsewhere via FacilityNavigationMap).
  const requestMapLocation = () => {
    if (!navigator.geolocation) {
      setMapGeoError('Location services are not supported on this device/browser.');
      return;
    }
    setMapLocating(true);
    setMapGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapPatientCoords(coords);
        setMapLocating(false);
        if (mapFacilityCoords) computeMapRoute(coords, mapFacilityCoords);
      },
      (err) => {
        setMapGeoError(
          err.code === 1
            ? 'Location access was denied. You can still see the facility location and address.'
            : 'Could not determine your location.'
        );
        setMapLocating(false);
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  if (!isOpen) return null;

  // 1. Save assessment to backend PostgreSQL database. Computes the facility
  // match directly from the just-received Gemini result (rather than the
  // render-time `recommendedFacility` closure, which would still reflect
  // the pre-update default on this synchronous call).
  const saveAssessmentRecord = async (result: GeminiTriageResult, symptomsText: string) => {
    setSavingAssessment(true);
    try {
      const patientId =
        patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : 'P-10452');

      const matched = matchRecommendedFacility(result.triage_level, nearbyFacilities, patientProfile);
      const facility = matched.facility || FALLBACK_FACILITY;
      const reportedSymptoms = result.identified_symptoms.length > 0
        ? result.identified_symptoms
        : [symptomsText || 'General symptom report'];

      const res = await api.saveAssessment({
        patient_id: patientId,
        symptoms: reportedSymptoms,
        triage_level: result.triage_level,
        recommendation: result.recommendation,
        recommended_facility_id: facility.id,
        emergency_flag: result.emergency_flag
      });
      showToast('Health assessment recorded into your longitudinal medical record.', 'success');
      window.dispatchEvent(new CustomEvent('seva_assessment_updated', {
        detail: {
          patientId,
          assessment: res?.assessment || {
            patient_id: patientId,
            symptoms_json: JSON.stringify(reportedSymptoms),
            triage_level: result.triage_level,
            emergency_flag: result.emergency_flag ? 1 : 0,
            recommended_facility_id: facility.id
          }
        }
      }));
    } catch (e) {
      console.error('Failed to save assessment', e);
    } finally {
      setSavingAssessment(false);
    }
  };

  // 2. Gemini chat completion: replaces the old "all 10 questions answered"
  // completion trigger.
  const handleChatComplete = (result: GeminiTriageResult, symptomsText: string) => {
    setChatResult(result);
    setReportedSymptomsText(symptomsText);
    setIsCompleted(true);
    saveAssessmentRecord(result, symptomsText);
  };

  // 3. Retake Assessment
  const handleRetake = () => {
    setChatResult(null);
    setReportedSymptomsText('');
    setIsCompleted(false);
  };

  // Handle in-app directions click: opens the map as an overlay on top of
  // this same assessment result, so the result stays intact underneath and
  // "Close" simply dismisses the overlay - no navigation away is needed.
  const handleDirectionsClick = () => {
    if (mapFacilityCoords) {
      setIsMapModalOpen(true);
      requestMapLocation();
      return;
    }
    // Fallback for the rare case a facility has no known coordinates yet.
    onClose();
    if (onGetDirections) {
      onGetDirections(recommendedFacility.id);
    } else {
      setPendingFocusedFacilityId(recommendedFacility.id);
      setCurrentView('facilities');
    }
  };

  // Handle view details click
  const handleDetailsClick = async () => {
    try {
      const data = await api.getFacilityById(recommendedFacility.id);
      setSelectedFacilityDetail(data);
      setIsDetailModalOpen(true);
    } catch (e) {
      console.error('Failed to load facility detail', e);
      if (onViewFacilityDetails) {
        onViewFacilityDetails(recommendedFacility.id);
      }
    }
  };

  // Doctor text
  const primaryDoctor =
    facilityDoctors.find((d: any) => d.is_available_today === 1) ||
    facilityDoctors[0] ||
    (recommendedFacility.id === 'fac-phc-shirwal'
      ? { full_name: 'Dr. Anand Deshmukh', specialty: 'General Medicine & Public Health', room_number: 'OPD Room 2' }
      : { full_name: 'Medical Officer on Duty', specialty: 'General OPD', room_number: 'Room 1' });

  return (
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
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            background: isCompleted && triageStyle.category === 'EMERGENCY'
              ? 'linear-gradient(135deg, #78350f 0%, #b45309 100%)'
              : 'linear-gradient(135deg, #093430 0%, #0d9488 100%)',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={19} color="#5eead4" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                {isCompleted
                  ? (currentLang === 'mr'
                      ? 'आरोग्य तपासणी निकाल व शिफारस'
                      : currentLang === 'hi'
                      ? 'स्वास्थ्य जांच परिणाम एवं मार्गदर्शन'
                      : 'Your Health Assessment Result')
                  : (currentLang === 'mr'
                      ? 'AI लक्षण सहाय्यक'
                      : currentLang === 'hi'
                      ? 'AI लक्षण सहायक'
                      : 'AI Symptom Assistant')}
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#ccfbf1', marginTop: '0.1rem' }}>
                {isCompleted
                  ? (currentLang === 'mr'
                      ? 'प्राथमिक काळजी शिफारस व जवळचे सार्वजनिक आरोग्य केंद्र'
                      : currentLang === 'hi'
                      ? 'प्रारंभिक देखभाल सिफारिश एवं निकटतम सार्वजनिक स्वास्थ्य केंद्र'
                      : 'Preliminary Care Recommendation & Nearest Public Facility')
                  : (currentLang === 'mr'
                      ? 'तुमची लक्षणे निवडा किंवा टाइप करा'
                      : currentLang === 'hi'
                      ? 'अपने लक्षण चुनें या टाइप करें'
                      : 'Select or type your symptoms below')}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Assessment"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* MEDICAL DISCLAIMER NOTICE */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.5rem 1.25rem',
            fontSize: '0.78rem',
            lineHeight: 1.35,
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Info size={14} color="#0d9488" style={{ flexShrink: 0 }} />
          <span>
            <strong>
              {currentLang === 'mr'
                ? 'निर्णय-सहाय्य सूचना: '
                : currentLang === 'hi'
                ? 'निर्णय-सहायता सूचना: '
                : 'Decision-Support Notice: '}
            </strong>
            {currentLang === 'mr'
              ? 'हे मूल्यमापन प्राथमिक मार्गदर्शन प्रदान करते आणि पात्र वैद्यकीय अधिकाऱ्याच्या तपासणीची जागा घेत नाही. कोणताही वैद्यकीय आजार निदान केला जात नाही.'
              : currentLang === 'hi'
              ? 'यह मूल्यांकन प्रारंभिक मार्गदर्शन प्रदान करता है और योग्य डॉक्टर द्वारा जांच का स्थान नहीं लेता है। किसी बीमारी का अंतिम निदान नहीं किया जाता।'
              : 'This assessment provides preliminary guidance and does not replace examination by a qualified healthcare professional. No medical diagnosis is claimed.'}
          </span>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '1.15rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {!isCompleted ? (
            /* AI SYMPTOM CHATBOT: optional suggested symptom chips + free-text
               chat input, sent to the real Gemini API. Replaces the old fixed
               10-question Yes/No screening entirely. */
            <SymptomChatAssessment currentLang={currentLang} onComplete={handleChatComplete} />
          ) : (
            /* FINAL CARE RECOMMENDATION RESULT SCREEN */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* SECTION A: TRIAGE CARE LEVEL BADGE & RECOMMENDATION */}
              <div
                style={{
                  background: triageStyle.badgeBg,
                  border: `2px solid ${triageStyle.badgeBorder}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: `0 6px 20px -2px ${triageStyle.badgeColor}22`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span
                    style={{
                      background: triageStyle.badgeColor,
                      color: '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>{triageStyle.category === 'EMERGENCY' ? '⚠️' : triageStyle.category === 'HIGHER_LEVEL' ? '🟠' : triageStyle.category === 'PHC' ? '🟡' : '🟢'}</span>
                    <span>{triageStyle.title[currentLang]}</span>
                  </span>

                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                    {currentLang === 'mr' ? 'डिजिटल काळजी स्तर मार्गदर्शन' : currentLang === 'hi' ? 'डिजिटल देखभाल स्तर मार्गदर्शन' : 'Digital Care Level Guidance'}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                  {chatResult?.patient_message}
                </h4>

                <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.5, marginTop: '0.5rem' }}>
                  <strong>{currentLang === 'mr' ? 'पुढील कृती: ' : currentLang === 'hi' ? 'अगला कदम: ' : 'Next Action: '}</strong>
                  {chatResult?.recommendation}
                </div>

                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.08)', fontSize: '0.85rem', color: '#0f172a' }}>
                  <strong>{currentLang === 'mr' ? 'योग्य काळजी स्तर:' : currentLang === 'hi' ? 'उपयुक्त देखभाल स्तर:' : 'Appropriate Care Tier:'}</strong> {triageStyle.recommendedCareLevel[currentLang]}
                </div>
              </div>

              {/* SECTION B: RECOMMENDED PUBLIC HEALTH FACILITY */}
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  {currentLang === 'mr' ? 'शिफारस केलेले शासकीय रुग्णालय / केंद्र:' : currentLang === 'hi' ? 'अनुशंसित सार्वजनिक स्वास्थ्य केंद्र:' : 'Recommended Public Healthcare Facility:'}
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '2px solid #0d9488',
                    borderRadius: '14px',
                    padding: '1.35rem',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                          {recommendedFacility.name}
                        </h5>
                        <span style={{ background: '#ccfbf1', color: '#0f766e', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                          {recommendedFacility.type}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>📍 {recommendedFacility.address || 'Khandala Taluka, Satara'}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.82rem', background: '#f1f5f9', color: '#1e293b', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 700 }}>
                        {matchedFacilityInfo.distanceText}
                      </span>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {matchedFacilityInfo.travelTimeText}
                      </div>
                    </div>
                  </div>

                  {/* WHY THIS FACILITY IS APPROPRIATE */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.75rem 0.9rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.84rem',
                      color: '#334155',
                      lineHeight: 1.45
                    }}
                  >
                    <strong>{currentLang === 'mr' ? 'हे केंद्र योग्य का: ' : currentLang === 'hi' ? 'यह केंद्र क्यों उपयुक्त है: ' : 'Why this facility: '}</strong>
                    {matchedFacilityInfo.reason[currentLang]}
                  </div>

                  {/* DOCTORS AVAILABLE TODAY */}
                  <div
                    style={{
                      background: '#f0fdf4',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      border: '1px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Stethoscope size={20} color="#16a34a" />
                      <div>
                        <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', letterSpacing: '0.04em' }}>
                          {currentLang === 'mr' ? 'आज उपलब्ध डॉक्टर' : currentLang === 'hi' ? 'आज उपलब्ध डॉक्टर' : 'Doctor Available Today'}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {primaryDoctor.full_name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {primaryDoctor.specialty} {primaryDoctor.room_number ? `• ${primaryDoctor.room_number}` : ''}
                        </div>
                      </div>
                    </div>

                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '9999px' }}>
                      {currentLang === 'mr' ? '✓ सध्या कर्तव्यावर' : currentLang === 'hi' ? '✓ अभी उपस्थित' : '✓ On Duty Now'}
                    </span>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginTop: '0.25rem' }}>
                    {/* GET DIRECTIONS (Uses in-app Map) */}
                    <button
                      type="button"
                      onClick={handleDirectionsClick}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: '#0d9488',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)'
                      }}
                    >
                      <Navigation size={17} />
                      <span>{currentLang === 'mr' ? 'दिशा मिळवा' : currentLang === 'hi' ? 'दिशा प्राप्त करें' : 'Get Directions'}</span>
                    </button>

                    {/* CALL FACILITY */}
                    <button
                      type="button"
                      onClick={() => {
                        const phone = recommendedFacility.phone || '02169-244120';
                        window.location.href = `tel:${phone}`;
                        showToast(`Calling ${recommendedFacility.name} at ${phone}`, 'info');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: '#ffffff',
                        color: '#0f766e',
                        border: '1.5px solid #0d9488',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <PhoneCall size={17} />
                      <span>{currentLang === 'mr' ? 'केंद्राला कॉल करा' : currentLang === 'hi' ? 'केंद्र को कॉल करें' : 'Call Facility'}</span>
                    </button>

                    {/* VIEW FACILITY DETAILS */}
                    <button
                      type="button"
                      onClick={handleDetailsClick}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: '#f8fafc',
                        color: '#334155',
                        border: '1.5px solid #cbd5e1',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Building2 size={17} />
                      <span>{currentLang === 'mr' ? 'तपशील पहा' : currentLang === 'hi' ? 'विवरण देखें' : 'View Details'}</span>
                    </button>

                    {/* BOOK OPD / GET TOKEN */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenBooking) {
                          onOpenBooking(recommendedFacility.id);
                        } else if (onOpenToken) {
                          onOpenToken();
                        } else {
                          setCurrentView('queue');
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                      }}
                    >
                      <Calendar size={17} />
                      <span>{currentLang === 'mr' ? 'ओपीडी/टोकन बुक करा' : currentLang === 'hi' ? 'ओपीडी/टोकन बुक करें' : 'Book OPD / Token'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SYMPTOMS IDENTIFIED BY THE AI ASSISTANT */}
              {chatResult && chatResult.identified_symptoms.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    {currentLang === 'mr' ? 'ओळखलेली लक्षणे:' : currentLang === 'hi' ? 'पहचाने गए लक्षण:' : 'Symptoms Identified:'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.45rem',
                      background: '#f8fafc',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {chatResult.identified_symptoms.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: chatResult.emergency_flag ? '#fee2e2' : '#fef3c7',
                          color: chatResult.emergency_flag ? '#991b1b' : '#b45309',
                          border: chatResult.emergency_flag ? '1px solid #fca5a5' : '1px solid #fde68a'
                        }}
                      >
                        <CheckCircle2 size={13} color={chatResult.emergency_flag ? '#dc2626' : '#d97706'} />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '0.6rem 1.25rem',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {isCompleted && (
              <button
                type="button"
                onClick={handleRetake}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} />
                <span>{currentLang === 'mr' ? 'पुन्हा तपासणी करा' : currentLang === 'hi' ? 'पुनः मूल्यांकन करें' : 'Retake Assessment'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '7px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {isCompleted
                ? (currentLang === 'mr' ? 'पूर्ण / डॅशबोर्डवर परत जा' : currentLang === 'hi' ? 'पूर्ण / डैशबोर्ड पर वापस जाएं' : 'Done / Return to Dashboard')
                : (currentLang === 'mr' ? 'बंद करा' : currentLang === 'hi' ? 'बंद करें' : 'Close')}
            </button>
          </div>
        </div>
      </div>

      {/* QUICK INLINE FACILITY DETAIL MODAL */}
      {isDetailModalOpen && selectedFacilityDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#ffffff',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedFacilityDetail.facility?.name}
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedFacilityDetail.facility?.address}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: '#334155' }}>
              <div>
                <strong>Phone: </strong> {selectedFacilityDetail.facility?.phone || '02169-244120'}
              </div>
              <div>
                <strong>Emergency 24x7: </strong> {selectedFacilityDetail.facility?.emergency_24x7 ? 'Available (Yes)' : 'No'}
              </div>
              <div>
                <strong>Doctors Available Today:</strong>
                <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                  {selectedFacilityDetail.doctors?.map((doc: any) => (
                    <li key={doc.id} style={{ marginBottom: '0.25rem' }}>
                      <strong>{doc.full_name}</strong> — {doc.specialty} ({doc.qualification})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Services:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {selectedFacilityDetail.services?.map((svc: any) => (
                    <span key={svc.id} style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                      {svc.service_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GET DIRECTIONS MAP OVERLAY (sits above the assessment result; closing
          it never navigates away, so the result underneath is unaffected) */}
      {isMapModalOpen && mapFacilityCoords && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              background: '#ffffff',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #093430 0%, #0d9488 100%)',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <Navigation size={19} color="#5eead4" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {recommendedFacility.name}
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#ccfbf1' }}>Get Directions</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                aria-label="Close map"
                title="Close"
                style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              <FacilityNavigationMap
                facility={{ lat: mapFacilityCoords.lat, lng: mapFacilityCoords.lng, name: recommendedFacility.name }}
                patient={mapPatientCoords}
                routeGeometry={mapRoute && !mapRouteIsEstimate ? mapRoute.geometry : null}
                onStop={() => setIsMapModalOpen(false)}
              />

              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#334155' }}>
                {mapLocating && <div style={{ color: '#64748b' }}>Locating you…</div>}
                {mapGeoError && <div style={{ color: '#b45309' }}>{mapGeoError}</div>}
                {mapRoute && (
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontWeight: 700, color: '#0f172a' }}>
                    <span>
                      Distance: {formatDistance(mapRoute.distanceMeters)}
                      {mapRouteIsEstimate ? ' (estimate)' : ''}
                    </span>
                    <span>
                      Est. Travel Time: {formatDuration(mapRoute.durationSeconds, !mapRouteIsEstimate)}
                    </span>
                  </div>
                )}
                {mapRouting && !mapRoute && <div style={{ color: '#64748b' }}>Calculating route…</div>}
                <div style={{ marginTop: '0.5rem', color: '#64748b' }}>
                  {recommendedFacility.address}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
