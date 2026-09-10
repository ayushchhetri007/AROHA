import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useDemo } from '../../store/demoContext';
import { X, Phone, KeyRound, CheckCircle2, ArrowRight, RefreshCw, Sparkles, Copy, Check } from 'lucide-react';

interface ForgotPatientIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecovered: (patientId: string) => void;
}

export const ForgotPatientIdModal: React.FC<ForgotPatientIdModalProps> = ({
  isOpen,
  onClose,
  onRecovered
}) => {
  const { showToast } = useDemo();
  const [step, setStep] = useState<'mobile' | 'otp' | 'success'>('mobile');
  const [mobile, setMobile] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('123456');
  const [recoveredPatientId, setRecoveredPatientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep('mobile');
      setMobile('');
      setRecoveryToken('');
      setMaskedPhone('');
      setOtp('');
      setRecoveredPatientId('');
      setIsSubmitting(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Step 1: Submit Mobile Number
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = mobile.replace(/\D/g, '');
    if (clean.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.forgotPatientIdSendOtp(clean);
      setRecoveryToken(res.recoveryToken);
      setMaskedPhone(res.maskedPhone || `****${clean.slice(-4)}`);
      setDemoOtp(res.demoOtp || '123456');
      setOtp(res.demoOtp || '123456');
      setStep('otp');
      showToast(res.message || 'OTP sent successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not find patient with this mobile number.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      showToast('Please enter the 6-digit OTP code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.forgotPatientIdVerifyOtp(recoveryToken, otp.trim());
      if (res.verified && res.patientId) {
        setRecoveredPatientId(res.patientId);
        setStep('success');
        showToast('Identity Verified successfully!', 'success');
      } else {
        showToast('Verification failed. Please try again.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid or expired OTP.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Continue to Login
  const handleContinueToLogin = () => {
    onRecovered(recoveredPatientId);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveredPatientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: '#f0fdfa',
            borderBottom: '1px solid #99f6e4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#0d9488',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Forgot Patient ID?
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 600 }}>
                Secure Patient ID Recovery
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* STEP 1: MOBILE NUMBER INPUT */}
          {step === 'mobile' && (
            <form onSubmit={handleMobileSubmit}>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                Enter your registered mobile number to recover your Patient ID.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
                  Registered Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter Mobile Number (e.g. 9823455789)"
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.75rem 0.85rem 0.75rem 2.4rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      color: '#0f172a',
                      letterSpacing: '0.05em',
                      fontWeight: 600
                    }}
                  />
                  <Phone size={16} color="#0d9488" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.4rem' }}>
                  Demo Mode — OTP is simulated for the SIH prototype.
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || mobile.length < 10}
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
                  fontSize: '0.95rem',
                  cursor: isSubmitting || mobile.length < 10 ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || mobile.length < 10 ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={17} className="spin-animation" />
                    <span>Searching records...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Verify Mobile</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
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
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#065f46' }}>
                  OTP sent to your registered mobile number ending in {maskedPhone}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                    Enter OTP
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
                    Demo OTP: {demoOtp}
                  </span>
                </div>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1.5px solid #0d9488',
                    fontSize: '1.35rem',
                    letterSpacing: '0.35em',
                    fontWeight: 800,
                    textAlign: 'center',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.4rem', textAlign: 'center' }}>
                  Demo Mode — OTP is simulated for the SIH prototype.
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
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
                  fontSize: '0.95rem',
                  cursor: isSubmitting || otp.length < 6 ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || otp.length < 6 ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={17} className="spin-animation" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('mobile')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Change mobile number
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS & PATIENT ID REVEAL */}
          {step === 'success' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#059669',
                  fontWeight: 800,
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <CheckCircle2 size={22} />
                <span>Identity Verified ✓</span>
              </div>

              <div
                style={{
                  background: '#f0fdfa',
                  border: '2px solid #0d9488',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Seva Health Patient ID
                </div>

                <div
                  style={{
                    fontSize: '1.9rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: '0.06em',
                    margin: '0.5rem 0'
                  }}
                >
                  {recoveredPatientId}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#ffffff',
                    border: '1px solid #0d9488',
                    color: '#0d9488',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Patient ID'}</span>
                </button>

                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Please record your Patient ID safely for future logins and clinic appointments.
                </p>
              </div>

              <button
                type="button"
                onClick={handleContinueToLogin}
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
                  fontSize: '0.98rem',
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
      </div>
    </div>
  );
};
