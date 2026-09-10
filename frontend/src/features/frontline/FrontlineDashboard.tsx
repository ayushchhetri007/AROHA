import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  Users, ShieldCheck, HeartPulse, Baby, Activity, AlertTriangle,
  PlusCircle, RefreshCw, Wifi, WifiOff, ArrowRight, Video, Calendar, CheckCircle2
} from 'lucide-react';


export const FrontlineDashboard: React.FC<{
  onOpenHomeVisit: (patientId?: string) => void;
  onOpenTeleconsult: (patientId?: string) => void;
  onOpenOfflineSync: () => void;
}> = ({ onOpenHomeVisit, onOpenTeleconsult, onOpenOfflineSync }) => {
  const { isOffline, offlineVisits, showToast } = useDemo();
  const [summary, setSummary] = useState<any>(null);
  const [roster, setRoster] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, rosRes] = await Promise.all([
        api.getCommunitySummary(),
        api.getHighRiskRoster()
      ]);
      setSummary(sumRes);
      setRoster(rosRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Frontline Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '2rem', borderLeft: '6px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#0f172a' }}>
              ASHA Community Care Portal — Asha Tai Shinde
            </h2>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
              Verified Frontline Health Worker
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            Assigned Sub-Centre: <strong>Sub-Centre Shirwal-Wadi (Under PHC Shirwal)</strong> • Khandala Taluka, Satara
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenHomeVisit()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.1rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={16} /> Record Home Visit {isOffline && '(Offline Ready)'}
          </button>

          <button
            onClick={() => onOpenTeleconsult('pat-meera')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Video size={16} /> Assisted Teleconsultation
          </button>

          <button
            onClick={onOpenOfflineSync}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: isOffline ? '#fee2e2' : '#f0fdf4',
              color: isOffline ? '#b91c1c' : '#15803d',
              border: isOffline ? '1px solid #f87171' : '1px solid #86efac',
              padding: '0.6rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {isOffline ? <WifiOff size={15} /> : <Wifi size={15} />}
            Sync Center ({offlineVisits.length} Pending)
          </button>
        </div>
      </div>

      {/* Community KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Total Beneficiaries</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{summary?.totalBeneficiaries || 48}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Across 2 assigned villages</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Pregnant Women (ANC)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>{summary?.pregnantWomen || 2}</div>
          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>2 flagged High-Risk</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Infants / Immunization</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>{summary?.infants || 1}</div>
          <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>Next DPT dose due Sept 20</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Chronic Disease Patients</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed' }}>{summary?.chronicPatients || 2}</div>
          <div style={{ fontSize: '0.75rem', color: '#6d28d9' }}>BP & Diabetes adherence</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>Pending Referrals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{summary?.pendingReferrals || 1}</div>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Meera Patil → DH Satara</div>
        </div>
      </div>

      {/* Automated Hospital Post-Discharge Follow-Up Tasks */}
      {roster?.postDischargeFollowUps?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="#16a34a" /> Hospital Post-Discharge Follow-Up Tasks
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                Automated tasks created upon patient discharge from District & Sub-District Hospitals
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
              {roster.postDischargeFollowUps.length} Pending Home Care Visits
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {roster.postDischargeFollowUps.map((dsc: any) => (
              <div key={dsc.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #16a34a', background: '#f0fdf4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                      {dsc.patient_name}
                    </h4>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {dsc.village} • {dsc.age}y / {dsc.gender}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Due: {dsc.follow_up_date || 'Sept 12'}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#166534', marginBottom: '0.6rem' }}>
                  Discharged from: <strong>{dsc.facility_name} ({dsc.department})</strong>
                </div>

                <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #bbf7d0', fontSize: '0.82rem', color: '#334155', marginBottom: '0.85rem' }}>
                  <strong>ANM Task:</strong> {dsc.follow_up_notes}
                </div>

                <button
                  onClick={() => onOpenHomeVisit(dsc.patient_id)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Conduct Post-Discharge Home Visit ➔
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High-Risk Maternal Registry */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', color: '#0f172a' }}>High-Risk Maternal & ANC Follow-Up Registry</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Active risk tracking for mothers in Shirwal-Wadi</p>
          </div>
        </div>


        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {roster?.maternalHighRisk?.map((mat: any) => (
            <div key={mat.id} className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.15rem', color: '#0f172a' }}>{mat.full_name}</h4>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                  High Risk
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Village: {mat.village} • Age: {mat.age} yrs • Blood Group: {mat.blood_group}
              </div>

              <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fde68a', fontSize: '0.85rem', color: '#92400e', marginBottom: '1rem' }}>
                <strong>Risk Factors:</strong> {mat.risk_factors}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
                <span>EDD: <strong>{mat.edd_date}</strong></span>
                <span>ANC Visits: <strong>{mat.anc_visit_count} recorded</strong></span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => onOpenHomeVisit(mat.patient_id)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: '#059669',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Log Home Visit
                </button>

                <button
                  onClick={() => onOpenTeleconsult(mat.patient_id)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#0284c7',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Teleconsult Specialist
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Child Growth & Chronic Disease Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Child Immunization */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Baby size={20} color="#0284c7" />
            <h4 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Child Immunization & Growth Tracking</h4>
          </div>

          {roster?.childRoster?.map((ch: any) => {
            const vaccines = ch.immunization_status_json ? JSON.parse(ch.immunization_status_json) : [];
            return (
              <div key={ch.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong>{ch.child_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                    Grade: {ch.nutritional_grade.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.6rem' }}>
                  Weight: {ch.current_weight} kg • Height: {ch.height} cm • Mother: {ch.mother_name}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  <strong>Vaccination Status:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.3rem' }}>
                    {vaccines.slice(0, 3).map((v: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                        <span>✓ {v.vaccine}</span>
                        <span>{v.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chronic Care */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={20} color="#7c3aed" />
            <h4 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Chronic Care Adherence Roster</h4>
          </div>

          {roster?.chronicHighRisk?.map((c: any) => (
            <div key={c.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{c.full_name} ({c.village})</strong>
                <span style={{ fontSize: '0.75rem', background: '#ede9fe', color: '#6d28d9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                  {c.risk_level.toUpperCase()} RISK
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                Condition: <strong>{c.condition_type}</strong>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#334155', marginTop: '0.4rem' }}>
                <span>BP: <strong>{c.current_bp || 'N/A'}</strong></span>
                <span>Fasting Sugar: <strong>{c.blood_sugar_fasting} mg/dL</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
