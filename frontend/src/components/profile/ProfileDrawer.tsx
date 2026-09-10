import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDemo } from '../../store/demoContext';
import { api } from '../../api/client';
import {
  X, User, Shield, Stethoscope, Building2,
  Copy, Check, LogOut
} from 'lucide-react';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, showToast, logout, t } = useDemo();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Close on Escape key without logging out
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch authenticated user's actual profile from the backend
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch {
      // Fallback display from currentUser if endpoint encounters transient error
      setProfile({
        user: currentUser,
        role: currentUser.role,
        roleTitle: currentUser.role.toUpperCase(),
        attributes: {
          fullName: currentUser.full_name,
          email: currentUser.email,
          mobile: currentUser.phone ? `******${String(currentUser.phone).slice(-4)}` : null
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, currentUser.id, currentUser.role]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    showToast(`Copied ${fieldId} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };


  // Visual theming by authenticated role
  const roleThemes: Record<string, { color: string; bg: string; border: string; icon: any; title: string }> = {
    patient: {
      color: '#0d9488',
      bg: '#f0fdfa',
      border: '#99f6e4',
      icon: User,
      title: 'Patient'
    },
    asha_worker: {
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      icon: Shield,
      title: 'ANM / ASHA / Health Worker'
    },
    doctor: {
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      icon: Stethoscope,
      title: 'Doctor'
    },
    hospital: {
      color: '#4f46e5',
      bg: '#eef2ff',
      border: '#c7d2fe',
      icon: Building2,
      title: 'Hospital Management'
    },
    admin: {
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
      icon: Shield,
      title: 'Administrator'
    }
  };

  const currentTheme = roleThemes[currentUser.role] || roleThemes.patient;
  const RoleIcon = currentTheme.icon;
  const attrs = profile?.attributes || {};

  const drawerContent = (
    <>
      {/* Subtle Backdrop Overlay: Clicking outside closes drawer without logging out */}
      <div
        onClick={onClose}
        aria-hidden={!isOpen}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 99990,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 250ms ease-in-out'
        }}
      />

      {/* Slide-out Drawer Panel (Left-Anchored) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="User Profile"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          zIndex: 99991,
          boxShadow: '10px 0 35px rgba(0, 0, 0, 0.2)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 250ms ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header: Title & Accessible Close [ ✕ ] */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {t.profileDrawerTitle}
            </h2>
          </div>

          {/* Close [ ✕ ] Button: ONLY closes drawer, does NOT log out */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            title="Close profile"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.4rem' }}>
          {isLoading && !profile ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading profile details...</div>
            </div>
          ) : (
            <>
              {/* User Identity Hero Section (👤 User Name & Role) */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '1.25rem 1rem',
                  background: currentTheme.bg,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '12px',
                  marginBottom: '1.25rem'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 0.75rem auto',
                    borderRadius: '50%',
                    background: currentTheme.color,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    boxShadow: `0 4px 12px ${currentTheme.color}33`
                  }}
                >
                  <RoleIcon size={32} />
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                  {attrs.fullName || currentUser.full_name}
                </div>

                <div style={{ display: 'inline-block' }}>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: currentTheme.color,
                      background: '#ffffff',
                      border: `1px solid ${currentTheme.border}`,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px'
                    }}
                  >
                    {profile?.roleTitle || currentTheme.title}
                  </span>
                </div>
              </div>

              {/* Section: Profile Details */}
              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#475569',
                    marginBottom: '0.75rem'
                  }}
                >
                  Profile Details
                </div>

                {/* ROLE 1: PATIENT PROFILE */}
                {currentUser.role === 'patient' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Patient ID Card */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Seva Health Patient ID</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
                          {attrs.patientId || currentUser.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(attrs.patientId || currentUser.id, 'Patient ID')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: copiedField === 'Patient ID' ? '#059669' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedField === 'Patient ID' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                        <span>{copiedField === 'Patient ID' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Mobile Number */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 500 }}>Mobile</span>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                        {attrs.mobile || (currentUser.phone ? `******${String(currentUser.phone).slice(-4)}` : 'Not provided')}
                      </strong>
                    </div>

                    {/* ABHA ID Card — ONLY IF PROVIDED! (Completely omitted if null/empty) */}
                    {attrs.abhaId && (
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #99f6e4',
                          borderRadius: '10px',
                          padding: '0.75rem 0.9rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 700 }}>ABHA ID</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>{attrs.abhaId}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#0d9488', fontWeight: 700, background: '#ccfbf1', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          Verified
                        </span>
                      </div>
                    )}

                    {/* Other Patient Details (Clean & Dynamic) */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      {(attrs.dob || attrs.age) && (
                        <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Date of Birth / Age</span>
                          <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                            {attrs.dob ? `${attrs.dob}${attrs.age ? ` (${attrs.age} Y)` : ''}` : `${attrs.age} Years`}
                          </strong>
                        </div>
                      )}
                      {attrs.gender && (
                        <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Gender</span>
                          <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.gender}</strong>
                        </div>
                      )}
                      {attrs.bloodGroup && (
                        <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Blood Group</span>
                          <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.bloodGroup}</strong>
                        </div>
                      )}
                      {attrs.address && (
                        <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Address</span>
                          <strong style={{ fontSize: '0.84rem', color: '#0f172a', textAlign: 'right' }}>
                            {attrs.address}
                          </strong>
                        </div>
                      )}
                      <div style={{ padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Emergency Contact</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.emergencyContact || 'None listed'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROLE 2: ANM / ASHA PROFILE */}
                {currentUser.role === 'asha_worker' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Employee ID Card */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Employee ID</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {attrs.employeeId || 'MH-ANM-2017-31'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(attrs.employeeId || 'MH-ANM-2017-31', 'Employee ID')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: copiedField === 'Employee ID' ? '#059669' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedField === 'Employee ID' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                        <span>{copiedField === 'Employee ID' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Mobile Number */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Registered Mobile</span>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{attrs.mobile || '******3211'}</strong>
                    </div>

                    {/* Role Details */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Role / Designation</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.designation || 'Frontline Health Coordinator'}</strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Assigned Facility</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.facilityName || 'Primary Health Centre Shirwal'}</strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>District & Taluka</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                          {attrs.district || 'Satara'}, {attrs.taluka || 'Khandala'}
                        </strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Department</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.department || 'Community Health & Maternal Care'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROLE 3: DOCTOR PROFILE */}
                {currentUser.role === 'doctor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Doctor ID Card */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Doctor ID</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {attrs.doctorId || 'DOC-MH-2016'}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 700, background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {attrs.medicalRegistrationNumber || 'MMC-49201'}
                      </span>
                    </div>

                    {/* Mobile Number */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Registered Mobile</span>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{attrs.mobile || '******3212'}</strong>
                    </div>

                    {/* Clinical Details */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Specialization</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.specialization || 'General Medicine'}</strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Assigned Facility</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.assignedFacility || 'Primary Health Centre Shirwal'}</strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Department / OPD</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                          {attrs.department || 'Primary Healthcare OPD'} ({attrs.roomNumber || 'Room 2'})
                        </strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Qualification</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                          {attrs.qualification || 'MBBS, DNB'} • {attrs.experienceYears || '8 Years'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROLE 4: HOSPITAL MANAGEMENT PROFILE */}
                {currentUser.role === 'hospital' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Staff ID Card */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Staff ID</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {attrs.staffId || 'STAFF-MH-2021'}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#4f46e5', fontWeight: 700, background: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        Facility Ops
                      </span>
                    </div>

                    {/* Mobile Number */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Registered Mobile</span>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{attrs.mobile || '******3213'}</strong>
                    </div>

                    {/* Facility Operations Details */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Designation</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.designation || 'Hospital Operations Officer'}</strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Authorized Facility</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a', textAlign: 'right' }}>
                          {attrs.authorizedHospital || 'Primary Health Centre Shirwal'}
                        </strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>District Jurisdiction</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.district || 'Satara'}</strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Department</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.department || 'Administration & Bed Allocation'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROLE 5: ADMIN PROFILE */}
                {currentUser.role === 'admin' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Admin ID Card */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.75rem 0.9rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Admin ID</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {attrs.adminId || 'ADMIN-MH-DIST-01'}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#7c3aed', fontWeight: 700, background: '#f5f3ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        System Admin
                      </span>
                    </div>

                    {/* Mobile Number */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Registered Mobile</span>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{attrs.mobile || '******3214'}</strong>
                    </div>

                    {/* Admin Scope */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Designation</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{attrs.designation || 'State Health Administrator'}</strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Administrative Scope</span>
                        <strong style={{ fontSize: '0.84rem', color: '#0f172a', textAlign: 'right' }}>
                          {attrs.administrativeScope || 'Maharashtra State Health Directorate & Satara District'}
                        </strong>
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Official Email</span>
                        <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{currentUser.email || 'admin@sevahealth.gov.in'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Area: Close and Logout Buttons */}
        <div
          style={{
            padding: '1rem 1.4rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
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
            {t.close}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            aria-label={t.signOut}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#dc2626',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} /> {t.signOut}
          </button>
        </div>
      </aside>
    </>
  );

  return createPortal(drawerContent, document.body);
};
