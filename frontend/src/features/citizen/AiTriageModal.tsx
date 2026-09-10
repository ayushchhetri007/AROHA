import React, { useState } from 'react';
import api from '../../api/client';
import { Activity, AlertTriangle, CheckCircle2, Building2, PhoneCall, X, ShieldAlert } from 'lucide-react';

export const AiTriageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: () => void;
}> = ({ isOpen, onClose, onBookAppointment }) => {
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('2 days');
  const [severity, setSeverity] = useState('moderate');
  const [isPregnant, setIsPregnant] = useState(false);
  const [bp, setBp] = useState('118/76');
  const [spo2, setSpo2] = useState('98');
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.getAiTriage({
        symptoms,
        duration,
        severity,
        is_pregnant: isPregnant,
        vitals: { bp, spo2 }
      });
      setAssessment(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', background: '#ffffff', borderRadius: '1rem', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#0f766e', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={22} color="#5eead4" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>AI Digital Clinical Triage</h3>
              <div style={{ fontSize: '0.75rem', color: '#ccfbf1' }}>Decision Support for Rural Public Health Guidance</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Statutory Disclaimer Alert */}
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong>CLINICAL SAFETY DISCLAIMER:</strong> This module is a guidance and risk-triage tool, not a substitute for professional medical consultation. Autonomous diagnosis is prohibited by Maharashtra public health standards.
            </div>
          </div>

          {!assessment ? (
            <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  What symptoms are you experiencing?
                </label>
                <textarea
                  required
                  rows={3}
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="e.g. Persistent fever for 4 days, dizziness, mild cough, chest heaviness..."
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Duration:
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Today (< 24 hrs)">Today (&lt; 24 hours)</option>
                    <option value="2-3 days">2-3 days</option>
                    <option value="1 week or more">1 week or more</option>
                    <option value="Multiple weeks (chronic)">Multiple weeks (chronic)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Severity:
                  </label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="mild">Mild (Manageable daily work)</option>
                    <option value="moderate">Moderate (Affecting daily routine)</option>
                    <option value="severe">Severe (Intense discomfort / bedridden)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Blood Pressure (if measured):
                  </label>
                  <input
                    type="text"
                    value={bp}
                    onChange={e => setBp(e.target.value)}
                    placeholder="120/80"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Oxygen SpO2 % (optional):
                  </label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={e => setSpo2(e.target.value)}
                    placeholder="98"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: '#0f766e', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={e => setIsPregnant(e.target.checked)}
                />
                Beneficiary is currently pregnant (Maternal Health Protocol)
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                {loading ? 'Evaluating Protocol...' : 'Run Triage Evaluation'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Category Result */}
              <div style={{
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: assessment.category === 'Emergency' ? '2px solid #ef4444' : assessment.category === 'Urgent' ? '2px solid #f59e0b' : '2px solid #10b981',
                background: assessment.category === 'Emergency' ? '#fef2f2' : assessment.category === 'Urgent' ? '#fffbeb' : '#f0fdf4'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: assessment.category === 'Emergency' ? '#b91c1c' : '#0f766e' }}>
                    Triage Urgency Level
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    background: assessment.category === 'Emergency' ? '#dc2626' : assessment.category === 'Urgent' ? '#d97706' : '#059669',
                    color: '#ffffff'
                  }}>
                    {assessment.category.toUpperCase()}
                  </span>
                </div>

                <p style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>
                  {assessment.advice}
                </p>
              </div>

              {/* Nearest Emergency Facility if urgent/emergency */}
              {assessment.nearestEmergencyFacility && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                    Nearest 24x7 Public Facility:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#0f766e', fontWeight: 600 }}>
                    {assessment.nearestEmergencyFacility.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {assessment.nearestEmergencyFacility.address}
                  </div>
                </div>
              )}

              {/* Helplines */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                <a
                  href="tel:108"
                  style={{ textDecoration: 'none', background: '#dc2626', color: '#fff', padding: '0.6rem', borderRadius: '0.375rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  Dial 108 (Ambulance)
                </a>
                <a
                  href="tel:104"
                  style={{ textDecoration: 'none', background: '#0284c7', color: '#fff', padding: '0.6rem', borderRadius: '0.375rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  Dial 104 (Tele-Health)
                </a>
              </div>

              {/* Reset / Book OPD */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAssessment(null)}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Re-evaluate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBookAppointment();
                  }}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.375rem', border: 'none', background: '#0d9488', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Book OPD Slot
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
