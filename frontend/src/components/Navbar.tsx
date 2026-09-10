import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDemo } from '../store/demoContext';
import { HeartPulse, Globe, User, ShieldAlert, LayoutDashboard, Calendar, Search, Pill, Stethoscope, AlertTriangle, Building2, LogOut } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';
import { ProfileButton } from './profile/ProfileButton';

export const Navbar: React.FC<{ onOpenEmergency?: () => void }> = () => {
  const { t, language, setLanguage, currentView, setCurrentView, currentUser, lowLiteracyMode, playAudioPrompt, logout, isProfileOpen, setIsProfileOpen } = useDemo();
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  // Close Sign Out confirmation on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSignOutConfirmOpen) {
        setIsSignOutConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSignOutConfirmOpen]);

  const navItems = [
    { id: 'home', label: t.platformHome, icon: HeartPulse },
    { id: 'citizen', label: t.findHealthcare, icon: Search },
    { id: 'queue', label: t.liveQueue, icon: Calendar },
    { id: 'medicines', label: t.medicines, icon: Pill },
    { id: 'ehr', label: t.myRecords, icon: User },
    { id: 'referrals', label: t.referrals, icon: HeartPulse },
    { id: 'frontline', label: t.ashaCommunity, icon: HeartPulse, roleRequired: ['asha_worker', 'admin'] },
    { id: 'doctor', label: t.doctorOpd, icon: Stethoscope, roleRequired: ['doctor', 'admin'] },
    { id: 'hospital', label: t.hospitalManagement, icon: Building2, roleRequired: ['hospital', 'doctor', 'admin'] },
    { id: 'admin', label: t.adminDashboard, icon: LayoutDashboard, roleRequired: ['admin'] }
  ];

  const visibleItems = navItems.filter(item => {
    // Role-aware: Remove healthcare feature links from top navigation for Patient role
    // (Features are now accessible directly on the Patient Dashboard)
    if (currentUser?.role === 'patient') {
      const patientExcluded = ['home', 'citizen', 'queue', 'medicines', 'ehr', 'referrals'];
      if (patientExcluded.includes(item.id)) return false;
    }
    if (!item.roleRequired) return true;
    return item.roleRequired.includes(currentUser?.role);
  });


  return (
    <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {/* Main Navbar */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        {/* Brand */}
        <div
          onClick={() => setCurrentView(currentUser?.role === 'patient' ? 'citizen' : 'home')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)'
          }}>
            <HeartPulse size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.28rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {t.appTitle}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              {t.appSubtitle}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        {visibleItems.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', padding: '0.25rem 0' }}>
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isSelected = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    if (lowLiteracyMode) {
                      playAudioPrompt(item.label);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: isSelected ? '1px solid #14b8a6' : '1px solid transparent',
                    background: isSelected ? '#f0fdfa' : 'transparent',
                    color: isSelected ? '#0f766e' : '#334155',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={16} color={isSelected ? '#0d9488' : '#64748b'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Actions (Language Switcher & Emergency Button) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Selector */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.2rem' }}>
            <Globe size={15} style={{ margin: '0 0.4rem', color: '#64748b' }} />
            {(['mr', 'en', 'hi'] as SupportedLanguage[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: language === lang ? '#ffffff' : 'transparent',
                  color: language === lang ? '#0f766e' : '#64748b',
                  fontWeight: language === lang ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: language === lang ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>

          {/* Profile Button */}
          <ProfileButton onClick={() => setIsProfileOpen(true)} />

          {/* User Sign Out Button */}
          <button
            type="button"
            onClick={() => setIsSignOutConfirmOpen(true)}
            aria-label={t.signOut}
            title={`Signed in as ${currentUser.full_name} (${currentUser.role}). Click to sign out.`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={15} color="#b91c1c" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal Dialog */}
      {isSignOutConfirmOpen && createPortal(
        <>
          <div
            onClick={() => setIsSignOutConfirmOpen(false)}
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 99998,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-dialog-title"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '400px',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              zIndex: 99999,
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}
            >
              <LogOut size={22} />
            </div>

            <h3 id="signout-dialog-title" style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {t.confirmSignOut}
            </h3>

            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              {t.signOutPrompt}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsSignOutConfirmOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignOutConfirmOpen(false);
                  logout();
                }}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  background: '#dc2626',
                  border: '1px solid #b91c1c',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.signOut}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
};
