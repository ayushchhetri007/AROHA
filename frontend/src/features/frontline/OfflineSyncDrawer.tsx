import React, { useState } from 'react';
import { useDemo } from '../../store/demoContext';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ArrowRight, X, Database } from 'lucide-react';

export const OfflineSyncDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { isOffline, setIsOffline, offlineVisits, syncOfflineVisits, showToast } = useDemo();
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    if (isOffline) {
      showToast('Cannot sync while in Offline Mode. Switch to Online first.', 'error');
      return;
    }
    setSyncing(true);
    await syncOfflineVisits();
    setSyncing(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 105, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'flex-end' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', height: '100%', background: '#ffffff', borderRadius: 0, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}>
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={20} color="#0d9488" />
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Offline Sync Center</h3>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
          </div>

          {/* Connection Status Switcher */}
          <div style={{ background: isOffline ? '#fef2f2' : '#f0fdf4', border: isOffline ? '1px solid #fecaca' : '1px solid #bbf7d0', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isOffline ? '#b91c1c' : '#15803d' }}>
                {isOffline ? 'Network: OFFLINE 🔴' : 'Network: CONNECTED 🟢'}
              </span>
              <button
                onClick={() => setIsOffline(!isOffline)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Toggle Mode
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
              Frontline workers in remote villages with low or absent 2G/3G connectivity can record beneficiary home visits, vitals, and ANC logs offline.
            </p>
          </div>

          {/* Queue List */}
          <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.75rem' }}>
            Pending Sync Records ({offlineVisits.length})
          </h4>

          {offlineVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.85rem' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
              <div>All local records are synchronized!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto' }}>
              {offlineVisits.map((vis, i) => (
                <div key={i} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Home Visit: {vis.patient_id}</div>
                  <div style={{ color: '#64748b', marginTop: '0.2rem' }}>{vis.observations}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Button */}
        <div>
          <button
            onClick={handleSyncNow}
            disabled={syncing || offlineVisits.length === 0}
            style={{
              width: '100%',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: offlineVisits.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: offlineVisits.length === 0 ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronizing with Central Health DB...' : `Sync All Records Now (${offlineVisits.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
