import React, { useState } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, User, Stethoscope, Share2, FileText, CheckCircle2, X } from 'lucide-react';

export const AssistedTeleconsultModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
}> = ({ isOpen, onClose, patientId }) => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [connected, setConnected] = useState(true);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', background: '#0f172a', color: '#f8fafc', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>
        {/* Header */}
        <div style={{ background: '#1e293b', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Assisted Telemedicine Session • District Hospital Satara Specialist
              </h4>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Connecting Meera Patil via ASHA Worker Asha Tai Shinde</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Video Simulation Canvas */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', minHeight: '340px' }}>
            {/* Specialist Stream */}
            <div style={{ background: '#1e293b', borderRadius: '0.75rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0f766e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem', fontWeight: 800 }}>
                  Dr
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Dr. Rajiv Joshi, MD (OB-GYN)</div>
                <div style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Specialist Obstetrician • DH Satara</div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '9999px', display: 'inline-block' }}>
                  Live WebRTC Teleconsultation Stream 🟢
                </div>
              </div>

              {/* Patient PiP */}
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', width: '130px', height: '90px', background: '#0284c7', borderRadius: '0.5rem', border: '2px solid #38bdf8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                <User size={24} />
                <span style={{ marginTop: '0.2rem' }}>Meera Patil</span>
              </div>
            </div>

            {/* Shared Vitals & Clinical Brief */}
            <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div>
                <h5 style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '0.75rem' }}>Shared Longitudinal Data</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#cbd5e1' }}>
                  <div>Gestational Age: <strong>24 Wks 3 Days</strong></div>
                  <div>Current BP: <strong>114/76 mmHg</strong></div>
                  <div>Hemoglobin: <strong>9.2 g/dL (Mild Anemia)</strong></div>
                  <div>Prev Delivery: <strong>LSCS (2022)</strong></div>
                  <div>Referral Code: <strong>MH-REF-2026-7841</strong></div>
                </div>
              </div>

              <div style={{ background: 'rgba(13, 148, 136, 0.15)', border: '1px solid #0d9488', padding: '0.75rem', borderRadius: '0.5rem', color: '#5eead4', fontSize: '0.8rem' }}>
                ✓ ASHA worker assisting in Marathi translation for patient.
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setMicOn(!micOn)}
              style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: micOn ? '#334155' : '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              onClick={() => setCameraOn(!cameraOn)}
              style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: cameraOn ? '#334155' : '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            <button
              onClick={onClose}
              style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="End Teleconsultation"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
