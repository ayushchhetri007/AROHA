import React, { useState } from 'react';
import api from '../../api/client';
import { useDemo } from '../../store/demoContext';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const GrievanceModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { showToast } = useDemo();
  const [name, setName] = useState('Meera Patil');
  const [phone, setPhone] = useState('9876543210');
  const [category, setCategory] = useState('Medicine Availability');
  const [description, setDescription] = useState('');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.submitGrievance({
        citizen_name: name,
        phone,
        category,
        description,
        facility_id: 'fac-phc-shirwal'
      });
      setSubmittedCode(res.grievanceCode);
      showToast('Grievance logged with State Health Portal', 'success');
    } catch (err: any) {
      showToast('Submission error: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ background: '#0f766e', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Citizen Grievance Redressal</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {!submittedCode ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Category of Issue:
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                >
                  <option value="Medicine Availability">Medicine Unavailable / Stock-out</option>
                  <option value="Long Waiting Time">Excessive Waiting Time</option>
                  <option value="Staff Conduct">Staff Conduct / Service Quality</option>
                  <option value="Diagnostic Delay">Diagnostic / Lab Report Delay</option>
                  <option value="Referral Issue">Referral Coordination Problem</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Description:
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Please describe the grievance details..."
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={onClose} style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', background: '#0d9488', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Submit Grievance
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.3rem', color: '#0f172a' }}>Grievance Registered Successfully</h4>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                Your grievance tracking code is:
              </p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d9488', margin: '0.75rem 0' }}>
                {submittedCode}
              </div>
              <button
                onClick={onClose}
                style={{ padding: '0.6rem 1.5rem', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '0.375rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
