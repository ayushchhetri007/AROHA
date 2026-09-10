import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  Search, ArrowRight, Activity, HeartPulse, Ticket, PhoneCall, Sparkles, Package, User, AlertTriangle, Calendar, Clock, MapPin, X
} from 'lucide-react';
import { SymptomAssessmentModal } from './SymptomAssessmentModal';
import { EmergencyModal } from './EmergencyModal';

export const CitizenDashboard: React.FC<{
  onOpenBooking: (facilityId?: string) => void;
  onOpenTriage: () => void;
  onOpenEmergency?: () => void;
}> = ({ onOpenBooking, onOpenTriage, onOpenEmergency }) => {
  const {
    t,
    currentUser,
    patientProfile,
    lowLiteracyMode,
    playAudioPrompt,
    setCurrentView,
    setPendingFacilityType,
    setPendingFocusedFacilityId,
    showToast
  } = useDemo();

  // Symptom Assessment State
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isDirectEmergencyOpen, setIsDirectEmergencyOpen] = useState(false);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  const handleEmergencyClick = () => {
    if (onOpenEmergency) {
      onOpenEmergency();
    } else {
      setIsDirectEmergencyOpen(true);
    }
  };

  // Digital Triage recommends a care level -> hand it to the Facility Directory page
  // as a one-shot preselected type filter, then navigate there.
  const handleFilterByRecommendedType = (careType?: string) => {
    let targetType = '';
    if (!careType) {
      targetType = '';
    } else if (careType.includes('PHC') || careType.toLowerCase().includes('primary')) {
      targetType = 'PHC';
    } else if (careType.includes('Rural') || careType.includes('RH')) {
      targetType = 'Rural Hospital';
    } else if (careType.includes('Sub-District') || careType.includes('SDH')) {
      targetType = 'Sub-District Hospital';
    } else if (careType.includes('District') || careType.includes('DH') || careType.toLowerCase().includes('hospital')) {
      targetType = 'District Hospital';
    } else if (careType.includes('Sub-Centre')) {
      targetType = 'Sub-Centre';
    } else if (careType.includes('CHC')) {
      targetType = 'CHC';
    } else {
      targetType = careType;
    }

    setPendingFacilityType(targetType || null);
    setCurrentView('facilities');
  };

  const loadPatientData = async () => {
    try {
      const pId = patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : null);
      if (!pId) {
        setRecentAssessments([]);
        setUpcomingAppointments([]);
        return;
      }
      const [assessments, appts] = await Promise.all([
        api.getAssessments(pId).catch(() => []),
        api.getAppointments(pId).catch(() => [])
      ]);
      setRecentAssessments(assessments || []);
      // Filter strictly for active/upcoming appointments belonging to this authenticated patient
      const activeAppts = (appts || []).filter((a: any) => 
        ['confirmed', 'scheduled', 'waiting', 'in_queue', 'in_consultation'].includes((a.status || '').toLowerCase())
      );
      setUpcomingAppointments(activeAppts);
    } catch (e) {
      console.error('Error loading patient data', e);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await api.cancelAppointment(appointmentId);
      showToast(t.appointmentCancelled || 'Appointment cancelled successfully', 'info');
      loadPatientData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  useEffect(() => {
    loadPatientData();

    const handleRefresh = () => {
      loadPatientData();
    };

    window.addEventListener('seva_appointment_created', handleRefresh);
    window.addEventListener('seva_assessment_updated', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      window.removeEventListener('seva_appointment_created', handleRefresh);
      window.removeEventListener('seva_assessment_updated', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [patientProfile?.id, currentUser?.id]);

  const patientDisplayName = patientProfile?.full_name || (currentUser?.role === 'patient' ? currentUser?.full_name : null) || 'Citizen Beneficiary';
  const patientIdDisplay = patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : null) || '';

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* 1. WELCOME & PATIENT ID HEADER */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 2rem',
          marginBottom: '1.75rem',
          borderLeft: '6px solid #0d9488',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.25rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.4rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
            }}
          >
            {patientDisplayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'PT'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                {t.welcome}, {patientDisplayName}
              </h2>
              {patientProfile?.abha_id && (
                <span
                  style={{
                    background: '#ccfbf1',
                    color: '#0f766e',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid #99f6e4'
                  }}
                >
                  {t.abhaActive}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', flexWrap: 'wrap', fontSize: '0.86rem', color: '#475569' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={15} color="#0d9488" />
                {t.patientLabel}: <strong style={{ color: '#0f172a' }}>{patientDisplayName}</strong>
              </span>
              <span>•</span>
              <span>
                {t.patientIdLabel}: <strong style={{ color: '#0f766e' }}>{patientIdDisplay}</strong>
              </span>
              {patientProfile?.abha_id && (
                <>
                  <span>•</span>
                  <span>{t.abhaIdLabel}: <strong>{patientProfile.abha_id}</strong></span>
                </>
              )}
              {patientProfile?.blood_group && (
                <>
                  <span>•</span>
                  <span>{t.bloodGroupLabel}: <strong>{patientProfile.blood_group}</strong></span>
                </>
              )}
              {(patientProfile?.village || patientProfile?.district) && (
                <>
                  <span>•</span>
                  <span>{t.locationLabel}: <strong>{[patientProfile.village, patientProfile.taluka, patientProfile.district].filter(Boolean).join(', ')}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL ACTION SECTION: CHECK YOUR SYMPTOMS + DIRECT EMERGENCY 24X7 */}
      <div className="patient-triage-emergency-grid">
        {/* CARD A: CHECK YOUR SYMPTOMS (DIGITAL TRIAGE) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #093430 0%, #0f4c45 60%, #115e59 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '1.75rem 2rem',
            boxShadow: '0 10px 25px -5px rgba(15, 76, 69, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#99f6e4',
                marginBottom: '0.75rem'
              }}
            >
              <Sparkles size={14} /> {t.preliminaryTriageBadge}
            </div>

            <h3 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              {t.checkYourSymptoms}
            </h3>

            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.94rem', lineHeight: 1.6, color: '#ccfbf1', opacity: 0.95 }}>
              {t.checkSymptomsDesc}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setIsAssessmentOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem 1.6rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(20, 184, 166, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <Activity size={19} />
              <span>{t.startHealthAssessment || t.checkYourSymptomsBtn}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        {/* CARD B: DIRECT EMERGENCY 24X7 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 55%, #b91c1c 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '1.75rem 2rem',
            boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1.5px solid rgba(254, 202, 202, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.18)',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#fee2e2',
                marginBottom: '0.75rem'
              }}
            >
              <AlertTriangle size={14} /> {t.emergencyResponseBadge}
            </div>

            <h3 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚑</span> {t.emergency24x7Btn || t.emergency24x7 || 'Emergency 24X7'}
            </h3>

            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.94rem', lineHeight: 1.6, color: '#fecaca', opacity: 0.95 }}>
              {t.emergencyAssistanceDesc}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleEmergencyClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                background: '#ffffff',
                color: '#b91c1c',
                border: 'none',
                padding: '0.9rem 1.6rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <PhoneCall size={19} color="#b91c1c" />
              <span>{t.emergency24x7Btn || 'Emergency 24X7'}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. UPCOMING APPOINTMENT (COMPACT CONTEXTUAL STATUS ONLY IF APPOINTMENT EXISTS) */}
      {upcomingAppointments.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
            borderRadius: '14px',
            border: '1.5px solid #99f6e4',
            padding: '1.15rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 15px rgba(13, 148, 136, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                color: '#ffffff',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.86rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)'
              }}
            >
              Token #{upcomingAppointments[0].token_number || upcomingAppointments[0].queue_token || '1'}
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#0d9488', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>
                {t.upcomingAppointmentCompact || 'UPCOMING APPOINTMENT'}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {upcomingAppointments[0].facility_name || 'Primary Health Centre Shirwal'}
              </div>
              <div style={{ fontSize: '0.86rem', color: '#475569', marginTop: '0.2rem' }}>
                <strong style={{ color: '#0f766e' }}>{upcomingAppointments[0].doctor_name || (t.generalOpdDoctor || 'Dr. Anand Deshmukh')}</strong> • {upcomingAppointments[0].appointment_date} • {upcomingAppointments[0].time_slot || '10:30 AM'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setCurrentView('queue')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)'
              }}
            >
              <Ticket size={16} />
              <span>{t.trackQueue || 'Track Queue'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleCancelAppointment(upcomingAppointments[0].id)}
              title={t.cancelAppointment || 'Cancel'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '0.65rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 5-8. YOUR HEALTHCARE SERVICES (2x2 CARD GRID) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {t.yourHealthcareServices}
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0.35rem 0 0 0' }}>
            {t.servicesDesc}
          </p>
        </div>

        <div className="healthcare-services-grid">
          {/* Card 1: Find Nearby Facility */}
          <div
            className="healthcare-service-card"
            role="button"
            tabIndex={0}
            onClick={() => {
              setPendingFacilityType(null);
              setCurrentView('facilities');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPendingFacilityType(null);
                setCurrentView('facilities');
              }
            }}
          >
            <div>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1.5px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)'
                }}
              >
                <Search size={24} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.45rem 0' }}>
                {t.facilityDirectoryCardTitle}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                {t.facilityDirectoryCardDesc}
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <div className="card-action-btn" style={{ color: '#2563eb' }}>
                <span>{t.exploreFacilities}</span>
                <ArrowRight size={17} />
              </div>
            </div>
          </div>

          {/* Card 2: Live Token Queue */}
          <div
            className="healthcare-service-card"
            role="button"
            tabIndex={0}
            onClick={() => setCurrentView('queue')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentView('queue');
              }
            }}
          >
            <div>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#faf5ff',
                  color: '#7c3aed',
                  border: '1.5px solid #ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.1)'
                }}
              >
                <Ticket size={24} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.45rem 0' }}>
                {t.liveQueueCardTitle}
              </h4>
              {/* An appointment token alone does not mean the patient is in
                  the live queue - queue_status is 'booked' until the patient
                  explicitly checks in. Only a genuine live-queue status
                  should surface a token summary here. */}
              {upcomingAppointments.length > 0 && upcomingAppointments[0].queue_status && upcomingAppointments[0].queue_status !== 'booked' ? (
                <div style={{ background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '0.75rem 0.9rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#7c3aed' }}>
                      Token #{upcomingAppointments[0].token_number || upcomingAppointments[0].queue_token || '1'}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      {t.waitingInQueue || 'Waiting in Queue'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                    {upcomingAppointments[0].facility_name || 'Primary Health Centre Shirwal'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                    {t.estimatedWait || 'Estimated wait'}: ~{upcomingAppointments[0].estimated_wait_minutes || 15} min
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                  {t.liveQueueCardDesc}
                </p>
              )}
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <div className="card-action-btn" style={{ color: '#7c3aed' }}>
                <span>{upcomingAppointments.length > 0 && upcomingAppointments[0].queue_status && upcomingAppointments[0].queue_status !== 'booked' ? (t.trackLiveQueue || t.openLiveTracker) : t.openLiveTracker}</span>
                <ArrowRight size={17} />
              </div>
            </div>
          </div>

          {/* Card 3: Inventory */}
          <div
            className="healthcare-service-card"
            role="button"
            tabIndex={0}
            onClick={() => setCurrentView('medicines')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentView('medicines');
              }
            }}
          >
            <div>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#fff7ed',
                  color: '#ea580c',
                  border: '1.5px solid #ffedd5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.1)'
                }}
              >
                <Package size={24} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.45rem 0' }}>
                {t.inventoryCardTitle}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                {t.inventoryCardDesc}
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <div className="card-action-btn" style={{ color: '#ea580c' }}>
                <span>{t.checkStock}</span>
                <ArrowRight size={17} />
              </div>
            </div>
          </div>

          {/* Card 4: Longitudinal Health Records */}
          <div
            className="healthcare-service-card"
            role="button"
            tabIndex={0}
            onClick={() => setCurrentView('ehr')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentView('ehr');
              }
            }}
          >
            <div>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#f0fdfa',
                  color: '#0d9488',
                  border: '1.5px solid #ccfbf1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 2px 6px rgba(13, 148, 136, 0.1)'
                }}
              >
                <HeartPulse size={24} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.45rem 0' }}>
                {t.recordsCardTitle}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                {t.recordsCardDesc}
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <div className="card-action-btn" style={{ color: '#0d9488' }}>
                <span>{t.viewRecords}</span>
                <ArrowRight size={17} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Symptom Assessment Stepped Modal */}
      <SymptomAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => {
          setIsAssessmentOpen(false);
          loadPatientData();
        }}
        onOpenBooking={(facId) => {
          setIsAssessmentOpen(false);
          onOpenBooking(facId);
        }}
        onOpenToken={() => {
          setIsAssessmentOpen(false);
          setCurrentView('queue');
        }}
        onOpenEmergency={() => {
          setIsAssessmentOpen(false);
          if (onOpenEmergency) onOpenEmergency();
          else onOpenTriage();
        }}
        onGetDirections={(facId) => {
          setIsAssessmentOpen(false);
          setPendingFocusedFacilityId(facId);
          setCurrentView('facilities');
        }}
        onViewFacilityDetails={(facId) => {
          setIsAssessmentOpen(false);
          setPendingFocusedFacilityId(facId);
          setCurrentView('facilities');
        }}
        onExploreFacilities={handleFilterByRecommendedType}
      />

      {/* Fallback Direct Emergency Modal */}
      {!onOpenEmergency && (
        <EmergencyModal
          isOpen={isDirectEmergencyOpen}
          onClose={() => setIsDirectEmergencyOpen(false)}
        />
      )}
    </div>
  );
};
