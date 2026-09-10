import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  User,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  Check,
  Sparkles,
  HeartPulse,
  Lock
} from 'lucide-react';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess: (patientId: string, phone: string) => void;
}

const initialFormData = {
  // Step 1: Personal
  fullName: '',
  dob: '',
  gender: 'Male',
  bloodGroup: 'B+',
  preferredLanguage: 'en',

  // Step 2: Contact
  mobileNumber: '',
  email: '',
  emergencyContact: '',

  // Step 3: Address
  state: 'Maharashtra',
  district: '',
  taluka: '',
  village: '',
  pinCode: '',
  address: '',

  // Step 4: Identity Verification
  aadhaarNumber: '',
  abhaId: '',
  identityConfirmed: true
};

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistrationSuccess
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedPatientId, setGeneratedPatientId] = useState<string>('');
  const [formData, setFormData] = useState(initialFormData);

  // ALWAYS reset registration state to fresh empty form when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData(initialFormData);
      setGeneratedPatientId('');
      setError(null);
      setCopied(false);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    setStep(1);
    setFormData(initialFormData);
    setGeneratedPatientId('');
    setError(null);
    onClose();
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Step Validations
  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      if (!formData.dob) {
        setError('Please enter a valid date of birth.');
        return false;
      }
    }

    if (currentStep === 2) {
      const cleanPhone = formData.mobileNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.district.trim() || !formData.village.trim()) {
        setError('Please enter your district and village/town.');
        return false;
      }
      if (!/^\d{6}$/.test(formData.pinCode.trim())) {
        setError('Please enter a valid 6-digit PIN code.');
        return false;
      }
    }

    if (currentStep === 4) {
      const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, '');
      if (cleanAadhaar.length < 12) {
        setError('Please enter a 12-digit Aadhaar number for simulated demo verification.');
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Final Submit
  const handleRegisterSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        full_name: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        phone: formData.mobileNumber,
        email: formData.email,
        blood_group: formData.bloodGroup,
        emergency_contact: formData.emergencyContact,
        preferred_language: formData.preferredLanguage,
        state: formData.state,
        district: formData.district,
        taluka: formData.taluka,
        village: formData.village,
        pin_code: formData.pinCode,
        address: formData.address,
        aadhaar_number: formData.aadhaarNumber,
        abha_id: formData.abhaId && formData.abhaId.trim().length > 0 ? formData.abhaId.trim() : null
      });

      const pId = res.patientId;
      setGeneratedPatientId(pId);
      setStep(6); // Move to Step 6 Success screen
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(generatedPatientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteAndLogin = () => {
    const pId = generatedPatientId;
    const phone = formData.mobileNumber;
    onRegistrationSuccess(pId, phone);
    setStep(1);
    setFormData(initialFormData);
    setGeneratedPatientId('');
    setError(null);
    onClose();
  };

  const stepsList = [
    { num: 1, label: 'Personal' },
    { num: 2, label: 'Contact' },
    { num: 3, label: 'Address' },
    { num: 4, label: 'Identity' },
    { num: 5, label: 'Confirm' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HeartPulse size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Create your Seva Health Account
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#ccfbf1', marginTop: '0.15rem' }}>
                Patient Care Continuum • Multi-Tier Public Healthcare Gateway
              </div>
            </div>
          </div>

          <button
            onClick={handleCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Stepper (Visible during Steps 1-5) */}
        {step <= 5 && (
          <div
            style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '0.85rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            {stepsList.map((s, idx) => {
              const isActive = step === s.num;
              const isPast = step > s.num;

              return (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isActive ? '#0d9488' : isPast ? '#10b981' : '#e2e8f0',
                      color: isActive || isPast ? '#ffffff' : '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isPast ? <Check size={14} /> : s.num}
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#0f766e' : '#64748b'
                    }}
                  >
                    {s.label}
                  </span>
                  {idx < stepsList.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: '2px',
                        background: isPast ? '#10b981' : '#e2e8f0',
                        margin: '0 0.5rem'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div
            style={{
              margin: '1rem 1.75rem 0',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Step 1 of 5: Enter your basic personal details.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Full Name (as per official identity) *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => updateField('dob', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Blood Group (Optional)
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => updateField('bloodGroup', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Preferred Language
                  </label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) => updateField('preferredLanguage', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  >
                    <option value="en">English</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT INFORMATION */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Step 2 of 5: Contact and emergency notification information.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Mobile Number (Used for OTP Login) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: '0.88rem',
                      fontWeight: 600
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => updateField('mobileNumber', e.target.value)}
                    placeholder="9823456789"
                    maxLength={10}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.75rem 0.65rem 3rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="rahul.kumar@example.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Emergency Contact Details
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => updateField('emergencyContact', e.target.value)}
                  placeholder="Name (Relationship) - Phone Number"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem' }}>
                  Notified automatically during critical emergency referrals or 108 dispatches.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADDRESS & LOCATION */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                Step 3 of 5: Location used to recommend nearest Sub-Centres, PHCs, and Hospitals.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    District *
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  >
                    <option value="Satara">Satara</option>
                    <option value="Pune">Pune</option>
                    <option value="Ahmednagar">Ahmednagar</option>
                    <option value="Nandurbar">Nandurbar</option>
                    <option value="Gadchiroli">Gadchiroli</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Taluka / Block *
                  </label>
                  <input
                    type="text"
                    value={formData.taluka}
                    onChange={(e) => updateField('taluka', e.target.value)}
                    placeholder="e.g. Khandala / Wai"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Village / Town *
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => updateField('village', e.target.value)}
                    placeholder="e.g. Shirwal"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => updateField('pinCode', e.target.value)}
                    placeholder="412801"
                    maxLength={6}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Street / Residential Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="e.g. Near Gram Panchayat"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: IDENTITY VERIFICATION (SIMULATED DEMO) */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: '#fef3c7',
                  border: '1.5px solid #fde68a',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  color: '#92400e',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem'
                }}
              >
                <ShieldCheck size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>
                    Demo Mode — Identity verification is simulated for the SIH prototype.
                  </div>
                  <div>
                    In accordance with UIDAI privacy guidelines, Aadhaar numbers are never stored in plain text or used as application login credentials. A unique internal <strong>Seva Health Patient ID</strong> will be generated.
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Aadhaar Number (12 Digits) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={(e) => updateField('aadhaarNumber', e.target.value)}
                    placeholder="5482 9104 7291"
                    maxLength={14}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.75rem',
                      borderRadius: '8px',
                      border: '1.5px solid #0d9488',
                      fontSize: '1.05rem',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.76rem', color: '#0d9488', fontWeight: 600, marginTop: '0.35rem' }}>
                  ✓ Masked ID Preview: XXXX-XXXX-{formData.aadhaarNumber.slice(-4) || '7291'}
                </div>
              </div>

              {/* Optional ABHA ID Field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    ABHA ID / Health ID
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    Optional
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.abhaId}
                  onChange={(e) => updateField('abhaId', e.target.value)}
                  placeholder="Enter ABHA ID (Optional)"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.7rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem' }}>
                  If you already have an ABHA ID, you may enter it here. Otherwise, you can leave this blank.
                </div>
              </div>

              <div
                style={{
                  background: '#f0fdfa',
                  border: '1px solid #ccfbf1',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.82rem',
                  color: '#0f766e'
                }}
              >
                <strong>Identity Pipeline:</strong>
                <div style={{ marginTop: '0.35rem', lineHeight: 1.5 }}>
                  Identity Details Verified ➔ Verification Successful ➔ Seva Health Patient ID Generated (e.g. P-10452, P-10453)
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & CONFIRM */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Please review your registration details before account creation.
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.86rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Full Name:</span>
                  <strong style={{ color: '#0f172a' }}>{formData.fullName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Date of Birth / Gender:</span>
                  <strong style={{ color: '#0f172a' }}>{formData.dob} ({formData.gender})</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Registered Mobile:</span>
                  <strong style={{ color: '#0f172a' }}>+91 {formData.mobileNumber}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Primary Location:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {formData.village}, {formData.taluka}, {formData.district} ({formData.pinCode})
                  </strong>
                </div>

                {formData.abhaId && formData.abhaId.trim().length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#64748b' }}>ABHA ID:</span>
                    <strong style={{ color: '#0f172a' }}>{formData.abhaId.trim()}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Identity Verification:</span>
                  <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={15} /> Demo Identity Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PATIENT ID GENERATED (SUCCESS) */}
          {step === 6 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <CheckCircle2 size={40} />
              </div>

              <h3 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                Registration Successful ✓
              </h3>
              <p style={{ color: '#0f766e', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
                Welcome to Seva Health, {formData.fullName}!
              </p>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
                This ID will be used to access your Seva Health account.
              </p>

              {/* Patient ID Display Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                  border: '2px solid #0d9488',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  maxWidth: '440px',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.2)'
                }}
              >
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f766e', fontWeight: 700 }}>
                  YOUR SEVA HEALTH PATIENT ID
                </div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    color: '#0f172a',
                    margin: '0.4rem 0'
                  }}
                >
                  {generatedPatientId}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#0d9488', fontWeight: 600 }}>
                  Registered mobile: <strong>{formData.mobileNumber ? `******${formData.mobileNumber.slice(-4)}` : '******3211'}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{
                    marginTop: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#ffffff',
                    border: '1px solid #99f6e4',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f766e',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to clipboard' : 'Copy Patient ID'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCompleteAndLogin}
                style={{
                  width: '100%',
                  maxWidth: '440px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)'
                }}
              >
                <span>Continue to Patient Login</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Steps 1-5) */}
        {step <= 5 && (
          <div
            style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '1rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#0d9488',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <span>Next Step</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleRegisterSubmit}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#059669',
                  border: 'none',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
                }}
              >
                <CheckCircle2 size={17} />
                <span>{loading ? 'Generating Patient ID...' : 'Create Account & Generate ID'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
