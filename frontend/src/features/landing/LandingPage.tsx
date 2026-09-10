import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  HeartPulse, Search, Calendar, Pill, ShieldAlert, ArrowRight, CheckCircle2,
  Clock, MapPin, Users, Activity, Sparkles, Building, Stethoscope, ChevronRight,
  TrendingUp, PhoneCall, Check, ExternalLink, HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC<{
  onOpenBooking: () => void;
  onOpenTriage: () => void;
  onOpenEmergency: () => void;
  onOpenTour: () => void;
}> = ({ onOpenBooking, onOpenTriage, onOpenEmergency, onOpenTour }) => {
  const { t, setCurrentView, lowLiteracyMode, playAudioPrompt } = useDemo();
  const [districtStats, setDistrictStats] = useState<any>(null);

  useEffect(() => {
    api.getDistrictAnalytics('Satara').then(data => setDistrictStats(data)).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 50%, #0d9488 100%)',
        color: '#ffffff',
        padding: '4rem 1.5rem 5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          {/* Care Continuum Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
            <span>🏥</span>
            <span>Integrated Public Healthcare Access & Care Continuum</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            {/* Left Column: Heading & Impact Statement */}
            <div>
              <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', lineHeight: 1.15, fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-0.03em', color: '#ffffff' }}>
                Healthcare Access. Closer to Every Community.
              </h1>
              <p style={{ fontSize: '1.15rem', lineHeight: 1.6, color: '#ccfbf1', marginBottom: '2rem', maxWidth: '620px' }}>
                Connecting rural citizens, frontline ASHA workers, Primary Health Centres, Rural Hospitals, and District Specialists through one unified care-coordination ecosystem.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
                <button
                  onClick={() => {
                    setCurrentView('citizen');
                    if (lowLiteracyMode) playAudioPrompt('जवळचे रुग्णालय शोधा');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#ffffff',
                    color: '#0f766e',
                    border: 'none',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <Search size={18} /> {t.findHealthcare}
                </button>

                <button
                  onClick={onOpenBooking}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '0.85rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <Calendar size={18} /> {t.bookAppointment}
                </button>

                <button
                  onClick={onOpenTriage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fef3c7',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    padding: '0.85rem 1.3rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <Activity size={18} color="#f59e0b" /> {t.triageAssistant}
                </button>
              </div>
            </div>

            {/* Right Column: Live Impact Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#99f6e4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Public Health Dashboard
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Satara District Model Network</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#10b981', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Active 🟢
                </span>
              </div>

              {/* 4 KPI Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <div style={{ color: '#a7f3d0', fontSize: '0.8rem', fontWeight: 500 }}>{t.patientsServed}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>24,680+</div>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>Across 120 rural villages</div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <div style={{ color: '#a7f3d0', fontSize: '0.8rem', fontWeight: 500 }}>{t.waitingTimeReduction}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>28 min</div>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>Down from 75+ min</div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <div style={{ color: '#a7f3d0', fontSize: '0.8rem', fontWeight: 500 }}>{t.referralCompletion}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>88%</div>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>PHC → District Hospital</div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <div style={{ color: '#a7f3d0', fontSize: '0.8rem', fontWeight: 500 }}>{t.travelSaved}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>14,200 km</div>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>Unnecessary trips avoided</div>
                </div>
              </div>

              {/* Demo Tour Button */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <button
                  onClick={onOpenTour}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={16} /> Run Complete Meera Patil Care Journey (Jury Tour)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Cards Section */}
      <section style={{ maxWidth: '1400px', margin: '-2.5rem auto 3rem', padding: '0 1.5rem', position: 'relative', zIndex: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Find Healthcare */}
          <div
            onClick={() => setCurrentView('citizen')}
            className="glass-panel"
            style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e', marginBottom: '1rem' }}>
              <Building size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{t.findHealthcare}</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Locate Sub-Centres, PHCs, Rural Hospitals, and District Hospitals with doctor availability and beds.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0d9488', fontWeight: 600, fontSize: '0.85rem' }}>
              Explore Facilities <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 2: Live Queue */}
          <div
            onClick={() => setCurrentView('queue')}
            className="glass-panel"
            style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1', marginBottom: '1rem' }}>
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{t.liveQueue}</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Check your digital OPD queue token, current patient token, and estimated wait time before arriving.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7', fontWeight: 600, fontSize: '0.85rem' }}>
              Track Queue <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 3: Medicine Checker */}
          <div
            onClick={() => setCurrentView('medicines')}
            className="glass-panel"
            style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', marginBottom: '1rem' }}>
              <Pill size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{t.medicines}</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Search for Paracetamol, IFA, Amoxicillin, Metformin and view verified stock availability in nearby facilities.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b45309', fontWeight: 600, fontSize: '0.85rem' }}>
              Check Inventory <ArrowRight size={15} />
            </div>
          </div>

          {/* Card 4: Longitudinal EHR */}
          <div
            onClick={() => setCurrentView('ehr')}
            className="glass-panel"
            style={{ padding: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6d28d9', marginBottom: '1rem' }}>
              <HeartPulse size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>{t.myRecords}</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem' }}>
              Unified chronological medical history: consultations, e-prescriptions, lab tests, referrals, and home visits.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6d28d9', fontWeight: 600, fontSize: '0.85rem' }}>
              View Care Timeline <ArrowRight size={15} />
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Connected Care Continuum Workflow */}
      <section style={{ maxWidth: '1400px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem' }}>
          <span style={{ color: '#0d9488', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Care Continuum</span>
          <h2 style={{ fontSize: '2.1rem', marginTop: '0.4rem', marginBottom: '0.8rem' }}>
            {t.howItWorksTitle}
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6 }}>
            AROHA+ strengthens existing public health infrastructure by eliminating fragmented care and enabling seamless inter-facility continuity.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {[
            { step: t.step1, desc: t.step1Desc, icon: Search, bg: '#ccfbf1', color: '#0f766e' },
            { step: t.step2, desc: t.step2Desc, icon: Calendar, bg: '#e0f2fe', color: '#0369a1' },
            { step: t.step3, desc: t.step3Desc, icon: Stethoscope, bg: '#ede9fe', color: '#6d28d9' },
            { step: t.step4, desc: t.step4Desc, icon: Pill, bg: '#fef3c7', color: '#b45309' },
            { step: t.step5, desc: t.step5Desc, icon: HeartPulse, bg: '#fce7f3', color: '#be185d' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} style={{ background: '#ffffff', padding: '1.75rem 1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Icon size={22} />
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0f172a' }}>{item.step}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.55 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Public Healthcare Facility Hierarchy */}
      <section style={{ background: '#f1f5f9', padding: '4rem 1.5rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#0f766e', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strengthening Public Systems</span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.4rem', marginBottom: '1rem' }}>
                Bridging Every Tier of Maharashtra’s Healthcare Hierarchy
              </h2>
              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Rather than creating a parallel private system, AROHA+ creates a high-fidelity digital continuum across government public health institutions:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Sub-Centres: ASHA/ANM home visits, vitals tracking, offline digital records',
                  'Primary Health Centres (PHCs): Daily doctor OPD, free diagnostics & pharmacy',
                  'Rural Hospitals: 30-50 bed secondary care, emergency care, maternal delivery',
                  'District Civil Hospitals: 300+ bed tertiary specialists, ultrasound, ICU surgery',
                  'Counter-Referrals: Follow-up tasks automatically routed back to ASHA workers'
                ].map((text, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem', color: '#334155' }}>
                    <CheckCircle2 size={18} color="#0d9488" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Care Flow Diagram */}
            <div style={{ background: '#ffffff', borderRadius: '1.25rem', padding: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', textAlign: 'center' }}>
                The Digital Bridge: Patient to Specialist & Follow-Up
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[
                  { title: 'Rural Citizen (Village)', desc: 'Meera Patil experiences fatigue at Shirwal-Wadi', badge: 'Citizen' },
                  { title: 'ASHA Worker Home Visit', desc: 'Asha Tai records vitals & schedules PHC appointment', badge: 'Frontline' },
                  { title: 'PHC Shirwal OPD', desc: 'Dr. Deshmukh reviews records & generates District Referral', badge: 'PHC Doctor' },
                  { title: 'District Hospital Satara', desc: 'Specialist OB-GYN accepts referral & schedules scan', badge: 'Specialist' },
                  { title: 'Home Follow-up Loop', desc: 'ASHA receives task to monitor maternal nutrition & vitals', badge: 'Continuity' }
                ].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{step.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{step.desc}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: '#ccfbf1', color: '#0f766e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      {step.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
