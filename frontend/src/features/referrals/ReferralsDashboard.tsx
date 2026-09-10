import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import { api } from '../../api/client';

export const ReferralsDashboard: React.FC = () => {
  const { currentUser, t, showToast, setCurrentView } = useDemo();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const data = await api.getReferrals();
      if (Array.isArray(data) && data.length > 0) {
        setReferrals(data);
      } else {
        // High-fidelity fallback referrals matching canonical Meera Patil journey
        setReferrals([
          {
            id: 'ref-meera-01',
            patient_id: 'pat-meera',
            patient_name: 'Meera Patil',
            patient_age: 28,
            patient_gender: 'Female',
            contact_number: '+91 98765 43210',
            from_facility_id: 'fac-phc-shirwal',
            from_facility_name: 'Shirwal Primary Health Centre',
            to_facility_id: 'fac-dh-satara',
            to_facility_name: 'Satara District Hospital',
            specialty_required: 'Obstetrics & High-Risk Pregnancy',
            urgency: 'EMERGENCY',
            clinical_summary: '28 weeks G2P1 with severe gestational BP 150/100 mmHg, trace proteinuria, fetal growth restriction suspected. High risk delivery.',
            transport_required: true,
            status: 'PENDING',
            created_at: new Date().toISOString()
          },
          {
            id: 'ref-prakash-02',
            patient_id: 'pat-prakash',
            patient_name: 'Prakash Jadhav',
            patient_age: 54,
            patient_gender: 'Male',
            contact_number: '+91 98220 54321',
            from_facility_id: 'fac-phc-shirwal',
            from_facility_name: 'Shirwal Primary Health Centre',
            to_facility_id: 'fac-rh-wai',
            to_facility_name: 'Wai Sub-District Hospital',
            specialty_required: 'General Medicine / Cardiology',
            urgency: 'HIGH',
            clinical_summary: 'Uncontrolled Type-2 Diabetes with neuropathy and recurrent chest tightness on exertion. Needs ECG & specialist review.',
            transport_required: false,
            status: 'ACCEPTED',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      // Ensure fallback data is set
      setReferrals([
        {
          id: 'ref-meera-01',
          patient_id: 'pat-meera',
          patient_name: 'Meera Patil',
          patient_age: 28,
          patient_gender: 'Female',
          contact_number: '+91 98765 43210',
          from_facility_id: 'fac-phc-shirwal',
          from_facility_name: 'Shirwal Primary Health Centre',
          to_facility_id: 'fac-dh-satara',
          to_facility_name: 'Satara District Hospital',
          specialty_required: 'Obstetrics & High-Risk Pregnancy',
          urgency: 'EMERGENCY',
          clinical_summary: '28 weeks G2P1 with severe gestational BP 150/100 mmHg, trace proteinuria, fetal growth restriction suspected. High risk delivery.',
          transport_required: true,
          status: 'PENDING',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedReferral) return;
    setUpdating(true);
    try {
      await api.updateReferralStatus(selectedReferral.id, status, actionNotes, currentUser.role);
      showToast(`Referral #${selectedReferral.id} updated to ${status}`, 'success');
      setReferrals(prev => prev.map(r => r.id === selectedReferral.id ? { ...r, status, action_notes: actionNotes } : r));
      setSelectedReferral((prev: any) => prev ? { ...prev, status, action_notes: actionNotes } : null);
      setActionNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update referral status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = referrals.filter(r => statusFilter === 'ALL' || r.status === statusFilter);

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {currentUser?.role === 'patient' && (
        <button
          onClick={() => setCurrentView('citizen')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            color: '#0d9488',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '1rem'
          }}
        >
          ← Back to Patient Dashboard
        </button>
      )}
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: '0.5rem'
            }}>
              INTER-FACILITY CARE CONTINUUM (ABDM ENABLED)
            </span>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Digital Referral Management (रेफरल व्यवस्थापन)
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '700px' }}>
              Connecting Sub-Centres, PHCs, Rural Hospitals, and District Hospitals. Track clinical handoffs, ensure bed/specialist availability, and prevent diagnostic duplication across Maharashtra.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchReferrals}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Stream
            </button>
          </div>
        </div>

        {/* 4-Tier Continuum Indicator */}
        <div style={{
          marginTop: '1.75rem',
          padding: '1rem',
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#0369a1', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.8rem' }}>1</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Sub-Centre / ASHA</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Early Screening & Triage</div>
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', textAlign: 'center', opacity: 0.6 }}>➔</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#0369a1', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.8rem' }}>2</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Primary Health Centre</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>General OPD & Stabilize</div>
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', textAlign: 'center', opacity: 0.6 }}>➔</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#0369a1', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.8rem' }}>3</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Rural Hospital (RH)</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Secondary Inpatient / OT</div>
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', textAlign: 'center', opacity: 0.6 }}>➔</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#0369a1', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.8rem' }}>4</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>District Hospital (DH)</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Tertiary Multi-Specialty & ICU</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: statusFilter === status ? '#0284c7' : '#f1f5f9',
              color: statusFilter === status ? 'white' : '#475569'
            }}
          >
            {status} ({status === 'ALL' ? referrals.length : referrals.filter(r => r.status === status).length})
          </button>
        ))}
      </div>

      {/* Grid: List on Left, Detail Modal / Drawer on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedReferral ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Referrals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading referral continuum...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No referrals found</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>No patient referrals matching the selected filter.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isHigh = item.urgency === 'HIGH' || item.urgency === 'EMERGENCY';
              const isSelected = selectedReferral?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedReferral(item)}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{item.patient_name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({item.patient_age}y, {item.patient_gender})</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, marginTop: '0.2rem' }}>
                        Specialty: {item.specialty_required || 'General High-Risk'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isHigh ? '#fee2e2' : '#fef3c7',
                        color: isHigh ? '#991b1b' : '#92400e'
                      }}>
                        {item.urgency} URGENCY
                      </span>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: item.status === 'ACCEPTED' ? '#dcfce7' : item.status === 'COMPLETED' ? '#e0e7ff' : '#f1f5f9',
                        color: item.status === 'ACCEPTED' ? '#166534' : item.status === 'COMPLETED' ? '#3730a3' : '#475569'
                      }}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Route */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ fontWeight: 600 }}>📍 From:</span> {item.from_facility_name}
                    <span style={{ color: '#0284c7' }}>➔</span>
                    <span style={{ fontWeight: 600 }}>🏥 To:</span> {item.to_facility_name}
                  </div>

                  <p style={{
                    fontSize: '0.825rem',
                    color: '#475569',
                    margin: '0 0 0.75rem 0',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.clinical_summary}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                    <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                    {item.transport_required && (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>🚑 108 Ambulance Requested</span>
                    )}
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>Click to review ➔</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Referral Details & Action Card */}
        {selectedReferral && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            padding: '1.75rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
            height: 'fit-content',
            position: 'sticky',
            top: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>REFERRAL RECORD #{selectedReferral.id}</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.25rem 0', color: '#0f172a' }}>
                  {selectedReferral.patient_name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Contact: {selectedReferral.contact_number || 'N/A'} • {selectedReferral.patient_age} Years • {selectedReferral.patient_gender}
                </div>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Continuum Status Flow */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>
                🔗 Unified Longitudinal Record Link
              </div>
              <div style={{ fontSize: '0.78rem', color: '#14532d', lineHeight: 1.4 }}>
                This patient's vitals, antenatal checkups, and diagnostic blood work from Shirwal PHC have been securely synchronized for the receiving team at Satara District Hospital.
              </div>
            </div>

            {/* Clinical Summary Block */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Clinical Handover Note</label>
              <div style={{
                marginTop: '0.35rem',
                background: '#f8fafc',
                padding: '0.875rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                color: '#1e293b'
              }}>
                {selectedReferral.clinical_summary}
              </div>
            </div>

            {/* Speciality & Transport Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>REQUIRED SPECIALTY</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedReferral.specialty_required}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>EMERGENCY TRANSPORT</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedReferral.transport_required ? '#dc2626' : '#166534' }}>
                  {selectedReferral.transport_required ? '🚑 108 Dispatched' : 'Self Arranged'}
                </div>
              </div>
            </div>

            {/* Receiving Facility Actions */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e293b' }}>Action & Receiving Status</h4>
              <textarea
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                placeholder="Enter bed allocation, triage assessment, or arrival notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('ACCEPTED')}
                  style={{
                    flex: 1,
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Accept & Prepare Bed
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  style={{
                    flex: 1,
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🏁 Mark Care Completed
                </button>
              </div>

              {/* Print Referral Slip */}
              <button
                onClick={() => window.print()}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Clinical Referral Handover Slip (ABDM Format)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
