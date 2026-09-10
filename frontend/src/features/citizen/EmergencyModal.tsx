import React from 'react';
import { AlertTriangle, PhoneCall, MapPin, X } from 'lucide-react';
import { useDemo } from '../../store/demoContext';

export const EmergencyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t, setCurrentView } = useDemo();

  if (!isOpen) return null;

  const handleFindEmergencyFacility = () => {
    setCurrentView('facilities');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(185, 28, 28, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', background: '#ffffff', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.35)', border: '2px solid #ef4444' }}>
        {/* Header */}
        <div style={{ background: '#dc2626', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={24} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {t.emergency24x7Btn || '24x7 Emergency Escalation'}
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#fecaca' }}>
                {t.emergencyResponseBadge || '24/7 Immediate Medical Response Protocol'}
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label={t.close} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Actions: Dial 108 & Find Nearest Emergency Facility */}
          <div style={{ background: '#fef2f2', border: '2px dashed #f87171', padding: '1.25rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {t.emergencyAssistanceDesc || 'Immediate Medical Emergency / Accident / Maternal Labor'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href="tel:108"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }}
              >
                <PhoneCall size={22} /> {t.emergencyCall108 || 'Dial 108 Free Ambulance'}
              </a>

              <button
                type="button"
                onClick={handleFindEmergencyFacility}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#ffffff',
                  color: '#b91c1c',
                  border: '1.5px solid #f87171',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <MapPin size={18} /> {t.findNearestEmergencyFacility || 'Find Nearest Emergency Facility'}
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '0.75rem' }}>
              GPS-enabled dispatch across all talukas in Maharashtra
            </div>
          </div>

          {/* Nearest Emergency Facilities */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.75rem' }}>
              Nearest 24x7 Public Emergency Facilities:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Primary Health Centre Shirwal</div>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>24/7 Open</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Near Main Bazaar, Shirwal (1.2 km away) • Phone: 02169-244120</div>
              </div>

              <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>District Hospital Satara (Civil Hospital)</div>
                  <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>Tertiary Trauma & ICU</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Sadar Bazar, Satara • 84 Free ICU/General Beds • Phone: 02162-234500</div>
              </div>
            </div>
          </div>

          {/* Frontline Escalation Notice */}
          <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '0.85rem 1rem', borderRadius: '0.5rem', fontSize: '0.82rem', color: '#0f766e' }}>
            <strong>Local Frontline Escalation:</strong> Assigned ASHA worker <strong>Asha Tai Shinde (9876543211)</strong> has been alerted to provide on-ground emergency accompaniment.
          </div>
        </div>
      </div>
    </div>
  );
};
