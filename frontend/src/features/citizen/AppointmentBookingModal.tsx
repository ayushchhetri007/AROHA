import React, { useState, useEffect, useRef } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  Calendar, CheckCircle2, X, Stethoscope, ArrowRight, ArrowLeft,
  Ticket, MapPin, Activity, FileText, ShieldAlert, PhoneCall, Clock,
  AlertTriangle, Building2, Check, RotateCcw, Mic
} from 'lucide-react';
import { TRIAGE_CATEGORY_STYLES } from './triageEngine';
import { SymptomChatAssessment, GeminiTriageResult } from './SymptomChatAssessment';

// Builds a brief, patient-friendly (non-diagnostic) sentence from the
// symptom names Gemini identified (or reported directly), in the given
// language. Never invents or asserts a disease/diagnosis - purely reflects
// what was reported.
function buildSymptomSummarySentence(reportedNames: string[], lang: 'en' | 'hi' | 'mr'): string {
  if (reportedNames.length === 0) {
    return lang === 'mr'
      ? 'या तपासणीमध्ये समाविष्ट असलेली कोणतीही लक्षणे तुम्ही नोंदवली नाहीत.'
      : lang === 'hi'
      ? 'आपने इस मूल्यांकन में शामिल किसी भी लक्षण की सूचना नहीं दी।'
      : 'You did not report any of the symptoms covered in this assessment.';
  }

  const and = lang === 'mr' ? 'आणि' : lang === 'hi' ? 'और' : 'and';
  const joined = reportedNames.length === 1
    ? reportedNames[0]
    : reportedNames.length === 2
    ? `${reportedNames[0]} ${and} ${reportedNames[1]}`
    : `${reportedNames.slice(0, -1).join(', ')}, ${and} ${reportedNames[reportedNames.length - 1]}`;

  return lang === 'mr'
    ? `तुमच्या उत्तरांनुसार, तुम्ही ${joined} नोंदवले आहे.`
    : lang === 'hi'
    ? `आपके उत्तरों के अनुसार, आपने ${joined} की सूचना दी है।`
    : `Based on your responses, you reported ${joined}.`;
}

export const AppointmentBookingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  defaultFacilityId?: string;
  onSuccess?: (appointment: any) => void;
}> = ({ isOpen, onClose, defaultFacilityId, onSuccess }) => {
  const { t, language, currentUser, patientProfile, setCurrentView, showToast } = useDemo();

  // Wizard state: 1 (Symptoms), 2 (Patient Details), 3 (Doctor), 4 (Date), 5 (Slot), 6 (Summary), 7 (Confirmed)
  const [currentStep, setCurrentStep] = useState<number>(1);
  // 'chat' = AI symptom chatbot (optional suggested tags + free text, sent to
  // Gemini). 'additional_details' = post-assessment Step 1 view: an
  // assessment is already complete, so this shows ONLY an optional
  // supplementary-notes field instead of the chatbot.
  const [symptomMode, setSymptomMode] = useState<'chat' | 'guidance' | 'emergency_blocked' | 'additional_details'>('chat');

  // Optional supplementary notes added AFTER a completed structured
  // assessment - kept entirely separate from the assessment's own
  // YES/NO answers/results, which are never overwritten by this.
  const [additionalDetailsText, setAdditionalDetailsText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any | null>(null);

  // Guidance state
  const [guidanceResult, setGuidanceResult] = useState<{
    symptomsList: string[];
    careLevel: string;
    careLevelType: 'SELF_CARE' | 'PHC' | 'HIGHER_LEVEL' | 'EMERGENCY';
    guidanceText: string;
    badgeColor: string;
    badgeBg: string;
  }>({
    symptomsList: ['General Medical Evaluation'],
    careLevel: 'PRIMARY CARE RECOMMENDED',
    careLevelType: 'PHC',
    guidanceText: 'A Primary Health Centre evaluation may be appropriate.',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7'
  });
  // Brief, patient-friendly, non-diagnostic recap of the completed
  // assessment's actual YES answers, in the selected language.
  const [symptomSummarySentence, setSymptomSummarySentence] = useState<string>('');

  // Facility & Appointment state
  const [facilityId, setFacilityId] = useState<string>(defaultFacilityId || 'fac-phc-shirwal');
  const [facilityDetail, setFacilityDetail] = useState<any | null>(null);
  const [facilitiesList, setFacilitiesList] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('10:30 AM');
  const [reason, setReason] = useState<string>('General Consultation');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const currentLang = language === 'mr' ? 'mr' : language === 'hi' ? 'hi' : 'en';

  // Authenticated patient details (strictly from session/profile)
  const patientDisplayName = patientProfile?.full_name || (currentUser?.role === 'patient' ? currentUser?.full_name : null) || 'Rahul Kumar';
  const patientIdDisplay = patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : null) || 'P-10452';
  const patientPhoneDisplay = patientProfile?.phone || currentUser?.phone || '9823455789';
  const patientAbhaDisplay = patientProfile?.abha_id || null;

  const availableTimeSlots = [
    '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'
  ];

  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const dayName = i === 0 
        ? (currentLang === 'mr' ? 'आज' : currentLang === 'hi' ? 'आज' : 'Today')
        : i === 1 
          ? (currentLang === 'mr' ? 'उद्या' : currentLang === 'hi' ? 'कल' : 'Tomorrow')
          : d.toLocaleDateString(currentLang === 'mr' ? 'mr-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      dates.push({ iso: isoStr, label: `${dayName} (${formattedDate})` });
    }
    return dates;
  };

  const quickDates = getDateOptions();

  // Assessment state
  const [existingAssessment, setExistingAssessment] = useState<any | null>(null);
  const [checkingAssessment, setCheckingAssessment] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setConfirmedAppointment(null);
    setAdditionalDetailsText('');
    setIsListening(false);
    setVoiceError(null);

    const targetId = defaultFacilityId || facilityId || 'fac-phc-shirwal';
    setFacilityId(targetId);
    loadFacility(targetId);
    api.getFacilities().then(res => setFacilitiesList(res || [])).catch(() => {});

    const activePatientId = patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : null) || patientIdDisplay;

    // Check whether the authenticated patient already has a valid completed health assessment
    setCheckingAssessment(true);
    api.getAssessments(activePatientId)
      .then((assessments) => {
        // Look for completed assessment strictly belonging to this patient
        const validAssessment = Array.isArray(assessments) && assessments.length > 0
          ? assessments.find((a: any) => a.patient_id === activePatientId || !a.patient_id) || assessments[0]
          : null;

        if (validAssessment && validAssessment.triage_level) {
          // Assessment exists!
          setExistingAssessment(validAssessment);

          // Parse symptoms
          let symList: string[] = [];
          try {
            if (typeof validAssessment.symptoms_json === 'string') {
              symList = JSON.parse(validAssessment.symptoms_json);
            } else if (Array.isArray(validAssessment.symptoms)) {
              symList = validAssessment.symptoms;
            }
          } catch {
            symList = [validAssessment.symptoms_json || 'Reported symptoms'];
          }
          if (!Array.isArray(symList) || symList.length === 0) {
            symList = ['General Medical Evaluation'];
          }

          const tLevel = (validAssessment.triage_level || 'PHC').toUpperCase();
          const isEmergency = validAssessment.emergency_flag === 1 || tLevel === 'EMERGENCY';

          let careLabel = 'PRIMARY CARE RECOMMENDED';
          let guidanceNote = validAssessment.recommendation || 'A Primary Health Centre evaluation may be appropriate.';
          let badgeCol = '#b45309';
          let badgeBgCol = '#fef3c7';
          let careType: 'SELF_CARE' | 'PHC' | 'HIGHER_LEVEL' | 'EMERGENCY' = 'PHC';

          if (isEmergency) {
            careLabel = 'EMERGENCY CARE RECOMMENDED';
            careType = 'EMERGENCY';
            badgeCol = '#dc2626';
            badgeBgCol = '#fee2e2';
          } else if (tLevel.includes('SELF')) {
            careLabel = 'SELF-CARE / MILD SYMPTOMS';
            careType = 'SELF_CARE';
            badgeCol = '#059669';
            badgeBgCol = '#d1fae5';
          } else if (tLevel.includes('HIGHER') || tLevel.includes('SECONDARY') || tLevel.includes('CHC') || tLevel.includes('HOSPITAL')) {
            careLabel = 'SECONDARY CARE RECOMMENDED';
            careType = 'HIGHER_LEVEL';
            badgeCol = '#c2410c';
            badgeBgCol = '#ffedd5';
          }

          setGuidanceResult({
            symptomsList: symList,
            careLevel: careLabel,
            careLevelType: careType,
            guidanceText: guidanceNote,
            badgeColor: badgeCol,
            badgeBg: badgeBgCol
          });
          setSymptomSummarySentence(buildSymptomSummarySentence(symList, currentLang));

          setReason(symList.slice(0, 3).join(', '));

          // FLOW A: Assessment already completed - stay on Step 1 but show
          // only the optional "Add More Details" supplementary-notes screen,
          // never the AI symptom chatbot again. The assessment's own results
          // (guidanceResult/existingAssessment, set above) are left untouched
          // and remain available to later steps.
          setSymptomMode('additional_details');
          setCurrentStep(1);
        } else {
          // FLOW B: No completed assessment found
          setExistingAssessment(null);
          setCurrentStep(1);
          setSymptomMode('chat');
        }
      })
      .catch((err) => {
        console.error('Failed to load patient assessment:', err);
        setExistingAssessment(null);
        setCurrentStep(1);
        setSymptomMode('chat');
      })
      .finally(() => {
        setCheckingAssessment(false);
      });
  }, [isOpen, defaultFacilityId, patientProfile?.id, currentUser?.id]);

  const handleStartRetake = () => {
    setSymptomMode('chat');
    setCurrentStep(1);
  };

  // Reuses the same additionalDetailsText field for voice input - speech is
  // transcribed into it, never stored separately, so the patient can always
  // review/edit what was heard before continuing. Purely local to this
  // modal; no shared/global speech service exists elsewhere in the app.
  const startVoiceInput = () => {
    setVoiceError(null);
    const SpeechRecognitionCtor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceError(
        currentLang === 'mr'
          ? 'या ब्राउझरमध्ये आवाज इनपुट उपलब्ध नाही. कृपया टाइप करा.'
          : currentLang === 'hi'
            ? 'इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। कृपया टाइप करें।'
            : 'Voice input is not supported in this browser. Please type instead.'
      );
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = currentLang === 'mr' ? 'mr-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any)
        .map((r: any) => r[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setAdditionalDetailsText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      }
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event?.error === 'no-speech') return;
      setVoiceError(
        currentLang === 'mr'
          ? 'आवाज ऐकता आला नाही. कृपया पुन्हा प्रयत्न करा किंवा टाइप करा.'
          : currentLang === 'hi'
            ? 'आवाज़ नहीं पहचानी जा सकी। कृपया फिर से प्रयास करें या टाइप करें।'
            : 'Could not capture voice input. Please try again or type instead.'
      );
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Continuing from the optional Add More Details screen merges the
  // supplementary note into the booking's reason field only - the
  // completed assessment's own results/answers are never modified.
  const handleContinueFromAdditionalDetails = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    const trimmed = additionalDetailsText.trim();
    if (trimmed) {
      setReason((prev) => (prev ? `${prev} | ${trimmed}` : trimmed));
    }
    setCurrentStep(2);
  };

  const loadFacility = async (id: string) => {
    setLoadingDetails(true);
    try {
      const data = await api.getFacilityById(id);
      setFacilityDetail(data);
      const availableDocs = (data?.doctors || []).filter((d: any) => d.is_available_today !== 0);
      setDoctors(availableDocs);
      setSelectedDoctorId(availableDocs.length > 0 ? availableDocs[0].id : '');
    } catch (e) {
      console.error('Failed loading facility details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  // STEP 1 OPTION A: Existing Health Assessment (10 questions, strict completion unless emergency)
  // AI symptom chatbot completion: replaces the old fixed 10-question Yes/No
  // triage and the separate free-text "Describe Symptoms" form - Gemini's
  // structured response covers both (identified symptoms + a triage
  // category) from either optional suggested tags, free-typed text, or both.
  const handleBookingChatComplete = (result: GeminiTriageResult, symptomsText: string) => {
    const style = TRIAGE_CATEGORY_STYLES[result.triage_level];
    const symptomsSummaryList = result.identified_symptoms.length > 0
      ? result.identified_symptoms
      : [symptomsText || 'General symptom report'];

    setGuidanceResult({
      symptomsList: symptomsSummaryList,
      careLevel: style.title[currentLang],
      careLevelType: result.triage_level,
      guidanceText: result.recommendation,
      badgeColor: style.badgeColor,
      badgeBg: style.badgeBg
    });
    setSymptomSummarySentence(result.patient_message);
    setReason(symptomsSummaryList.slice(0, 3).join(', '));

    // Always continue to the brief symptom summary - never a blocking
    // emergency screen - within this booking flow.
    setSymptomMode('guidance');

    // Persist the completed assessment to backend so subsequent bookings and longitudinal records have it
    const activePId = patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : null) || patientIdDisplay;
    api.saveAssessment({
      patient_id: activePId,
      symptoms: symptomsSummaryList,
      triage_level: result.triage_level,
      recommendation: result.recommendation,
      recommended_facility_id: facilityId,
      emergency_flag: result.emergency_flag
    }).then((res) => {
      if (res?.assessment) {
        setExistingAssessment(res.assessment);
      }
      window.dispatchEvent(new CustomEvent('seva_assessment_updated', {
        detail: { patientId: activePId, assessment: res?.assessment }
      }));
    }).catch((e) => {
      console.error('Error saving assessment:', e);
    });
  };

  // STEP 7: Submit appointment to backend
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const selectedDoc = doctors.find(d => d.id === selectedDoctorId);
      const res = await api.createAppointment({
        facility_id: facilityId,
        doctor_id: selectedDoctorId || null,
        service_name: selectedDoc?.specialty || 'General Medicine OPD',
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        priority: 'normal',
        reason: `${reason} [Guidance: ${guidanceResult.careLevelType}]`,
        patient_id: patientIdDisplay
      });

      showToast(t.appointmentConfirmed || 'Appointment confirmed successfully!', 'success');
      setConfirmedAppointment(res.appointment);
      setCurrentStep(7);
      window.dispatchEvent(new CustomEvent('seva_appointment_created', { detail: res.appointment }));
      if (onSuccess) onSuccess(res.appointment);
    } catch (err: any) {
      console.error('Appointment booking error:', err);
      showToast(err.message || 'Booking failed. Please check network connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorObj = doctors.find(d => d.id === selectedDoctorId);

  const stepLabels = [
    { num: 1, label: currentLang === 'mr' ? 'लक्षणे' : currentLang === 'hi' ? 'लक्षण' : 'Symptoms' },
    { num: 2, label: currentLang === 'mr' ? 'रुग्ण' : currentLang === 'hi' ? 'रोगी' : 'Patient' },
    { num: 3, label: currentLang === 'mr' ? 'डॉक्टर' : currentLang === 'hi' ? 'डॉक्टर' : 'Doctor' },
    { num: 4, label: currentLang === 'mr' ? 'दिनांक' : currentLang === 'hi' ? 'तारीख' : 'Date' },
    { num: 5, label: currentLang === 'mr' ? 'वेळ' : currentLang === 'hi' ? 'समय' : 'Slot' },
    { num: 6, label: currentLang === 'mr' ? 'पुष्टी' : currentLang === 'hi' ? 'पुष्टि' : 'Confirm' },
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 120,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '640px',
        background: '#ffffff',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          background: confirmedAppointment
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : symptomMode === 'emergency_blocked'
              ? 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)'
              : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
          color: '#ffffff',
          padding: '1.2rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {confirmedAppointment ? (
              <CheckCircle2 size={24} style={{ color: '#ffffff' }} />
            ) : symptomMode === 'emergency_blocked' ? (
              <ShieldAlert size={24} style={{ color: '#ffffff' }} />
            ) : (
              <Calendar size={22} style={{ color: '#ffffff' }} />
            )}
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {confirmedAppointment
                  ? (t.appointmentConfirmed || 'Appointment Confirmed')
                  : symptomMode === 'emergency_blocked'
                    ? (t.emergencyCareRecommended || 'Emergency Care Recommended')
                    : (t.bookAppointment || 'Book Appointment')}
              </h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '2px 0 0 0' }}>
                {confirmedAppointment
                  ? `${facilityDetail?.name || 'Primary Health Centre'} • Token #${confirmedAppointment.token_number || '12'}`
                  : symptomMode === 'emergency_blocked'
                    ? 'Immediate Emergency Escalation'
                    : `${facilityDetail?.name || 'Selected Facility'} • ${stepLabels.find(s => s.num === currentStep)?.label || ''}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator (Steps 1 to 6) */}
        {!confirmedAppointment && symptomMode !== 'emergency_blocked' && (
          <div style={{
            background: '#f8fafc',
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '20px',
                right: '20px',
                height: '3px',
                background: '#e2e8f0',
                zIndex: 1
              }}>
                <div style={{
                  height: '100%',
                  background: '#0d9488',
                  width: `${((currentStep - 1) / 5) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {stepLabels.map((s) => {
                const isPassed = currentStep > s.num;
                const isCurrent = currentStep === s.num;
                return (
                  <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isPassed ? '#0d9488' : isCurrent ? '#0f766e' : '#ffffff',
                      color: isPassed || isCurrent ? '#ffffff' : '#64748b',
                      border: isCurrent ? '2px solid #0d9488' : isPassed ? '2px solid #0d9488' : '2px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      boxShadow: isCurrent ? '0 0 0 3px rgba(13, 148, 136, 0.2)' : 'none'
                    }}>
                      {isPassed ? <Check size={14} /> : s.num}
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      marginTop: '0.25rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? '#0f766e' : '#64748b'
                    }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          
          {/* STEP 7: CONFIRMED APPOINTMENT */}
          {confirmedAppointment ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46', margin: '0 0 0.25rem' }}>
                ✓ {t.appointmentConfirmed || 'APPOINTMENT CONFIRMED'}
              </h4>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {currentLang === 'mr' ? 'तुमची भेट नोंदणी यशस्वी झाली आहे.' : currentLang === 'hi' ? 'आपका अपॉइंटमेंट सफलतापूर्वक दर्ज हो गया है।' : 'Your appointment has been successfully scheduled.'}
              </p>

              {/* Live Token Queue Card */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '2px dashed #059669',
                borderRadius: '1rem',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <Ticket size={18} />
                  <span>{currentLang === 'mr' ? 'थेट रांग टोकन क्रमांक' : currentLang === 'hi' ? 'लाइव कतार टोकन नंबर' : 'LIVE TOKEN QUEUE'}</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#047857', letterSpacing: '1px' }}>
                  #{confirmedAppointment.token_number || '12'}
                </div>
                <div style={{ display: 'inline-block', background: '#059669', color: '#ffffff', padding: '0.2rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  {confirmedAppointment.status || 'Confirmed'} • {currentLang === 'mr' ? 'सक्रिय' : currentLang === 'hi' ? 'सक्रिय' : 'Active'}
                </div>
              </div>

              {/* Confirmed Details Table */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.85rem',
                border: '1px solid #e2e8f0',
                padding: '1.2rem',
                textAlign: 'left',
                fontSize: '0.88rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'रुग्णाचे नाव' : currentLang === 'hi' ? 'रोगी का नाम' : 'Patient'}</span>
                    <strong style={{ color: '#1e293b' }}>{patientDisplayName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'रुग्ण आयडी' : currentLang === 'hi' ? 'रोगी आईडी' : 'Patient ID'}</span>
                    <strong style={{ color: '#0f766e' }}>{patientIdDisplay}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'आरोग्य केंद्र' : currentLang === 'hi' ? 'स्वास्थ्य केंद्र' : 'Facility'}</span>
                    <strong style={{ color: '#1e293b' }}>{facilityDetail?.name || 'Primary Health Centre Shirwal'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'डॉक्टर' : currentLang === 'hi' ? 'डॉक्टर' : 'Doctor'}</span>
                    <strong style={{ color: '#1e293b' }}>{selectedDoctorObj?.name || (t.generalOpdDoctor || 'General OPD Medical Officer')}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'विशेषज्ञता' : currentLang === 'hi' ? 'विशेषज्ञता' : 'Specialty'}</span>
                    <strong style={{ color: '#1e293b' }}>{selectedDoctorObj?.specialty || 'General Medicine'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'दिनांक' : currentLang === 'hi' ? 'तारीख' : 'Date'}</span>
                    <strong style={{ color: '#1e293b' }}>{appointmentDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'वेळ' : currentLang === 'hi' ? 'समय' : 'Time'}</span>
                    <strong style={{ color: '#1e293b' }}>{timeSlot}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>{currentLang === 'mr' ? 'नोंदणी क्रमांक' : currentLang === 'hi' ? 'अपॉइंटमेंट आईडी' : 'Appointment ID'}</span>
                    <span style={{ fontFamily: 'monospace', color: '#475569', fontSize: '0.8rem' }}>{confirmedAppointment.id || 'APT-2026-0909'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCurrentView('timeline');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem 1rem',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={18} />
                  <span>{t.viewAppointment || 'View Appointment'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setCurrentView('queue');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem 1rem',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <Ticket size={18} />
                  <span>{t.trackLiveQueue || 'Track Live Queue'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* ============================================================ */}
              {/* STEP 1: SYMPTOMS FIRST                                      */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <div>
                  {/* Mode A/B Selection */}
                  {symptomMode === 'chat' && (
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: '#ccfbf1',
                          color: '#0f766e',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '2rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '0.65rem'
                        }}>
                          <Activity size={14} />
                          <span>Step 1 of 6</span>
                        </div>
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
                          {t.tellUsAboutSymptoms || 'Tell us about your symptoms'}
                        </h4>
                        <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                          {t.symptomsIntro || 'Before booking your appointment, tell us what you are experiencing so we can guide you toward the appropriate care.'}
                        </p>
                      </div>

                      <SymptomChatAssessment currentLang={currentLang} onComplete={handleBookingChatComplete} />
                    </div>
                  )}

                  {/* EMERGENCY RED FLAG SCREEN */}
                  {symptomMode === 'emergency_blocked' && (
                    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                      <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: '#fee2e2',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem'
                      }}>
                        <ShieldAlert size={40} />
                      </div>

                      <div style={{
                        background: '#fef2f2',
                        border: '2px solid #ef4444',
                        borderRadius: '1rem',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                          <AlertTriangle size={22} />
                          <span>{t.emergencyCareRecommended || '⚠️ EMERGENCY CARE RECOMMENDED'}</span>
                        </div>
                        <p style={{ color: '#7f1d1d', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 0.75rem' }}>
                          {t.emergencyWarningText || 'Your response may indicate a symptom that requires immediate medical attention. Please seek emergency medical care.'}
                        </p>
                      </div>

                      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <a
                          href="tel:108"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '1rem',
                            background: '#dc2626',
                            color: '#ffffff',
                            borderRadius: '0.75rem',
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)'
                          }}
                        >
                          <PhoneCall size={20} />
                          <span>{t.emergencyAssistanceBtn || 'Emergency Assistance (Call 108)'}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            setCurrentView('facilities');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.85rem',
                            background: '#ffffff',
                            border: '1.5px solid #dc2626',
                            color: '#dc2626',
                            borderRadius: '0.75rem',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <MapPin size={18} />
                          <span>{t.findNearestEmergencyFacility || 'Find Nearest Emergency Facility'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSymptomMode('chat');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {currentLang === 'mr' ? '← परत जा / लक्षणे बदला' : currentLang === 'hi' ? '← वापस जाएं / लक्षण बदलें' : '← Return to Booking / Change Symptoms'}
                      </button>
                    </div>
                  )}

                  {/* PRELIMINARY GUIDANCE SUMMARY */}
                  {symptomMode === 'guidance' && (
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                        <div style={{
                          display: 'inline-block',
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginBottom: '0.5rem'
                        }}>
                          {t.symptomSummary || 'SYMPTOM SUMMARY'}
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                          {t.preliminaryCareGuidance || 'Preliminary Care Guidance'}
                        </h4>
                      </div>

                      {/* Reported Symptoms Tags */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.85rem',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                          {t.reportedSymptoms || 'Reported symptoms:'}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {guidanceResult.symptomsList.map((sym, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '1rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#1e293b'
                              }}
                            >
                              {sym}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Brief, patient-friendly symptom summary - built from the
                          patient's actual answers, in their selected language.
                          Deliberately neutral (not a diagnosis, not an
                          emergency-styled alert) regardless of triage category. */}
                      <div style={{
                        background: '#f0fdfa',
                        border: '1.5px solid #99f6e4',
                        borderRadius: '0.85rem',
                        padding: '1.15rem',
                        marginBottom: '1.25rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f766e', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                          <Activity size={18} />
                          <span>{currentLang === 'mr' ? 'तुमच्या नोंदवलेल्या लक्षणांचा सारांश' : currentLang === 'hi' ? 'आपके बताए गए लक्षणों का सारांश' : 'Summary of Your Reported Symptoms'}</span>
                        </div>
                        <p style={{ color: '#1e293b', fontSize: '0.88rem', margin: 0, lineHeight: 1.4 }}>
                          {symptomSummarySentence}
                        </p>
                      </div>

                      {/* Medical Disclaimer Note (Strictly Decision Support, No Diagnosis) */}
                      <div style={{
                        padding: '0.75rem 1rem',
                        background: '#f8fafc',
                        borderLeft: '4px solid #0d9488',
                        borderRadius: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#475569',
                        lineHeight: 1.4,
                        marginBottom: '1.5rem'
                      }}>
                        {t.preliminaryGuidanceDisclaimer || 'This is preliminary guidance and does not replace examination by a qualified healthcare professional. Your reported symptoms may require medical evaluation.'}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (existingAssessment) {
                                setCurrentStep(2);
                              } else {
                                setSymptomMode('chat');
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            <ArrowLeft size={16} />
                            <span>{existingAssessment ? (t.patientDetails || 'Patient Details') : (t.previousBtn || 'Previous')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleStartRetake}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              padding: '0.45rem 0.8rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <RotateCcw size={13} />
                            <span>{currentLang === 'mr' ? 'पुन्हा तपासणी करा' : currentLang === 'hi' ? 'पुनः मूल्यांकन करें' : 'Retake Assessment'}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          style={{
                            padding: '0.85rem 1.6rem',
                            background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.3)'
                          }}
                        >
                          <span>{t.continueBooking || 'Continue Booking'}</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Post-assessment Symptoms step: an assessment is already
                      complete (see on-open effect / FLOW A) - this shows ONLY
                      an optional supplementary-notes field, never the AI
                      symptom chatbot again. Typing, speaking, or leaving it
                      blank are all valid; Continue is never blocked on this
                      field. */}
                  {symptomMode === 'additional_details' && (
                    <div>
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                        borderRadius: '0.85rem',
                        border: '1.5px solid #0d9488',
                        padding: '0.9rem 1.15rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#0d9488',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e' }}>
                              {currentLang === 'mr' ? 'आरोग्य तपासणी पूर्ण झाली' : currentLang === 'hi' ? 'स्वास्थ्य मूल्यांकन पूर्ण हुआ' : 'Health Assessment Completed'}
                            </span>
                            <span style={{
                              background: guidanceResult.badgeBg,
                              color: guidanceResult.badgeColor,
                              border: `1px solid ${guidanceResult.badgeColor}`,
                              padding: '0.1rem 0.5rem',
                              borderRadius: '1rem',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              {guidanceResult.careLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
                        {currentLang === 'mr' ? 'अधिक तपशील जोडा' : currentLang === 'hi' ? 'अधिक विवरण जोड़ें' : 'Add More Details'}
                      </h4>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.9rem', lineHeight: 1.4 }}>
                        {currentLang === 'mr'
                          ? 'तपासणीत समाविष्ट नसलेली इतर कोणतीही लक्षणे किंवा चिंता तुम्ही ऐच्छिकपणे नोंदवू शकता.'
                          : currentLang === 'hi'
                            ? 'मूल्यांकन में शामिल न किए गए किसी भी अन्य लक्षण या चिंता का वैकल्पिक रूप से वर्णन करें।'
                            : 'Optionally describe any other symptoms or concerns that were not covered in the assessment.'}
                      </p>

                      <textarea
                        value={additionalDetailsText}
                        onChange={(e) => setAdditionalDetailsText(e.target.value)}
                        placeholder={
                          currentLang === 'mr'
                            ? 'अतिरिक्त लक्षणे किंवा चिंता येथे टाइप करा...'
                            : currentLang === 'hi'
                              ? 'अतिरिक्त लक्षण या चिंताएँ यहाँ टाइप करें...'
                              : 'Type additional symptoms or concerns here...'
                        }
                        rows={4}
                        style={{
                          width: '100%',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '0.65rem',
                          padding: '0.75rem 0.9rem',
                          fontSize: '0.88rem',
                          fontFamily: 'inherit',
                          color: '#1e293b',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          marginBottom: '0.65rem'
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={startVoiceInput}
                          style={{
                            background: isListening ? '#fee2e2' : '#f8fafc',
                            border: `1.5px solid ${isListening ? '#dc2626' : '#cbd5e1'}`,
                            color: isListening ? '#dc2626' : '#334155',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '0.6rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <Mic size={15} />
                          <span>
                            {isListening
                              ? (currentLang === 'mr' ? 'ऐकत आहे...' : currentLang === 'hi' ? 'सुन रहा है...' : 'Listening...')
                              : (currentLang === 'mr' ? 'बोला' : currentLang === 'hi' ? 'बोलें' : 'Speak')}
                          </span>
                        </button>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                          {currentLang === 'mr' ? 'ऐच्छिक' : currentLang === 'hi' ? 'वैकल्पिक' : 'Optional'}
                        </span>
                      </div>

                      {voiceError && (
                        <p style={{ color: '#dc2626', fontSize: '0.78rem', margin: '0 0 0.75rem' }}>
                          {voiceError}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <button
                          type="button"
                          onClick={handleStartRetake}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            padding: 0
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>{currentLang === 'mr' ? 'पुन्हा तपासणी करा' : currentLang === 'hi' ? 'पुनः मूल्यांकन करें' : 'Retake Assessment'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleContinueFromAdditionalDetails}
                          style={{
                            padding: '0.85rem 1.6rem',
                            background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.3)'
                          }}
                        >
                          <span>{t.continueBooking || 'Continue Booking'}</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: PATIENT DETAILS                                     */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {t.patientDetails || 'PATIENT DETAILS'}
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
                      {currentLang === 'mr'
                        ? 'प्रमाणित रुग्णाची माहिती आपोआप लोड केली गेली आहे.'
                        : currentLang === 'hi'
                          ? 'प्रमाणित रोगी का विवरण स्वचालित रूप से लोड किया गया है।'
                          : 'Authenticated patient profile loaded automatically.'}
                    </p>
                  </div>

                  {/* Health Assessment Attached Banner (Flow A) */}
                  {existingAssessment && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                      borderRadius: '0.85rem',
                      border: '1.5px solid #0d9488',
                      padding: '0.9rem 1.15rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#0d9488',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e' }}>
                              {currentLang === 'mr' ? 'आरोग्य तपासणी पूर्ण झाली' : currentLang === 'hi' ? 'स्वास्थ्य मूल्यांकन पूर्ण हुआ' : 'Health Assessment Completed'}
                            </span>
                            <span style={{
                              background: guidanceResult.badgeBg,
                              color: guidanceResult.badgeColor,
                              border: `1px solid ${guidanceResult.badgeColor}`,
                              padding: '0.1rem 0.5rem',
                              borderRadius: '1rem',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              {guidanceResult.careLevel}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.76rem', color: '#334155', display: 'block', marginTop: '2px' }}>
                            {currentLang === 'mr'
                              ? 'या भेटीसाठी तुमचे नुकतेच केलेले आरोग्य मूल्यांकन वापरले जाईल.'
                              : currentLang === 'hi'
                                ? 'इस अपॉइंटमेंट के लिए आपके हालिया स्वास्थ्य मूल्यांकन का उपयोग किया जाएगा।'
                                : 'Your recent health assessment is automatically attached to this appointment.'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartRetake}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #0d9488',
                          color: '#0f766e',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>{currentLang === 'mr' ? 'पुन्हा तपासणी करा' : currentLang === 'hi' ? 'पुनः मूल्यांकन करें' : 'Retake Assessment'}</span>
                      </button>
                    </div>
                  )}

                  {/* Patient Details Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.85rem',
                    border: '1px solid #cbd5e1',
                    padding: '1.25rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>
                          {currentLang === 'mr' ? 'रुग्णाचे नाव' : currentLang === 'hi' ? 'रोगी का नाम' : 'Patient Name'}
                        </span>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{patientDisplayName}</strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>
                          {currentLang === 'mr' ? 'सेवा हेल्थ रुग्ण आयडी' : currentLang === 'hi' ? 'सेवा हेल्थ रोगी आईडी' : 'Seva Health Patient ID'}
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: '#0f766e', fontFamily: 'monospace' }}>{patientIdDisplay}</strong>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>
                          {t.registeredMobile || 'Registered Mobile'}
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: '#334155' }}>+91 {patientPhoneDisplay}</strong>
                      </div>

                      {/* Optional ABHA ID (Only shown if available) */}
                      {patientAbhaDisplay && (
                        <div>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>
                            ABHA ID
                          </span>
                          <span style={{
                            display: 'inline-block',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            fontFamily: 'monospace'
                          }}>
                            {patientAbhaDisplay}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Facility Card (Preserved from Card Selection) */}
                  <div style={{
                    background: '#f0fdfa',
                    borderRadius: '0.85rem',
                    border: '1.5px solid #0d9488',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                      {currentLang === 'mr' ? 'निवडलेले आरोग्य केंद्र' : currentLang === 'hi' ? 'चयनित स्वास्थ्य केंद्र' : 'SELECTED FACILITY'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Building2 size={18} style={{ color: '#0f766e' }} />
                      <strong style={{ fontSize: '1.05rem', color: '#0f766e' }}>
                        {facilityDetail?.name || 'Primary Health Centre Shirwal'}
                      </strong>
                    </div>
                    <p style={{ color: '#475569', fontSize: '0.82rem', margin: 0 }}>
                      {facilityDetail?.type || 'Primary Health Centre'} • {facilityDetail?.location?.taluka || 'Khandala'}, {facilityDetail?.location?.district || 'Satara'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        setSymptomMode('guidance');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>{t.previousBtn || 'Previous'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      style={{
                        padding: '0.85rem 1.6rem',
                        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{currentLang === 'mr' ? 'डॉक्टर निवडा' : currentLang === 'hi' ? 'डॉक्टर चुनें' : 'Continue to Doctor Selection'}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: DOCTOR / CARE SELECTION                             */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {t.selectDoctor || 'AVAILABLE DOCTORS'}
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
                      {currentLang === 'mr'
                        ? 'आरोग्य केंद्रातील उपलब्ध डॉक्टरांची निवड करा.'
                        : currentLang === 'hi'
                          ? 'स्वास्थ्य केंद्र में उपलब्ध डॉक्टरों का चयन करें।'
                          : 'Select an available doctor on duty at the facility.'}
                    </p>
                  </div>

                  {/* Doctor List */}
                  <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                    {doctors.length > 0 ? (
                      doctors.map((doc) => {
                        const isSelected = selectedDoctorId === doc.id;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDoctorId(doc.id)}
                            style={{
                              border: isSelected ? '2px solid #0d9488' : '1px solid #cbd5e1',
                              borderRadius: '0.85rem',
                              padding: '1rem',
                              background: isSelected ? '#f0fdfa' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: isSelected ? '#0d9488' : '#f1f5f9',
                                color: isSelected ? '#ffffff' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Stethoscope size={20} />
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                                  {doc.name}
                                </strong>
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                  {doc.specialty || 'General Medicine'}
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                display: 'inline-block',
                                background: '#dcfce7',
                                color: '#16a34a',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}>
                                {currentLang === 'mr' ? 'आज उपलब्ध' : currentLang === 'hi' ? 'आज उपलब्ध' : 'Available Today'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        onClick={() => setSelectedDoctorId('')}
                        style={{
                          border: '2px solid #0d9488',
                          borderRadius: '0.85rem',
                          padding: '1.25rem',
                          background: '#f0fdfa',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        <Stethoscope size={24} style={{ color: '#0d9488' }} />
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
                            {t.generalOpdDoctor || 'General OPD Medical Officer'}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            General Medicine & Primary Consultation • Available Today
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>{t.previousBtn || 'Previous'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      style={{
                        padding: '0.85rem 1.6rem',
                        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{currentLang === 'mr' ? 'दिनांक निवडा' : currentLang === 'hi' ? 'तारीख चुनें' : 'Continue to Date'}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 4: DATE SELECTION                                      */}
              {/* ============================================================ */}
              {currentStep === 4 && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {t.selectDate || 'SELECT DATE'}
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
                      {currentLang === 'mr'
                        ? 'अपॉइंटमेंटसाठी उपलब्ध दिनांक निवडा.'
                        : currentLang === 'hi'
                          ? 'अपॉइंटमेंट के लिए उपलब्ध तारीख चुनें।'
                          : 'Choose an available appointment date.'}
                    </p>
                  </div>

                  {/* Quick Dates Grid */}
                  <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {quickDates.map((q) => {
                      const isSelected = appointmentDate === q.iso;
                      return (
                        <div
                          key={q.iso}
                          onClick={() => setAppointmentDate(q.iso)}
                          style={{
                            padding: '1rem 1.2rem',
                            borderRadius: '0.85rem',
                            border: isSelected ? '2px solid #0d9488' : '1px solid #cbd5e1',
                            background: isSelected ? '#f0fdfa' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Calendar size={20} style={{ color: isSelected ? '#0d9488' : '#64748b' }} />
                            <strong style={{ fontSize: '0.95rem', color: isSelected ? '#0f766e' : '#1e293b' }}>
                              {q.label}
                            </strong>
                          </div>
                          {isSelected && <Check size={18} style={{ color: '#0d9488' }} />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Date Input */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
                      {currentLang === 'mr' ? 'किंवा इतर दिनांक निवडा' : currentLang === 'hi' ? 'या अन्य तारीख चुनें' : 'Or choose specific date:'}
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '0.75rem',
                        fontSize: '0.9rem',
                        color: '#1e293b',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>{t.previousBtn || 'Previous'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      style={{
                        padding: '0.85rem 1.6rem',
                        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{currentLang === 'mr' ? 'वेळ निवडा' : currentLang === 'hi' ? 'समय चुनें' : 'Continue to Time Slot'}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 5: AVAILABLE TIME SLOT                                 */}
              {/* ============================================================ */}
              {currentStep === 5 && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {t.availableSlots || 'AVAILABLE SLOTS'}
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
                      {currentLang === 'mr'
                        ? 'सोयीस्कर अपॉइंटमेंट वेळ निवडा.'
                        : currentLang === 'hi'
                          ? 'सुविधाजनक अपॉइंटमेंट समय चुनें।'
                          : 'Select your preferred appointment time.'}
                    </p>
                  </div>

                  {/* Slots Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {availableTimeSlots.map((slot) => {
                      const isSelected = timeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTimeSlot(slot)}
                          style={{
                            padding: '0.85rem 0.5rem',
                            borderRadius: '0.75rem',
                            border: isSelected ? '2px solid #0d9488' : '1px solid #cbd5e1',
                            background: isSelected ? '#f0fdfa' : '#ffffff',
                            color: isSelected ? '#0f766e' : '#1e293b',
                            fontSize: '0.9rem',
                            fontWeight: isSelected ? 800 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Clock size={16} style={{ color: isSelected ? '#0d9488' : '#94a3b8' }} />
                          <span>{slot}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.82rem',
                    color: '#475569',
                    marginBottom: '1.5rem'
                  }}>
                    {currentLang === 'mr'
                      ? `निवडलेली वेळ: ${appointmentDate} रोजी ${timeSlot}`
                      : currentLang === 'hi'
                        ? `चयनित समय: ${appointmentDate} को ${timeSlot}`
                        : `Selected slot: ${appointmentDate} at ${timeSlot}`}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>{t.previousBtn || 'Previous'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(6)}
                      style={{
                        padding: '0.85rem 1.6rem',
                        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{currentLang === 'mr' ? 'तपशील तपासा' : currentLang === 'hi' ? 'विवरण जांचें' : 'Review Appointment Summary'}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 6: APPOINTMENT SUMMARY & CONFIRMATION                   */}
              {/* ============================================================ */}
              {currentStep === 6 && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {t.appointmentSummary || 'APPOINTMENT SUMMARY'}
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
                      {currentLang === 'mr'
                        ? 'कृपया पुष्टी करण्यापूर्वी सर्व माहिती काळजीपूर्वक तपासा.'
                        : currentLang === 'hi'
                          ? 'कृपया पुष्टि करने से पहले सभी विवरण ध्यानपूर्वक जांचें।'
                          : 'Please review your appointment details before confirming.'}
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.85rem',
                    border: '1px solid #cbd5e1',
                    padding: '1.25rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.88rem' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'रुग्ण' : currentLang === 'hi' ? 'रोगी' : 'Patient:'}</span>
                        <strong style={{ color: '#0f172a' }}>{patientDisplayName}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'रुग्ण आयडी' : currentLang === 'hi' ? 'रोगी आईडी' : 'Patient ID:'}</span>
                        <strong style={{ color: '#0f766e' }}>{patientIdDisplay}</strong>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'आरोग्य केंद्र' : currentLang === 'hi' ? 'स्वास्थ्य केंद्र' : 'Facility:'}</span>
                        <strong style={{ color: '#0f172a' }}>{facilityDetail?.name || 'Primary Health Centre Shirwal'}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'डॉक्टर' : currentLang === 'hi' ? 'डॉक्टर' : 'Doctor:'}</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDoctorObj?.name || (t.generalOpdDoctor || 'General OPD Medical Officer')}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'विशेषज्ञता' : currentLang === 'hi' ? 'विशेषज्ञता' : 'Specialty:'}</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDoctorObj?.specialty || 'General Medicine'}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'दिनांक' : currentLang === 'hi' ? 'तारीख' : 'Date:'}</span>
                        <strong style={{ color: '#0f172a' }}>{appointmentDate}</strong>
                      </div>

                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'वेळ' : currentLang === 'hi' ? 'समय' : 'Time:'}</span>
                        <strong style={{ color: '#0f172a' }}>{timeSlot}</strong>
                      </div>

                      <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'नोंदवलेली लक्षणे' : currentLang === 'hi' ? 'दर्ज लक्षण' : 'Symptoms:'}</span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{guidanceResult.symptomsList.join(', ')}</span>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>{currentLang === 'mr' ? 'प्राथमिक मार्गदर्शन' : currentLang === 'hi' ? 'प्रारंभिक मार्गदर्शन' : 'Preliminary guidance:'}</span>
                        <span style={{
                          display: 'inline-block',
                          background: guidanceResult.badgeBg,
                          color: guidanceResult.badgeColor,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          marginTop: '0.2rem'
                        }}>
                          {guidanceResult.careLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Notice */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '0.75rem',
                    fontSize: '0.8rem',
                    color: '#166534',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Ticket size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <span>
                      {currentLang === 'mr'
                        ? 'पुष्टी केल्यावर तुम्हाला तात्काळ लाइव्ह रांग टोकन क्रमांक मिळेल.'
                        : currentLang === 'hi'
                          ? 'पुष्टि करने पर आपको तुरंत लाइव कतार टोकन नंबर प्राप्त होगा।'
                          : 'Confirmation automatically issues a real-time digital OPD queue token.'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>{t.previousBtn || 'Previous'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      style={{
                        padding: '0.9rem 2rem',
                        background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        fontWeight: 800,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      {submitting ? (
                        <span>{currentLang === 'mr' ? 'नोंदणी होत आहे...' : currentLang === 'hi' ? 'दर्ज हो रहा है...' : 'Confirming...'}</span>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          <span>{t.confirmAppointment || 'Confirm Appointment'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingModal;

