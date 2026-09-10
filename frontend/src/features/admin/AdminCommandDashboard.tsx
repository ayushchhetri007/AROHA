import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  BarChart3, TrendingUp, Users, Clock, Pill, MapPin, Building,
  ShieldCheck, ArrowUpRight, Award, CheckCircle2, Building2, Bed
} from 'lucide-react';

export const AdminCommandDashboard: React.FC = () => {
  const { setCurrentView } = useDemo();
  const [districtData, setDistrictData] = useState<any>(null);
  const [stateData, setStateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDistrictAnalytics('Satara'),
      api.getStateAnalytics()
    ]).then(([dist, st]) => {
      setDistrictData(dist);
      setStateData(st);
    }).catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading administrative command center...</div>;
  }

  const { kpis, facilityHierarchy, waitingTimeTrends } = districtData || {};
  const { stateSummary, districtPerformance } = stateData || {};

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '2rem', borderLeft: '6px solid #6366f1', background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Seva Health • Public Health Intelligence & Surveillance
            </span>
            <h2 style={{ fontSize: '1.75rem', color: '#0f172a', margin: '0.25rem 0' }}>
              State & District Public Health Command Center
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Real-time service accessibility, hospital occupancy, referral completion rates, and resource availability monitoring
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentView('hospital')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              <Building2 size={16} /> Hospital Management Suite ➔
            </button>
            <div style={{ background: '#ede9fe', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#4c1d95', fontSize: '0.85rem', fontWeight: 700 }}>
              Satara Pilot
            </div>
          </div>
        </div>
      </div>


      {/* Top 5 State KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Citizens Benefited</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {stateSummary?.totalCitizensRegistered?.toLocaleString() || '101,280'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Across 5 target districts</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Travel Distance Saved</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>
            {kpis?.estimatedTravelSavedKm?.toLocaleString() || '14,200'} km
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>By checking inventory & tokens</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Referral Completion Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>
            {kpis?.referralCompletionRate || 88}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669' }}>Target: &gt; 80% Achieved ✓</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Average Waiting Time</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', margin: '0.25rem 0' }}>
            {kpis?.averageWaitingTimeMinutes || 28} min
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>Reduced from 75+ min</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Medicine Availability</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7c3aed', margin: '0.25rem 0' }}>
            {kpis?.medicineAvailabilityRate || 92}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6d28d9' }}>EDL Stock Across PHCs</div>
        </div>
      </div>

      {/* District Comparison Scorecard */}
      <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem' }}>
          District Healthcare Performance Scorecard — Maharashtra
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.75rem 1rem' }}>District</th>
                <th style={{ padding: '0.75rem 1rem' }}>Active Facilities</th>
                <th style={{ padding: '0.75rem 1rem' }}>Citizens Served</th>
                <th style={{ padding: '0.75rem 1rem' }}>Avg Wait Time</th>
                <th style={{ padding: '0.75rem 1rem' }}>Referral Completion</th>
                <th style={{ padding: '0.75rem 1rem' }}>Medicine In-Stock</th>
              </tr>
            </thead>
            <tbody>
              {districtPerformance?.map((d: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                    {d.district}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {d.facilities} Facilities
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                    {d.citizensServed.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#0f766e', fontWeight: 700 }}>
                    {d.waitTime} min
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
                      {d.referralComp}%
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#1e293b' }}>
                    {d.medAvail}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waiting Time Trends Visualization */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h4 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem' }}>
            Monthly Waiting Time Trend (Minutes)
          </h4>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', paddingTop: '2rem' }}>
            {waitingTimeTrends?.map((item: any, idx: number) => {
              const height = (item.waitMins / 50) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', marginBottom: '0.25rem' }}>
                    {item.waitMins}m
                  </span>
                  <div style={{ width: '100%', height: `${height}%`, background: 'linear-gradient(to top, #0d9488, #2dd4bf)', borderRadius: '4px 4px 0 0' }}></div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h4 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '1rem' }}>
            Referral Completion Rate Progression (%)
          </h4>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '180px', paddingTop: '2rem' }}>
            {waitingTimeTrends?.map((item: any, idx: number) => {
              const height = (item.referralsCompleted / 100) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9', marginBottom: '0.25rem' }}>
                    {item.referralsCompleted}%
                  </span>
                  <div style={{ width: '100%', height: `${height}%`, background: 'linear-gradient(to top, #7c3aed, #a78bfa)', borderRadius: '4px 4px 0 0' }}></div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
