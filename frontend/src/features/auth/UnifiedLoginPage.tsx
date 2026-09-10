import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  User,
  Shield,
  Stethoscope,
  Building2,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Smartphone,
  CreditCard,
  Globe,
  HeartPulse,
  BadgeCheck,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { SupportedLanguage } from '../../i18n/translations';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { ForgotPatientIdModal } from './ForgotPatientIdModal';

type RoleKey = 'patient' | 'asha_worker' | 'doctor' | 'hospital' | 'admin';

interface RoleCardConfig {
  id: RoleKey;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  accentColor: string;
  lightBg: string;
  borderColor: string;
  demoIdentifier: string;
  dashboardName: string;
}

const ROLE_CONFIGS: RoleCardConfig[] = [
  {
    id: 'patient',
    title: 'Patient',
    subtitle: 'My Health • ABHA-enabled',
    badge: 'ABHA Citizen',
    icon: User,
    accentColor: '#0d9488',
    lightBg: '#f0fdfa',
    borderColor: '#99f6e4',
    demoIdentifier: 'P-10452',
    dashboardName: '/citizen (Patient Health Portal)'
  },
  {
    id: 'asha_worker',
    title: 'ANM / ASHA',
    subtitle: 'Field Care • Community Care',
    badge: 'Frontline Care',
    icon: Shield,
    accentColor: '#059669',
    lightBg: '#ecfdf5',
    borderColor: '#a7f3d0',
    demoIdentifier: 'ASHA001',
    dashboardName: '/anm/dashboard (Community Field Care)'
  },
  {
    id: 'doctor',
    title: 'Doctor',
    subtitle: 'Clinical Care • Better Outcomes',
    badge: 'OPD & Teleconsult',
    icon: Stethoscope,
    accentColor: '#2563eb',
    lightBg: '#eff6ff',
    borderColor: '#bfdbfe',
    demoIdentifier: 'DOC001',
    dashboardName: '/doctor/dashboard (Clinical Care Portal)'
  },
  {
    id: 'hospital',
    title: 'Hospital Management',
    subtitle: 'Hospital Operations • Beds • Admissions • Referrals',
    badge: 'Facility Ops',
    icon: Building2,
    accentColor: '#4f46e5',
    lightBg: '#eef2ff',
    borderColor: '#c7d2fe',
    demoIdentifier: 'HOSP001',
    dashboardName: '/hospital/dashboard (Operations & Beds)'
  },
  {
    id: 'admin',
    title: 'Admin',
    subtitle: 'Command Center • System Oversight',
    badge: 'Command Center',
    icon: ShieldAlert,
    accentColor: '#7c3aed',
    lightBg: '#faf5ff',
    borderColor: '#e9d5ff',
    demoIdentifier: 'ADMIN001',
    dashboardName: '/admin/dashboard (District Command Center)'
  }
];

export const UnifiedLoginPage: React.FC = () => {
  const { t, login, loginWithPatientOtp, language, setLanguage, showToast } = useDemo();

  // Selected role - default is 'patient'
  const [selectedRole, setSelectedRole] = useState<RoleKey>('patient');

  // Patient Login States
  const [patientTab, setPatientTab] = useState<'patient_id' | 'abha'>('patient_id');
  const [patientId, setPatientId] = useState('');
  const [otpValue, setOtpValue] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('****5789');
  const [cooldown, setCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [abhaId, setAbhaId] = useState('');

  // Registration modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registrationKey, setRegistrationKey] = useState(0);

  // Forgot Patient ID modal state
  const [isForgotIdOpen, setIsForgotIdOpen] = useState(false);

  // Staff credentials for other 4 roles
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRoleConfig = ROLE_CONFIGS.find((r) => r.id === selectedRole)!;

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle successful registration: populate Patient ID and ready for Send OTP
  const handleRegistrationSuccess = (newPatientId: string, _registeredPhone: string) => {
    setPatientId(newPatientId);
    setPatientTab('patient_id');
    setOtpSent(false);
    setOtpValue('123456');
    showToast(`Registration Successful! Seva Health Patient ID: ${newPatientId}. Click Send OTP to proceed.`, 'success');
  };

  // 1. Send OTP to registered mobile for Patient ID
  const handleSendPatientOtp = async () => {
    if (!patientId || !patientId.trim()) {
      showToast('Please enter your Seva Health Patient ID.', 'error');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await api.sendPatientOtp(patientId.trim());
      setMaskedPhone(res.maskedPhone || '****5789');
      setOtpSent(true);
      setOtpValue(res.demoOtp || '123456');
      setCooldown(30);
      showToast(res.message || `OTP sent to registered mobile ending in ${res.maskedPhone}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send OTP. Please verify your Patient ID.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify OTP and login Patient
  const handleVerifyPatientOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue || !otpValue.trim()) {
      showToast('Please enter the 6-digit OTP code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await loginWithPatientOtp(patientId.trim(), otpValue.trim());
      if (!success) {
        showToast('Invalid OTP. Please check the code or request Resend OTP.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Verification encountered an issue.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle standard form submission for other roles or ABHA
  const handleStaffOrAbhaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedRole === 'patient') {
        // ABHA pathway
        const trimmed = abhaId.trim();
        if (!trimmed) {
          showToast('Please enter your ABHA ID', 'error');
          setIsSubmitting(false);
          return;
        }
        await login('patient', trimmed);
      } else {
        const trimmedId = staffId.trim();
        const trimmedPassword = password.trim();
        if (!trimmedId || !trimmedPassword) {
          showToast('Please enter both User ID and Password.', 'error');
          setIsSubmitting(false);
          return;
        }
        await login(selectedRole, trimmedId, trimmedPassword);
      }
    } catch {
      showToast('Login attempt encountered an issue.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. 1-Click Instant Demo Access for Evaluators / SIH Judges
  const handleInstantDemoLogin = async () => {
    setIsSubmitting(true);
    try {
      if (selectedRole === 'patient') {
        // Direct Patient ID login
        await login('patient', patientId || 'P-10452', 'demo123');
      } else {
        await login(selectedRole, activeRoleConfig.demoIdentifier, 'demo123');
      }
    } catch {
      showToast('Demo login failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 40%, #ffffff 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '2.5rem 1.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        {/* TOP BAR: Language Switcher */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: '0.5rem',
              padding: '0.2rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Globe size={14} style={{ margin: '0 0.35rem', color: '#64748b' }} />
            {(['mr', 'en', 'hi'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: language === lang ? '#0d9488' : 'transparent',
                  color: language === lang ? '#ffffff' : '#64748b',
                  fontWeight: language === lang ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER-TOP BRANDING                                            */}
        {/* ============================================================== */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.35)',
              marginBottom: '0.85rem'
            }}
          >
            <HeartPulse size={34} color="#ffffff" />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '2.45rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0f172a',
              lineHeight: 1.15
            }}
          >
            {t.appTitle}
          </h1>

          <div
            style={{
              fontSize: '1.05rem',
              color: '#0d9488',
              fontWeight: 700,
              marginTop: '0.35rem',
              letterSpacing: '0.02em'
            }}
          >
            {t.appSubtitle}
          </div>

          <div
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#1e293b',
              lineHeight: 1.4,
              marginTop: '0.85rem'
            }}
          >
            {t.appTagline}
          </div>

          <p
            style={{
              fontSize: '0.94rem',
              color: '#64748b',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0.65rem auto 0 auto'
            }}
          >
            A unified digital care ecosystem connecting Citizens, ANM Field Health Workers, PHC Doctors, Secondary Hospitals, and District Health Authorities into one synchronized platform.
          </p>
        </div>

        {/* ============================================================== */}
        {/* FIVE ACCESS TYPES SELECTOR                                     */}
        {/* ============================================================== */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}
          >
            {t.selectRole}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {ROLE_CONFIGS.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${role.accentColor}` : '1.5px solid #e2e8f0',
                    background: isSelected ? role.lightBg : '#ffffff',
                    boxShadow: isSelected
                      ? `0 6px 16px -2px ${role.accentColor}33`
                      : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '85px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        background: isSelected ? role.accentColor : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    {isSelected ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          background: role.accentColor,
                          color: '#ffffff',
                          borderRadius: '9999px',
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}
                      >
                        <CheckCircle2 size={12} /> Active
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: '#64748b',
                          background: '#f8fafc',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {role.badge}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '0.6rem' }}>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: isSelected ? '#0f172a' : '#1e293b'
                      }}
                    >
                      {role.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: isSelected ? role.accentColor : '#64748b',
                        fontWeight: isSelected ? 600 : 500,
                        marginTop: '0.15rem',
                        lineHeight: 1.3
                      }}
                    >
                      {role.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* DYNAMIC ROLE LOGIN FORM CONTAINER                              */}
        {/* ============================================================== */}
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            background: '#ffffff',
            border: `1.5px solid ${activeRoleConfig.borderColor}`,
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            position: 'relative'
          }}
        >
          {/* Active Portal Header Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid #f1f5f9',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: activeRoleConfig.accentColor
                }}
              />
              <span style={{ fontSize: selectedRole === 'patient' ? '1.25rem' : '1rem', fontWeight: 700, color: '#0f172a' }}>
                {selectedRole === 'patient'
                  ? 'Patient Login'
                  : selectedRole === 'asha_worker'
                  ? 'ANM / ASHA / Health Worker Login'
                  : selectedRole === 'doctor'
                  ? 'Doctor Login'
                  : selectedRole === 'hospital'
                  ? 'Hospital Management'
                  : 'Admin Login'}
              </span>
            </div>
          </div>

          {/* ========================================================== */}
          {/* ROLE 1: PATIENT LOGIN (Patient ID + OTP or ABHA ID)       */}
          {/* ========================================================== */}
          {selectedRole === 'patient' && (
            <div>
              {/* Tabs: Seva Health Patient ID vs ABHA ID */}
              <div
                style={{
                  display: 'flex',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '0.25rem',
                  marginBottom: '1.25rem',
                  border: '1px solid #e2e8f0'
                }}
              >
                <button
                  type="button"
                  onClick={() => setPatientTab('patient_id')}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: patientTab === 'patient_id' ? '#ffffff' : 'transparent',
                    color: patientTab === 'patient_id' ? '#0d9488' : '#64748b',
                    fontWeight: patientTab === 'patient_id' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: patientTab === 'patient_id' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Smartphone size={15} /> Seva Health Patient ID
                </button>

                <button
                  type="button"
                  onClick={() => setPatientTab('abha')}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: patientTab === 'abha' ? '#ffffff' : 'transparent',
                    color: patientTab === 'abha' ? '#0d9488' : '#64748b',
                    fontWeight: patientTab === 'abha' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: patientTab === 'abha' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <CreditCard size={15} /> ABHA Health ID
                </button>
              </div>

              {patientTab === 'patient_id' ? (
                <div>
                  {/* Step 1: Patient ID input */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                        Seva Health Patient ID
                      </label>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={patientId}
                        onChange={(e) => {
                          setPatientId(e.target.value.toUpperCase());
                          if (otpSent) setOtpSent(false); // reset OTP state if user edits ID
                        }}
                        disabled={otpSent}
                        placeholder="Enter Patient ID"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '1rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          outline: 'none',
                          color: '#0f172a',
                          background: otpSent ? '#f8fafc' : '#ffffff'
                        }}
                      />

                      {otpSent && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpValue('123456');
                          }}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#e2e8f0',
                            border: 'none',
                            color: '#475569',
                            borderRadius: '6px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Edit2 size={12} /> Change ID
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                      Enter the Patient ID provided during registration (e.g. <strong>P-10452</strong>).
                    </div>
                  </div>

                  {/* If OTP not sent yet: Show Send OTP button & Register Now Card */}
                  {!otpSent ? (
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={handleSendPatientOtp}
                        disabled={isSendingOtp || !patientId.trim()}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: '#0d9488',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.8rem 1.25rem',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.96rem',
                          cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSendingOtp ? (
                          <>
                            <RefreshCw size={18} className="spin-animation" />
                            <span>Finding Patient & Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Send OTP</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>

                      {/* Forgot Patient ID action */}
                      <div style={{ textAlign: 'center', marginTop: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={() => setIsForgotIdOpen(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0d9488',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Forgot Patient ID?
                        </button>
                      </div>

                      {/* Clearly Visible Patient Registration Banner */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f0fdfa',
                          border: '1.5px dashed #0d9488',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          marginTop: '1.5rem',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.88rem', color: '#0f766e', fontWeight: 700 }}>
                            New to Seva Health?
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Register now to generate your unique Seva Health Patient ID.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setRegistrationKey((k) => k + 1);
                            setIsRegisterOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#0d9488',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.45rem 0.95rem',
                            borderRadius: '8px',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)'
                          }}
                        >
                          <Sparkles size={14} /> Register Now
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: OTP Sent Confirmation + OTP Input */
                    <form onSubmit={handleVerifyPatientOtpSubmit} style={{ marginTop: '1.25rem' }}>
                      {/* OTP Notification Banner */}
                      <div
                        style={{
                          background: '#ecfdf5',
                          border: '1.5px solid #a7f3d0',
                          borderRadius: '10px',
                          padding: '0.85rem 1rem',
                          marginBottom: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem'
                        }}
                      >
                        <CheckCircle2 size={20} color="#059669" />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065f46' }}>
                            OTP sent to your registered mobile number ending in {maskedPhone}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '0.15rem' }}>
                            Please enter the 6-digit verification code below.
                          </div>
                        </div>
                      </div>

                      {/* Enter OTP Code */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                            Enter OTP Code
                          </label>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#0d9488',
                              fontWeight: 700,
                              background: '#ccfbf1',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px'
                            }}
                          >
                            Demo OTP: 123456
                          </span>
                        </div>

                        <input
                          type="text"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="1 2 3 4 5 6"
                          maxLength={6}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1.5px solid #0d9488',
                            fontSize: '1.35rem',
                            letterSpacing: '0.35em',
                            fontWeight: 800,
                            textAlign: 'center',
                            outline: 'none',
                            color: '#0f172a',
                            background: '#ffffff'
                          }}
                        />

                        {/* Demo Mode Notice */}
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.45rem', textAlign: 'center' }}>
                          Demo Mode — OTP is simulated for the SIH prototype.
                        </div>
                      </div>

                      {/* Verify Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || otpValue.length < 6}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: '#0d9488',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.85rem 1.25rem',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.96rem',
                          cursor: isSubmitting || otpValue.length < 6 ? 'not-allowed' : 'pointer',
                          opacity: isSubmitting || otpValue.length < 6 ? 0.7 : 1,
                          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>Verify & Enter Patient Portal</span>
                        <ArrowRight size={18} />
                      </button>

                      {/* Resend OTP button */}
                      <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={handleSendPatientOtp}
                          disabled={cooldown > 0 || isSendingOtp}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: cooldown > 0 ? '#94a3b8' : '#0d9488',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                            textDecoration: cooldown > 0 ? 'none' : 'underline'
                          }}
                        >
                          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* ABHA Alternative Tab */
                <form onSubmit={handleStaffOrAbhaSubmit}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      ABHA ID
                    </label>
                    <input
                      type="text"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      placeholder="Enter ABHA ID"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.92rem',
                        outline: 'none',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: '#0d9488',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Continue with ABHA</span>
                    <ArrowRight size={17} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* ROLE 2: ANM / ASHA / HEALTH WORKER LOGIN                   */}
          {/* ========================================================== */}
          {selectedRole === 'asha_worker' && (
            <form onSubmit={handleStaffOrAbhaSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Employee ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Enter Employee ID (e.g. ASHA001)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Security Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password (e.g. Demo@123)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: activeRoleConfig.accentColor,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 12px ${activeRoleConfig.accentColor}44`
                }}
              >
                <span>Sign In</span>
                <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ========================================================== */}
          {/* ROLE 3: DOCTOR LOGIN                                       */}
          {/* ========================================================== */}
          {selectedRole === 'doctor' && (
            <form onSubmit={handleStaffOrAbhaSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Doctor ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Enter Doctor ID (e.g. DOC001)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password (e.g. Demo@123)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: activeRoleConfig.accentColor,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 12px ${activeRoleConfig.accentColor}44`
                }}
              >
                <span>Sign In</span>
                <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ========================================================== */}
          {/* ROLE 4: HOSPITAL MANAGEMENT LOGIN                          */}
          {/* ========================================================== */}
          {selectedRole === 'hospital' && (
            <form onSubmit={handleStaffOrAbhaSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Staff ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Enter Staff ID (e.g. HOSP001)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password (e.g. Demo@123)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: activeRoleConfig.accentColor,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 12px ${activeRoleConfig.accentColor}44`
                }}
              >
                <span>Sign In</span>
                <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ========================================================== */}
          {/* ROLE 5: ADMIN LOGIN                                        */}
          {/* ========================================================== */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleStaffOrAbhaSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Admin ID
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Enter Admin ID (e.g. ADMIN001)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password (e.g. Demo@123)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: activeRoleConfig.accentColor,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 12px ${activeRoleConfig.accentColor}44`
                }}
              >
                <span>Sign In</span>
                <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ========================================================== */}
          {/* 1-CLICK INSTANT DEMO EVALUATION BUTTON (PATIENT ONLY)      */}
          {/* ========================================================== */}
          {selectedRole === 'patient' && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={handleInstantDemoLogin}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  background: '#f8fafc',
                  color: '#0f172a',
                  border: '1.5px dashed #94a3b8',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={16} color={activeRoleConfig.accentColor} />
                <span>
                  1-Click Instant Demo Access as <strong>Patient</strong>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Security / Compliance Micro-Footer */}
        <div
          style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.74rem',
            color: '#64748b',
            lineHeight: 1.6
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#0f766e' }}>
            <BadgeCheck size={14} /> ABDM Compliant & HL7 FHIR Aligned • 256-bit SSL Encrypted • DPDP Act 2023 Conforming
          </span>
          <br />
          For Emergency Assistance without login, call <strong>108 (Emergency Ambulance)</strong> or <strong>104 (National Health Helpline)</strong>.
        </div>
      </div>

      {/* Patient Registration Modal */}
      <PatientRegistrationModal
        key={registrationKey}
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegistrationSuccess={handleRegistrationSuccess}
      />

      {/* Forgot Patient ID Recovery Modal */}
      <ForgotPatientIdModal
        isOpen={isForgotIdOpen}
        onClose={() => setIsForgotIdOpen(false)}
        onRecovered={(recoveredId) => {
          setPatientId(recoveredId);
          showToast(`Patient ID ${recoveredId} recovered. Click Send OTP to proceed.`, 'success');
        }}
      />
    </div>
  );
};
