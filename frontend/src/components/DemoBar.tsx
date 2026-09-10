import React from 'react';
import { useDemo } from '../store/demoContext';
import { Shield, UserCheck, Stethoscope, Building2, BarChart3, Wifi, WifiOff, PlayCircle, Eye, Sparkles } from 'lucide-react';

export const DemoBar: React.FC<{ onOpenTour: () => void }> = ({ onOpenTour }) => {
  const { currentUser, switchRole, isOffline, setIsOffline, offlineVisits, lowLiteracyMode, setLowLiteracyMode } = useDemo();

  const roles = [
    { id: 'patient', label: 'Patient / Citizen (Meera Patil)', icon: UserCheck, color: 'bg-teal-600' },
    { id: 'asha_worker', label: 'ANM / Health Worker (Asha Shinde)', icon: Shield, color: 'bg-emerald-600' },
    { id: 'doctor', label: 'Doctor (Dr. Deshmukh / Dr. Joshi)', icon: Stethoscope, color: 'bg-blue-600' },
    { id: 'hospital', label: 'Hospital Management (Hospital Ops)', icon: Building2, color: 'bg-indigo-600' },
    { id: 'admin', label: 'Admin (Command Center)', icon: BarChart3, color: 'bg-purple-600' }
  ];


  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', padding: '0.5rem 1rem', fontSize: '0.82rem', borderBottom: '1px solid #334155' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        {/* Left: Project & Jury Tour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 600, fontSize: '0.75rem' }}>
            <Sparkles size={13} /> Integrated Healthcare Continuum
          </span>

          <button
            onClick={onOpenTour}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.3rem 0.75rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(13, 148, 136, 0.3)'
            }}
          >
            <PlayCircle size={15} /> 5-Min Jury Guided Tour
          </button>
        </div>

        {/* Middle: Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', marginRight: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Persona:</span>
          {roles.map(r => {
            const Icon = r.icon;
            const isActive = currentUser.role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => switchRole(r.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '0.375rem',
                  border: isActive ? '1px solid #38bdf8' : '1px solid #334155',
                  background: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#38bdf8' : '#cbd5e1',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={13} /> {r.label}
              </button>
            );
          })}
        </div>

        {/* Right: Low-connectivity toggle & Low-literacy toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsOffline(!isOffline)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '0.375rem',
              border: isOffline ? '1px solid #ef4444' : '1px solid #10b981',
              background: isOffline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
              color: isOffline ? '#fca5a5' : '#6ee7b7',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Simulate low-connectivity/offline network environment"
          >
            {isOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
            {isOffline ? `Offline Mode (${offlineVisits.length} pending)` : 'Online 🟢'}
          </button>

          <button
            onClick={() => setLowLiteracyMode(!lowLiteracyMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '0.375rem',
              border: lowLiteracyMode ? '1px solid #f59e0b' : '1px solid #475569',
              background: lowLiteracyMode ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: lowLiteracyMode ? '#fbbf24' : '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Toggle simplified high-contrast, large icon low-literacy mode"
          >
            <Eye size={13} /> {lowLiteracyMode ? 'Simplified Mode: ON' : 'Simplified Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};
