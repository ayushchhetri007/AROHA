import React, { useState } from 'react';
import { DemoProvider, useDemo } from './store/demoContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Feature Views
import { LandingPage } from './features/landing/LandingPage';
import { CitizenDashboard } from './features/citizen/CitizenDashboard';
import { FacilityDirectory } from './features/facilities/FacilityDirectory';
import { LiveQueueTracker } from './features/citizen/LiveQueueTracker';
import { Inventory } from './features/citizen/Inventory';
import { LongitudinalEHR } from './features/citizen/LongitudinalEHR';
import { ReferralsDashboard } from './features/referrals/ReferralsDashboard';
import { FrontlineDashboard } from './features/frontline/FrontlineDashboard';
import { DoctorDashboard } from './features/doctor/DoctorDashboard';
import { FacilityStaffDashboard } from './features/facility/FacilityStaffDashboard';
import { HospitalManagementView } from './features/hospital/HospitalManagementView';
import { AdminCommandDashboard } from './features/admin/AdminCommandDashboard';


// Modals
import { GuidedTourModal } from './features/jury/GuidedTourModal';
import { EmergencyModal } from './features/citizen/EmergencyModal';
import { AiTriageModal } from './features/citizen/AiTriageModal';
import { GrievanceModal } from './features/citizen/GrievanceModal';
import { AppointmentBookingModal } from './features/citizen/AppointmentBookingModal';
import { HomeVisitModal } from './features/frontline/HomeVisitModal';
import { AssistedTeleconsultModal } from './features/frontline/AssistedTeleconsultModal';
import { OfflineSyncDrawer } from './features/frontline/OfflineSyncDrawer';

import { UnifiedLoginPage } from './features/auth/UnifiedLoginPage';
import { ProfileDrawer } from './components/profile/ProfileDrawer';

import { AlertCircle, CheckCircle, Info, MessageSquarePlus, ShieldAlert } from 'lucide-react';
import './App.css';

const MainAppContent: React.FC = () => {
  const { currentUser, isAuthenticated, currentView, setCurrentView, toast, isProfileOpen, setIsProfileOpen } = useDemo();

  // Modal & Drawer States
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isGrievanceOpen, setIsGrievanceOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingFacilityId, setBookingFacilityId] = useState<string | undefined>(undefined);

  // Frontline Modal States
  const [isHomeVisitOpen, setIsHomeVisitOpen] = useState(false);
  const [homeVisitPatientId, setHomeVisitPatientId] = useState<string | undefined>(undefined);
  const [isTeleconsultOpen, setIsTeleconsultOpen] = useState(false);
  const [teleconsultPatientId, setTeleconsultPatientId] = useState<string | undefined>(undefined);
  const [isOfflineSyncOpen, setIsOfflineSyncOpen] = useState(false);

  const handleOpenBooking = (facilityId?: string) => {
    setBookingFacilityId(facilityId);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (_appointment: any) => {
    setIsBookingOpen(false);
    setCurrentView('queue');
  };

  const handleOpenHomeVisit = (patientId?: string) => {
    setHomeVisitPatientId(patientId);
    setIsHomeVisitOpen(true);
  };

  const handleOpenTeleconsult = (patientId?: string) => {
    setTeleconsultPatientId(patientId);
    setIsTeleconsultOpen(true);
  };

  const renderView = () => {
    // Role-Based Access Control (RBAC) Protection
    const userRole = currentUser?.role || 'patient';

    // 1. Patient cannot access administrative/clinical dashboards
    if (userRole === 'patient' && ['admin', 'hospital', 'facility', 'doctor', 'frontline'].includes(currentView)) {
      return (
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fee2e2', textAlign: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <ShieldAlert size={34} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
            Role-Based Access Restricted
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            You are signed in as a <strong>Patient</strong> (ID: <code>{currentUser?.id}</code>).
            <br />
            Access to Staff, Clinical, Hospital Operations, and District Command Center administrative views is restricted to authorized personnel.
          </p>
          <button
            onClick={() => setCurrentView('citizen')}
            style={{
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
            }}
          >
            Return to My Health Portal
          </button>
        </div>
      );
    }

    // 2. Frontline ANM cannot access hospital management or command center
    if (userRole === 'asha_worker' && ['admin', 'hospital', 'facility', 'doctor'].includes(currentView)) {
      return (
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fee2e2', textAlign: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <ShieldAlert size={34} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            You are signed in as an <strong>ANM / Frontline Health Worker</strong>. This portal requires higher administrative clearance.
          </p>
          <button
            onClick={() => setCurrentView('frontline')}
            style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Return to Field Care Dashboard
          </button>
        </div>
      );
    }

    // 3. Hospital management can only access facility/hospital operations
    if (userRole === 'hospital' && ['admin', 'doctor', 'frontline'].includes(currentView)) {
      return (
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fee2e2', textAlign: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <ShieldAlert size={34} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
            District Command Center Restricted
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            Your scope is restricted to <strong>Hospital Operations & Facility Bed Management</strong>.
          </p>
          <button
            onClick={() => setCurrentView('hospital')}
            style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Return to Hospital Dashboard
          </button>
        </div>
      );
    }

    // 4. Doctor can only access the Clinical Care Portal
    if (userRole === 'doctor' && ['admin', 'hospital', 'facility', 'frontline'].includes(currentView)) {
      return (
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fee2e2', textAlign: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <ShieldAlert size={34} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            You are signed in as a <strong>Doctor</strong>. Your scope is restricted to the <strong>Clinical Care Portal</strong>.
          </p>
          <button
            onClick={() => setCurrentView('doctor')}
            style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Return to Clinical Care Portal
          </button>
        </div>
      );
    }

    // 5. Admin is restricted to the District Command Center
    if (userRole === 'admin' && ['hospital', 'facility', 'doctor', 'frontline'].includes(currentView)) {
      return (
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', background: '#ffffff', borderRadius: '16px', border: '1.5px solid #fee2e2', textAlign: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.08)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <ShieldAlert size={34} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            You are signed in as an <strong>Administrator</strong>. Your scope is restricted to the <strong>District Command Center</strong>.
          </p>
          <button
            onClick={() => setCurrentView('admin')}
            style={{ background: '#7c3aed', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Return to Command Center
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <LandingPage
            onOpenBooking={() => handleOpenBooking()}
            onOpenTriage={() => setIsTriageOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onOpenTour={() => setIsTourOpen(true)}
          />
        );
      case 'citizen':
        return (
          <CitizenDashboard
            onOpenBooking={handleOpenBooking}
            onOpenTriage={() => setIsTriageOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        );
      case 'facilities':
        return <FacilityDirectory onOpenBooking={handleOpenBooking} />;
      case 'queue':
        return <LiveQueueTracker />;
      case 'medicines':
        return <Inventory />;
      case 'ehr':
        return <LongitudinalEHR />;
      case 'referrals':
        return <ReferralsDashboard />;
      case 'frontline':
        return (
          <FrontlineDashboard
            onOpenHomeVisit={handleOpenHomeVisit}
            onOpenTeleconsult={handleOpenTeleconsult}
            onOpenOfflineSync={() => setIsOfflineSyncOpen(true)}
          />
        );
      case 'doctor':
        return <DoctorDashboard />;
      case 'facility':
      case 'hospital':
        return <HospitalManagementView />;
      case 'admin':
        return <AdminCommandDashboard />;

      default:
        return (
          <LandingPage
            onOpenBooking={() => handleOpenBooking()}
            onOpenTriage={() => setIsTriageOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onOpenTour={() => setIsTourOpen(true)}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <UnifiedLoginPage />
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.875rem 1.25rem',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#0369a1',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Main Maharashtra Govt Navigation Bar */}
      <Navbar onOpenEmergency={() => setIsEmergencyOpen(true)} />

      {/* Main Dynamic View Content */}
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      {/* Floating Citizen Grievance Action Button */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>
        <button
          onClick={() => setIsGrievanceOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
            padding: '0.75rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
            transition: 'all 0.2s ease'
          }}
          title="Submit a public health grievance or feedback"
        >
          <MessageSquarePlus size={18} color="#38bdf8" />
          <span>Grievance / तक्रार</span>
        </button>
      </div>

      {/* Global Toast Notifications */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#0369a1',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Global Modals */}
      <GuidedTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
      />

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      <AiTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
        onBookAppointment={() => {
          setIsTriageOpen(false);
          handleOpenBooking();
        }}
      />

      <GrievanceModal
        isOpen={isGrievanceOpen}
        onClose={() => setIsGrievanceOpen(false)}
      />

      <AppointmentBookingModal
        isOpen={isBookingOpen}
        defaultFacilityId={bookingFacilityId}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={handleBookingSuccess}
      />

      {/* Frontline Modals & Drawers */}
      <HomeVisitModal
        isOpen={isHomeVisitOpen}
        patientId={homeVisitPatientId}
        onClose={() => setIsHomeVisitOpen(false)}
        onSuccess={() => setIsHomeVisitOpen(false)}
      />

      <AssistedTeleconsultModal
        isOpen={isTeleconsultOpen}
        patientId={teleconsultPatientId}
        onClose={() => setIsTeleconsultOpen(false)}
      />

      <OfflineSyncDrawer
        isOpen={isOfflineSyncOpen}
        onClose={() => setIsOfflineSyncOpen(false)}
      />

      {/* Global Slide-Over Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Footer with Maharashtra Govt Mandates & Helplines */}
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <DemoProvider>
      <MainAppContent />
    </DemoProvider>
  );
}

export default App;
