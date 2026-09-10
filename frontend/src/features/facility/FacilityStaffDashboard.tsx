import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  Building2, Clock, Pill, Activity, CheckCircle2, AlertTriangle,
  RefreshCw, ChevronRight, Check
} from 'lucide-react';

export const FacilityStaffDashboard: React.FC = () => {
  const { showToast } = useDemo();
  const [activeTab, setActiveTab] = useState<'queue' | 'pharmacy' | 'lab'>('queue');
  const [queue, setQueue] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qRes = await api.getQueue('fac-phc-shirwal', 'all');
      setQueue(qRes.tokens || []);

      const mRes = await api.searchMedicines('', 'Satara');
      setMedicines(mRes.filter((m: any) => m.facility_id === 'fac-phc-shirwal'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStock = async (id: string, current: number) => {
    const newQty = prompt('Enter updated stock quantity:', String(current));
    if (newQty !== null && !isNaN(Number(newQty))) {
      try {
        await api.updateMedicineStock(id, Number(newQty));
        showToast('Stock updated successfully', 'success');
        fetchData();
      } catch (err: any) {
        showToast('Update failed: ' + err.message, 'error');
      }
    }
  };

  const handleUpdateToken = async (id: string, status: string) => {
    try {
      await api.updateTokenStatus(id, status);
      showToast(`Token status updated to ${status}`, 'success');
      fetchData();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', borderLeft: '6px solid #d97706', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a' }}>
            Facility Operations & Queue Management Desk
          </h2>
          <div style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.25rem' }}>
            Primary Health Centre Shirwal • Pharmacy & Diagnostic Coordination Desk
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('queue')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: activeTab === 'queue' ? '#fff' : 'transparent',
              fontWeight: activeTab === 'queue' ? 700 : 500,
              color: activeTab === 'queue' ? '#0f766e' : '#64748b',
              cursor: 'pointer'
            }}
          >
            Queue Manager
          </button>

          <button
            onClick={() => setActiveTab('pharmacy')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: activeTab === 'pharmacy' ? '#fff' : 'transparent',
              fontWeight: activeTab === 'pharmacy' ? 700 : 500,
              color: activeTab === 'pharmacy' ? '#0f766e' : '#64748b',
              cursor: 'pointer'
            }}
          >
            Pharmacy Stock ({medicines.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Queue Manager */}
      {activeTab === 'queue' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '1rem' }}>
            Live Token Counter & Patient Calling
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Token #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Service / Priority</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(tok => (
                <tr key={tok.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>
                    #{tok.token_number}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {tok.patient_name} ({tok.village})
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {tok.service_name}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: tok.status === 'in_progress' ? '#e0f2fe' : tok.status === 'completed' ? '#f1f5f9' : tok.status === 'booked' ? '#f3e8ff' : '#fef3c7',
                      color: tok.status === 'in_progress' ? '#0369a1' : tok.status === 'completed' ? '#64748b' : tok.status === 'booked' ? '#6d28d9' : '#b45309'
                    }}>
                      {tok.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {tok.status === 'booked' ? (
                        <button
                          onClick={() => handleUpdateToken(tok.id, 'waiting')}
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #7c3aed', background: '#f3e8ff', color: '#6d28d9', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Check In
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpdateToken(tok.id, 'in_progress')}
                            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Call
                          </button>
                          <button
                            onClick={() => handleUpdateToken(tok.id, 'completed')}
                            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #16a34a', background: '#dcfce7', color: '#15803d', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Complete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Pharmacy Stock */}
      {activeTab === 'pharmacy' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a' }}>
              PHC Shirwal Pharmacy Inventory
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Click on Stock count to update inventory
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Medicine Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Current Stock</th>
                <th style={{ padding: '0.75rem 1rem' }}>Reorder Level</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    {m.name}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {m.category}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => handleUpdateStock(m.id, m.stock_quantity)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Click to edit stock"
                    >
                      {m.stock_quantity.toLocaleString()} {m.unit} ✏️
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {m.reorder_level} {m.unit}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: m.status === 'in_stock' ? '#dcfce7' : m.status === 'low_stock' ? '#fef3c7' : '#fee2e2',
                      color: m.status === 'in_stock' ? '#15803d' : m.status === 'low_stock' ? '#b45309' : '#b91c1c'
                    }}>
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
