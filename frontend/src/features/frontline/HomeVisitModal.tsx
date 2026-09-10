import React, { useState } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import { PlusCircle, HeartPulse, Baby, CheckCircle2, X, WifiOff } from 'lucide-react';

export const HomeVisitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, patientId, onSuccess }) => {
  const { isOffline, addOfflineVisit, showToast } = useDemo();
  const [targetId, setTargetId] = useState(patientId || 'pat-meera');
  const [bp, setBp] = useState('114/76');
  const [pulse, setPulse] = useState('78');
  const [weight, setWeight] = useState('55');
  const [observations, setObservations] = useState('Home visit conducted at Shirwal-Wadi. Maternal vitals normal. IFA tablets verified.');
  const [pregnancyNotes, setPregnancyNotes] = useState('Fetal movement normal. Advised hydration and iron-rich leafy greens.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const visitPayload = {
      asha_id: 'usr-asha-1',
      patient_id: targetId,
      visit_date: new Date().toISOString().split('T')[0],
      vitals: { bp, pulse, weight: `${weight} kg` },
      observations,
      pregnancy_notes: pregnancyNotes
    };

    try {
      if (isOffline) {
        // Queue in IndexedDB/LocalStorage via DemoContext
        addOfflineVisit(visitPayload);
      } else {
        await api.recordHomeVisit(visitPayload);
        showToast('Home visit saved directly to central health database!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Error recording visit: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', background: '#ffffff', borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ background: '#059669', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PlusCircle size={20} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Record ASHA Home Visit</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isOffline && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '0.6rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <WifiOff size={14} /> Offline Mode Active: Record will be stored safely in browser storage and synced later.
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Select Beneficiary:
            </label>
            <select
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            >
              <option value="pat-meera">Meera Patil (Shirwal-Wadi, ANC 24 Wks)</option>
              <option value="pat-sunita">Sunita Pawar (Pargaon, Gestational HTN)</option>
              <option value="pat-prakash">Prakash Jadhav (Khed, Type 2 Diabetes)</option>
              <option value="pat-aarav">Baby Aarav Shinde (Shirwal, 2 Yrs)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                BP (mmHg):
              </label>
              <input
                type="text"
                value={bp}
                onChange={e => setBp(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                Pulse (bpm):
              </label>
              <input
                type="text"
                value={pulse}
                onChange={e => setPulse(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                Weight (kg):
              </label>
              <input
                type="text"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Observations & Advice:
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Maternal / Child Notes:
            </label>
            <input
              type="text"
              value={pregnancyNotes}
              onChange={e => setPregnancyNotes(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.55rem 1.3rem', borderRadius: '0.375rem', border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              {submitting ? 'Saving...' : isOffline ? 'Save Offline Record' : 'Submit Home Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
