import React from 'react';
import { useDemo } from '../../store/demoContext';
import { User, ChevronDown } from 'lucide-react';

interface ProfileButtonProps {
  onClick: () => void;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ onClick }) => {
  const { currentUser } = useDemo();

  const roleColors: Record<string, string> = {
    patient: '#0d9488',
    asha_worker: '#059669',
    doctor: '#2563eb',
    hospital: '#4f46e5',
    facility_staff: '#4f46e5',
    admin: '#7c3aed'
  };

  const accentColor = roleColors[currentUser.role] || '#0d9488';
  const firstName = currentUser.full_name?.split(' ')[0] || currentUser.full_name || 'Profile';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open profile for ${currentUser.full_name}`}
      title={`Open profile for ${currentUser.full_name} (${currentUser.role})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        padding: '0.4rem 0.75rem',
        borderRadius: '9999px',
        color: '#1e293b',
        fontWeight: 700,
        fontSize: '0.84rem',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.15s ease'
      }}
    >
      <span
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: accentColor,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.76rem',
          fontWeight: 800
        }}
      >
        <User size={14} />
      </span>

      <span className="profile-btn-text" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {currentUser.full_name}
      </span>

      <ChevronDown size={14} color="#64748b" />
    </button>
  );
};
