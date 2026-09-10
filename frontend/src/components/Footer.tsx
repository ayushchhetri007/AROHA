import React from 'react';
import { useDemo } from '../store/demoContext';
import { Shield, HeartPulse, PhoneCall, Building, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useDemo();

  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '3rem 1.5rem 1.5rem', marginTop: '4rem', borderTop: '1px solid #1e293b' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
        {/* Brand & Mandate */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            <HeartPulse size={22} color="#14b8a6" /> {t.appTitle}
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '1rem' }}>
            {t.tagline}
          </p>
          <div style={{ fontSize: '0.8rem', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: '0.25rem' }}>Seva Health Care Continuum</div>
            <div>Care Beyond Distance — Healthcare Without Boundaries</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>Unified Primary, Secondary & Tertiary Public Health Platform</div>
          </div>
        </div>

        {/* Public Health Network */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Integrated Care Network</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Sub-Centres & Ayushman Arogya Mandirs</li>
            <li>Primary Health Centres (PHCs)</li>
            <li>Rural Hospitals & Community Health Centres</li>
            <li>Sub-District & District Civil Hospitals</li>
            <li>ASHA & ANM Frontline Field Coordination</li>
            <li>National Health Mission (NHM) Interoperability</li>
          </ul>
        </div>

        {/* Emergency Services */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Emergency & Support Helplines</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5' }}>
              <PhoneCall size={15} /> <strong>108</strong> — Maharashtra Free Ambulance Emergency
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fed7aa' }}>
              <PhoneCall size={15} /> <strong>104</strong> — National Public Health Tele-Advice
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0' }}>
              <PhoneCall size={15} /> <strong>102</strong> — Janani Shishu Suraksha (Maternal Drop)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0' }}>
              <PhoneCall size={15} /> <strong>181</strong> — Women in Distress Helpline
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Governance & Standards</h4>
          <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '0.75rem' }}>
            Designed according to ABDM Health Data Standards, ISO/TC 215, and clinical decision support safety regulations.
          </p>
          <div style={{ fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
            {t.disclaimerText}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', borderTop: '1px solid #1e293b', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          © {new Date().getFullYear()} Seva Health Platform. All rights reserved.
        </div>
        <div>
          Production-Ready Architecture • React 18 + Node.js + SQLite/PostgreSQL
        </div>
      </div>
    </footer>
  );
};
