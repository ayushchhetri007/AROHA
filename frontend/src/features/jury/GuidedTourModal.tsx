import React, { useState } from 'react';
import { useDemo } from '../../store/demoContext';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

interface TourStep {
  id: number;
  badge: string;
  title: string;
  persona: 'CITIZEN' | 'ASHA' | 'DOCTOR' | 'FACILITY_STAFF' | 'ADMIN';
  view: string;
  description: string;
  storyContext: string;
  featuresShown: string[];
  ctaLabel: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    badge: 'STAGE 1: COMMUNITY SCREENING',
    title: 'Frontline ASHA Worker Identifies High-Risk Pregnancy',
    persona: 'ASHA',
    view: 'frontline',
    description: 'ASHA Worker Sunita visits Meera Patil (26y, 28 weeks pregnant) in remote village Karad. Blood pressure reads 150/100 mmHg with pedal edema.',
    storyContext: 'Early detection at the grassroot village level prevents maternal mortality before irreversible complications arise.',
    featuresShown: [
      'Digital Village Maternal & Child Register',
      'High-Risk Flagging with automated color-coded badges',
      'Offline-First field data entry with auto-sync'
    ],
    ctaLabel: 'View ASHA Roster & Patient Profile'
  },
  {
    id: 2,
    badge: 'STAGE 2: TELEMEDICINE',
    title: 'Assisted Teleconsultation with District Specialist',
    persona: 'ASHA',
    view: 'frontline',
    description: 'Because the village is 45km away from the District Hospital, Sunita connects Meera to Dr. Ananya Kulkarni at Satara DH via WebRTC Assisted Teleconsultation.',
    storyContext: 'Bypasses travel hardship, provides immediate specialist clinical advice, and orders urgent lab work.',
    featuresShown: [
      'Encrypted video teleconsultation stream',
      'Real-time vitals and ANC history sharing',
      'Digital e-Prescription (Labetalol 100mg BID) transmitted immediately'
    ],
    ctaLabel: 'Simulate Teleconsultation Session'
  },
  {
    id: 3,
    badge: 'STAGE 3: ACCESS & TRANSPARENCY',
    title: 'OPD Token Generation & Live Queue Tracker',
    persona: 'CITIZEN',
    view: 'queue',
    description: 'Meera travels to Karad PHC for clinical review. Instead of standing for 3 hours in chaotic lines, she receives digital Token #A-014 with estimated wait times.',
    storyContext: 'Transparent digital queuing eliminates queue jumping, reduces crowding, and supports vernacular audio announcements.',
    featuresShown: [
      'Live Queue position tracker with estimated wait time',
      'Multilingual Marathi & Hindi audio queue callouts',
      'Low-Literacy visual iconography mode'
    ],
    ctaLabel: 'Track Meera\'s Live Queue Token'
  },
  {
    id: 4,
    badge: 'STAGE 4: CLINICAL CONSULTATION',
    title: 'Doctor OPD Review & Longitudinal EHR',
    persona: 'DOCTOR',
    view: 'doctor',
    description: 'Dr. Suresh Joshi at Karad PHC calls Meera into OPD Room 1. He accesses her complete longitudinal health history across Sub-Centre and DH records.',
    storyContext: 'Zero record fragmentation. Doctors have instant access to prior visits, drug allergies, and immunization history.',
    featuresShown: [
      'Unified ABHA-compatible Longitudinal Health Record',
      'One-click e-Prescription with Essential Drug List (EDL) auto-complete',
      'Lab test orders linked directly to public health laboratory'
    ],
    ctaLabel: 'Examine Patient in Doctor OPD'
  },
  {
    id: 5,
    badge: 'STAGE 5: SUPPLY CHAIN TRANSPARENCY',
    title: 'Free Essential Medicine Dispensation & Stock Visibility',
    persona: 'CITIZEN',
    view: 'medicines',
    description: 'Meera needs Iron Folic Acid, Calcium, and Labetalol. The public pharmacy stock tracker verifies free availability at Karad PHC without stockouts.',
    storyContext: 'Stops out-of-pocket expenditure at private pharmacies by providing real-time stock transparency in public health dispensaries.',
    featuresShown: [
      'National & State Essential Drug List (EDL) Catalog',
      'Real-time batch tracking & expiry surveillance',
      'Pharmacy counter stock deduction on dispensation'
    ],
    ctaLabel: 'Search Free Medicine Availability'
  },
  {
    id: 6,
    badge: 'STAGE 6: EMERGENCY ESCALATION',
    title: 'Inter-Facility High-Risk Referral Handshake',
    persona: 'DOCTOR',
    view: 'referrals',
    description: 'Due to severe pre-eclampsia risk, Dr. Suresh initiates an emergency digital referral from Karad PHC to Satara District Hospital, requisitioning 108 Ambulance.',
    storyContext: 'Replaces lost paper referral slips with guaranteed handovers, receiving hospital advance alert, and ambulance coordination.',
    featuresShown: [
      'Hierarchical Referral (PHC ➔ District Hospital)',
      '108 Emergency Ambulance dispatch integration',
      'ABDM Clinical Summary transmission'
    ],
    ctaLabel: 'View Active Referral Records'
  },
  {
    id: 7,
    badge: 'STAGE 7: RECEIVING TERTIARY CARE',
    title: 'Satara District Hospital Accepts Referral & Prepares Bed',
    persona: 'FACILITY_STAFF',
    view: 'facility',
    description: 'Satara DH admissions desk sees Meera\'s incoming referral, clinical summary, and ETA. A maternity high-dependency bed and blood units are prepared in advance.',
    storyContext: 'Prevents "doors closed on arrival" delays at overburdened tertiary hospitals.',
    featuresShown: [
      'Real-time incoming referral queue',
      'Bed and emergency OT readiness checklist',
      'Digital acceptance and arrival confirmation'
    ],
    ctaLabel: 'Manage Facility Queue & Admissions'
  },
  {
    id: 8,
    badge: 'STAGE 8: RESILIENT EDGE CONTINUITY',
    title: 'Frontline Offline Sync in Connectivity Blackspots',
    persona: 'ASHA',
    view: 'frontline',
    description: 'ASHA worker logs follow-up vitals in a remote tribal hamlet with zero cell reception. The application stores records in IndexedDB/LocalStorage and syncs once connected.',
    storyContext: 'Ensures healthcare delivery in Nandurbar, Gadchiroli, and Western Ghats terrains where internet is intermittent.',
    featuresShown: [
      'Simulated offline mode toggle',
      'Background retry queue with conflict-free merges',
      'Visual offline pending transaction drawer'
    ],
    ctaLabel: 'Test Offline Storage & Sync'
  },
  {
    id: 9,
    badge: 'STAGE 9: GOVERNANCE & ACCOUNTABILITY',
    title: 'State & District Public Health Command Dashboard',
    persona: 'ADMIN',
    view: 'admin',
    description: 'State Health Commissioner reviews real-time district heatmaps: OPD waiting times, stockout risk alerts, maternal referral closure rates, and doctor attendance.',
    storyContext: 'Empowers public health leadership with data-driven governance rather than delayed monthly paper reports.',
    featuresShown: [
      'District-wise performance scorecards (Satara, Pune, Nandurbar, Gadchiroli)',
      'Average OPD waiting time analytics (Target < 30 mins)',
      'Critical drug stockout early warning alerts'
    ],
    ctaLabel: 'Launch State Command Center'
  },
  {
    id: 10,
    badge: 'STAGE 10: CITIZEN EMPOWERMENT',
    title: 'Grievance Redressal & Public Health Feedback Loop',
    persona: 'CITIZEN',
    view: 'landing',
    description: 'Citizens submit feedback or report facility shortages with automated tracking codes, SMS confirmations, and mandatory 48-hour administrative escalation.',
    storyContext: 'Strengthens public trust and continuous service quality improvement under Maharashtra Public Health mandates.',
    featuresShown: [
      'Transparent grievance filing with category tagging',
      'Unique grievance tracking code generation',
      'State administrative resolution tracking'
    ],
    ctaLabel: 'Complete Tour & Return to Home'
  }
];

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { switchRole, showToast } = useDemo();

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const progressPercent = ((currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  const roleMapping: Record<string, string> = {
    'CITIZEN': 'patient',
    'ASHA': 'asha_worker',
    'DOCTOR': 'doctor',
    'FACILITY_STAFF': 'facility_staff',
    'ADMIN': 'admin'
  };

  const handleApplyStep = () => {
    const targetRole = roleMapping[currentStep.persona] || 'patient';
    switchRole(targetRole);
    onNavigate(currentStep.view);
    showToast(`Switched persona to ${currentStep.persona} for Step ${currentStep.id}`, 'info');
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '750px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header with Progress */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          padding: '1.5rem 2rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🧭</span>
              <span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.85rem', color: '#38bdf8' }}>
                JURY EVALUATION DEMO TOUR (5-MINUTE WALKTHROUGH)
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'white' }}>
              Step {currentStep.id} of {TOUR_STEPS.length}: {currentStep.title}
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              {Math.round(progressPercent)}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: '#38bdf8', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '2rem' }}>
          {/* Badge & Persona Tag */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{
              background: '#e0f2fe',
              color: '#0284c7',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {currentStep.badge}
            </span>
            <span style={{
              background: '#f1f5f9',
              color: '#334155',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              Active Persona: {currentStep.persona}
            </span>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              Canonical Case: Meera Patil (26y, Antenatal G2P1)
            </span>
          </div>

          {/* Core Story Context */}
          <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#1e293b', margin: '0 0 1rem 0', fontWeight: 500 }}>
            {currentStep.description}
          </p>

          <div style={{
            background: '#f8fafc',
            borderLeft: '4px solid #0284c7',
            padding: '0.875rem 1rem',
            borderRadius: '0 8px 8px 0',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#475569',
            fontStyle: 'italic'
          }}>
            "{currentStep.storyContext}"
          </div>

          {/* System Capabilities Demonstrated */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Key Public Health Capabilities Demonstrated
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {currentStep.featuresShown.map((f, i) => (
                <li key={i} style={{ fontSize: '0.875rem', color: '#334155' }}>
                  <strong style={{ color: '#0f172a' }}>{f}</strong>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Jump Carousel Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                title={step.title}
                style={{
                  width: idx === currentStepIndex ? '24px' : '10px',
                  height: '10px',
                  borderRadius: '5px',
                  border: 'none',
                  background: idx === currentStepIndex ? '#0284c7' : '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: currentStepIndex === 0 ? '#cbd5e1' : '#334155',
                cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              ← Previous Step
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleApplyStep}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0284c7',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                }}
              >
                🚀 {currentStep.ctaLabel} ➔
              </button>

              <button
                onClick={handleNext}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
