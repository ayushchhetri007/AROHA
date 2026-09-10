import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  Stethoscope, User, Calendar, Pill, Activity, ArrowUpRight, CheckCircle2,
  Clock, AlertCircle, Plus, Send, FileText, Check
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { showToast, setCurrentView } = useDemo();

  const [queue, setQueue] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-meera');
  const [timeline, setTimeline] = useState<any>(null);
  const [activeToken, setActiveToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Consultation form state
  const [symptoms, setSymptoms] = useState('Persistent fatigue, occasional dizziness, mild pallor in conjunctiva');
  const [diagnosis, setDiagnosis] = useState('ANC 24 Weeks Gestation, Moderate Microcytic Anemia, Previous LSCS');
  const [bp, setBp] = useState('114/76');
  const [pulse, setPulse] = useState('78');
  const [spo2, setSpo2] = useState('98');
  const [weight, setWeight] = useState('55');
  const [clinicalNotes, setClinicalNotes] = useState('Uterus corresponds to 24 weeks size. Fetal heart rate regular. Scar tenderness absent. Advised high iron-protein diet. Creating referral to District Hospital Satara for Level II Anomaly Scan.');
  const [needReferral, setNeedReferral] = useState(true);
  const [receivingFacilityId, setReceivingFacilityId] = useState('fac-dh-satara');
  const [referralSpecialty, setReferralSpecialty] = useState('Obstetrics & Fetal Medicine');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueueAndPatient = async () => {
    setLoading(true);
    try {
      const qRes = await api.getQueue('fac-phc-shirwal');
      setQueue(qRes.tokens || []);
      setActiveToken(qRes.activeToken);

      const tRes = await api.getPatientTimeline(selectedPatientId);
      setTimeline(tRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueAndPatient();
  }, [selectedPatientId]);

  const handleCallNext = async () => {
    try {
      const res = await api.callNextToken('fac-phc-shirwal');
      showToast(res.message, 'success');
      fetchQueueAndPatient();
    } catch (err: any) {
      showToast('Error calling token: ' + err.message, 'error');
    }
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        appointment_id: activeToken?.appointment_id || 'apt-meera-101',
        patient_id: selectedPatientId,
        doctor_id: 'doc-1',
        facility_id: 'fac-phc-shirwal',
        symptoms,
        diagnosis,
        vitals: { bp, pulse, spo2: `${spo2}%`, weight: `${weight} kg` },
        clinical_notes: clinicalNotes,
        follow_up_date: '2026-09-20',
        prescriptions: [
          { name: 'Iron & Folic Acid (IFA)', dosage: '1 Tab', frequency: 'Twice daily after meals', days: '30 days', instructions: 'Take with lemon water, avoid tea/milk within 2 hours' },
          { name: 'Calcium & Vitamin D3', dosage: '500mg', frequency: 'Once daily after lunch', days: '30 days', instructions: 'Maintain 2 hour gap with IFA' }
        ],
        diagnostic_tests: [
          { test_name: 'Repeat Complete Blood Count (CBC)', category: 'Hematology', priority: 'routine', turnaround_time: '2 hours' }
        ]
      };

      if (needReferral) {
        payload.referral = {
          receiving_facility_id: receivingFacilityId,
          specialty_required: referralSpecialty,
          priority: 'priority',
          clinical_reason: 'High-risk 2nd trimester evaluation: previous caesarean scar + Level II anomaly ultrasound confirmation + persistent anemia.',
          summary: clinicalNotes,
          target_date: '2026-09-08'
        };
      }

      await api.createConsultation(payload);
      showToast('Consultation saved! E-Prescription and District Referral dispatched successfully.', 'success');
      fetchQueueAndPatient();
    } catch (err: any) {
      showToast('Failed to save consultation: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Doctor Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', borderLeft: '6px solid #0284c7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#0f172a' }}>
              Clinical OPD Workstation — Dr. Anand Deshmukh, MBBS, DNB
            </h2>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
              Medical Officer • PHC Shirwal
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            OPD Room 2 • General Medicine & Maternal Care • Active Tokens: <strong>{queue.length} Patients</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentView('hospital')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#f8fafc',
              color: '#0284c7',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 1.1rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Hospital Wards & Beds ➔
          </button>

          <button
            onClick={handleCallNext}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Clock size={16} /> Call Next Patient in Queue
          </button>
        </div>

      </div>

      {/* Main Clinical Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.75rem' }}>
        {/* Left Column: Today's Queue */}
        <div>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '1rem', position: 'sticky', top: '90px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.75rem' }}>
              Today's OPD Queue ({queue.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
              {queue.map(tok => {
                const isSelected = selectedPatientId === tok.patient_id;
                return (
                  <div
                    key={tok.id}
                    onClick={() => setSelectedPatientId(tok.patient_id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0fdfa' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        Token #{tok.token_number}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        background: tok.status === 'in_progress' ? '#e0f2fe' : tok.status === 'completed' ? '#f1f5f9' : '#fef3c7',
                        color: tok.status === 'in_progress' ? '#0369a1' : tok.status === 'completed' ? '#64748b' : '#b45309'
                      }}>
                        {tok.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155', marginTop: '0.25rem' }}>
                      {tok.patient_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {tok.service_name} • {tok.village}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Clinical Consultation Desk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Patient Header & Longitudinal History Drawer */}
          {timeline?.patient && (
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderLeft: '4px solid #0d9488' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#0f172a' }}>
                    Consulting: {timeline.patient.full_name} ({timeline.patient.gender}/{timeline.patient.age} yrs)
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                    {timeline.patient.abha_id && <span>ABHA ID: <strong>{timeline.patient.abha_id}</strong></span>}
                    <span>Blood Group: <strong>{timeline.patient.blood_group}</strong></span>
                    <span>Village: <strong>{timeline.patient.village}</strong></span>
                  </div>
                </div>

                {timeline.maternal && (
                  <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
                    High-Risk Pregnancy (EDD: {timeline.maternal.edd_date})
                  </span>
                )}
              </div>

              {/* Informational Digital Triage Decision-Support Notice */}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  background: '#f0fdfa',
                  border: '1px solid #ccfbf1',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  fontSize: '0.8rem'
                }}
              >
                <div>
                  <strong style={{ color: '#0f766e' }}>Recent Digital Assessment:</strong> Fever: YES • Cough: YES • Chest Pain: NO • Breathlessness: NO
                  <span style={{ marginLeft: '0.5rem', color: '#047857', fontWeight: 700 }}>[Primary Care Triage]</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Informational decision-support data</span>
              </div>
            </div>
          )}

          {/* Consultation Form */}
          <form onSubmit={handleCompleteConsultation} className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1rem' }}>
            <h4 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope size={18} color="#0d9488" /> Clinical Evaluation & E-Prescription
            </h4>

            {/* Vitals Recording Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>BP (mmHg):</label>
                <input type="text" value={bp} onChange={e => setBp(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Pulse (bpm):</label>
                <input type="text" value={pulse} onChange={e => setPulse(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>SpO2 (%):</label>
                <input type="text" value={spo2} onChange={e => setSpo2(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Weight (kg):</label>
                <input type="text" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            {/* Symptoms & Diagnosis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Chief Symptoms & History of Present Illness:</label>
                <textarea rows={2} value={symptoms} onChange={e => setSymptoms(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Clinical Diagnosis:</label>
                <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Clinical Observations & Orders:</label>
                <textarea rows={3} value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            {/* Inter-Facility Referral Section */}
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#5b21b6', cursor: 'pointer', marginBottom: '0.75rem' }}>
                <input type="checkbox" checked={needReferral} onChange={e => setNeedReferral(e.target.checked)} />
                Generate Inter-Facility Digital Referral to Higher Public Center
              </label>

              {needReferral && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#4c1d95', marginBottom: '0.25rem' }}>Receiving Facility:</label>
                    <select value={receivingFacilityId} onChange={e => setReceivingFacilityId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}>
                      <option value="fac-dh-satara">District Hospital Satara (350 Beds, OB-GYN ICU)</option>
                      <option value="fac-rh-khandala">Rural Hospital Khandala (30 Beds)</option>
                      <option value="fac-sdh-karad">Sub-District Hospital Karad (100 Beds)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#4c1d95', marginBottom: '0.25rem' }}>Specialty Required:</label>
                    <input type="text" value={referralSpecialty} onChange={e => setReferralSpecialty(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                }}
              >
                <Send size={16} />
                {submitting ? 'Dispatching Care Plan...' : 'Finalize Consultation & Dispatch Referral'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
