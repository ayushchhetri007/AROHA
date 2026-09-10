import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  ArrowLeft,
  FileText,
  Pill,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Stethoscope,
  AlertTriangle,
  Download,
  X,
  Printer,
  ChevronRight,
  User,
  Eye,
  ShieldCheck,
  HeartPulse,
  Building2,
  Share2
} from 'lucide-react';

interface LongitudinalEHRProps {
  onBack?: () => void;
}

export type TimelineEventType =
  | 'consultation'
  | 'prescription'
  | 'diagnostic'
  | 'referral'
  | 'admission'
  | 'home_visit'
  | 'assessment';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  subtitle?: string;
  facilityName?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  status?: string;
  badgeColor?: { bg: string; text: string; border?: string };
  data: any;
}

export const LongitudinalEHR: React.FC<LongitudinalEHRProps> = ({ onBack }) => {
  const { t, patientProfile, showToast, currentUser, setCurrentView } = useDemo();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');

  // Selected event for Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const activePatientId = patientProfile?.id || (currentUser?.role === 'patient' ? currentUser?.id : 'pat-meera');

  const fetchRecords = () => {
    setLoading(true);
    setError(null);

    api.getPatientTimeline(activePatientId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Failed to load patient timeline:', err);
        setError('Unable to load health records. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, [activePatientId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentView('citizen');
    }
  };

  // Build unified chronological timeline list from actual patient records
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!data) return [];
    const events: TimelineEvent[] = [];

    const {
      consultations = [],
      diagnostics = [],
      referrals = [],
      admissions = [],
      prescriptions = [],
      homeVisits = [],
      assessments = []
    } = data;

    // 1. Consultations
    consultations.forEach((c: any) => {
      events.push({
        id: `cns-${c.id}`,
        type: 'consultation',
        date: c.created_at || c.consultation_date || '2026-08-01',
        title: c.diagnosis || 'Clinical Consultation',
        subtitle: c.facility_name,
        facilityName: c.facility_name,
        doctorName: c.doctor_name,
        doctorSpecialty: c.doctor_specialty,
        status: 'Completed',
        badgeColor: { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
        data: c
      });
    });

    // 2. Prescriptions (Standalone or from consultation)
    if (prescriptions && prescriptions.length > 0) {
      prescriptions.forEach((p: any) => {
        events.push({
          id: `rx-${p.id}`,
          type: 'prescription',
          date: p.created_at || '2026-08-01',
          title: 'E-Prescription & Medication Order',
          subtitle: p.facility_name || 'Public Healthcare Facility',
          facilityName: p.facility_name,
          doctorName: p.doctor_name,
          doctorSpecialty: p.doctor_specialty,
          status: 'Active',
          badgeColor: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
          data: p
        });
      });
    }

    // 3. Diagnostics & Lab Reports
    diagnostics.forEach((d: any) => {
      const isComplete = (d.status || '').toLowerCase() === 'completed';
      events.push({
        id: `diag-${d.id}`,
        type: 'diagnostic',
        date: d.created_at || '2026-08-01',
        title: d.test_name || 'Laboratory Test',
        subtitle: d.facility_name,
        facilityName: d.facility_name,
        status: d.status ? d.status.toUpperCase() : 'ORDERED',
        badgeColor: isComplete
          ? { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
          : { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
        data: d
      });
    });

    // 4. Inter-Facility Referrals
    referrals.forEach((r: any) => {
      const isAccepted = (r.status || '').toLowerCase() === 'accepted' || (r.status || '').toLowerCase() === 'completed';
      events.push({
        id: `ref-${r.id}`,
        type: 'referral',
        date: r.created_at || '2026-08-01',
        title: `Referral to ${r.receiving_facility_name || 'Specialist Hospital'}`,
        subtitle: `From ${r.referring_facility_name || 'Primary Facility'}`,
        facilityName: r.referring_facility_name,
        doctorName: r.referring_doctor_name,
        status: (r.status || 'PENDING').toUpperCase(),
        badgeColor: isAccepted
          ? { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' }
          : { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
        data: r
      });
    });

    // 5. Inpatient Hospital Admissions
    admissions.forEach((a: any) => {
      const isDischarged = (a.status || '').toLowerCase() === 'discharged';
      events.push({
        id: `adm-${a.id}`,
        type: 'admission',
        date: a.admission_date || a.created_at || '2026-08-01',
        title: `Inpatient Care • ${a.admission_number || 'Hospital Stay'}`,
        subtitle: a.facility_name,
        facilityName: a.facility_name,
        doctorName: a.doctor_name,
        status: (a.status || 'ADMITTED').toUpperCase(),
        badgeColor: isDischarged
          ? { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }
          : { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
        data: a
      });
    });

    // 6. Community / ASHA Home Visits
    homeVisits.forEach((hv: any) => {
      events.push({
        id: `hv-${hv.id}`,
        type: 'home_visit',
        date: hv.visit_date || hv.created_at || '2026-08-01',
        title: 'Frontline Community Home Visit',
        subtitle: `Visited by ${hv.asha_name || 'ASHA Worker'}`,
        doctorName: hv.asha_name,
        status: 'VISITED',
        badgeColor: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
        data: hv
      });
    });

    // 7. Digital Health Assessments
    assessments.forEach((asm: any) => {
      events.push({
        id: `asm-${asm.id}`,
        type: 'assessment',
        date: asm.created_at || '2026-08-01',
        title: 'Digital Health Assessment & Triage',
        subtitle: asm.recommendation,
        facilityName: asm.facility_name,
        status: asm.triage_level || 'ASSESSED',
        badgeColor: asm.emergency_flag
          ? { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' }
          : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
        data: asm
      });
    });

    // Sort chronologically: Newest → Oldest
    return events.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [data]);

  // Dynamic calculation of compact summary counts from actual data
  const summaryCounts = useMemo(() => {
    const consultationsCount = (data?.consultations || []).length;
    const labReportsCount = (data?.diagnostics || []).length;
    const prescriptionsCount = (data?.prescriptions || []).length || (data?.consultations || []).filter((c: any) => c.medicines_json).length;
    const referralsCount = (data?.referrals || []).length;

    return {
      consultations: consultationsCount,
      labReports: labReportsCount,
      prescriptions: prescriptionsCount,
      referrals: referralsCount
    };
  }, [data]);

  // Filter events by selected category
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return timelineEvents;
    return timelineEvents.filter(ev => ev.type === filterType);
  }, [timelineEvents, filterType]);

  // Group events by Month and Year (e.g. "AUGUST 2026")
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: TimelineEvent[] } = {};

    filteredEvents.forEach(ev => {
      const d = new Date(ev.date);
      let groupKey = 'RECENT RECORDS';
      if (!isNaN(d.getTime())) {
        groupKey = d.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      }
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(ev);
    });

    return groups;
  }, [filteredEvents]);

  // Helper function to format readable dates
  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const patient = data?.patient;

  return (
    <div style={{ maxWidth: '1200px', margin: '1.5rem auto 3rem auto', padding: '0 1.5rem' }}>
      {/* 1. TOP-LEFT BACK BUTTON (ONLY ARROW ICON ← NO TEXT) */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          title="Back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            border: '1.5px solid #cbd5e1',
            background: '#ffffff',
            color: '#0f766e',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
            transition: 'all 0.18s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f0fdfa';
            e.currentTarget.style.borderColor = '#0d9488';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. PAGE HEADER */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem 1.75rem',
          marginBottom: '1.75rem',
          borderLeft: '6px solid #0d9488',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0d9488', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
              <Activity size={14} /> {t.longitudinalHealthRecords}
            </div>
            <h2 style={{ fontSize: '1.75rem', color: '#0f172a', margin: '0.1rem 0 0.35rem 0', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {t.patientHealthTimeline}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              {t.completeHistoryDesc}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                color: '#334155',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <Printer size={15} color="#0d9488" /> {t.printTimeline}
            </button>

            <button
              type="button"
              onClick={() => showToast('Longitudinal Health Record Summary exported as PDF', 'success')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0d9488',
                border: 'none',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.84rem',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)'
              }}
            >
              <Download size={15} /> {t.exportHealthSummary}
            </button>
          </div>
        </div>
      </div>

      {/* 3. CURRENT HEALTH SUMMARY COMPACT CARDS (DYNAMIC VALUES FROM DATABASE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Total Consultations */}
        <div
          className="glass-panel"
          onClick={() => setFilterType(filterType === 'consultation' ? 'all' : 'consultation')}
          style={{
            padding: '1.15rem 1.25rem',
            borderLeft: '4px solid #0d9488',
            cursor: 'pointer',
            background: filterType === 'consultation' ? '#f0fdfa' : '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
              {t.consultations}
            </span>
            <Stethoscope size={18} color="#0d9488" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            {summaryCounts.consultations}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
            {t.clinicalOpdEncounters}
          </div>
        </div>

        {/* Total Lab Reports */}
        <div
          className="glass-panel"
          onClick={() => setFilterType(filterType === 'diagnostic' ? 'all' : 'diagnostic')}
          style={{
            padding: '1.15rem 1.25rem',
            borderLeft: '4px solid #f59e0b',
            cursor: 'pointer',
            background: filterType === 'diagnostic' ? '#fffbeb' : '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
              {t.labReports}
            </span>
            <Activity size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            {summaryCounts.labReports}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
            {t.diagnosticInvestigations}
          </div>
        </div>

        {/* Active Prescriptions */}
        <div
          className="glass-panel"
          onClick={() => setFilterType(filterType === 'prescription' ? 'all' : 'prescription')}
          style={{
            padding: '1.15rem 1.25rem',
            borderLeft: '4px solid #7c3aed',
            cursor: 'pointer',
            background: filterType === 'prescription' ? '#f5f3ff' : '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase' }}>
              {t.activePrescriptions}
            </span>
            <Pill size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            {summaryCounts.prescriptions}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
            {t.ongoingDispensedMedications}
          </div>
        </div>

        {/* Active Referrals */}
        <div
          className="glass-panel"
          onClick={() => setFilterType(filterType === 'referral' ? 'all' : 'referral')}
          style={{
            padding: '1.15rem 1.25rem',
            borderLeft: '4px solid #0284c7',
            cursor: 'pointer',
            background: filterType === 'referral' ? '#f0f9ff' : '#ffffff',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              {t.referrals}
            </span>
            <ArrowUpRight size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            {summaryCounts.referrals}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
            {t.interFacilityTransfers}
          </div>
        </div>
      </div>

      {/* 4. FILTERS CONTROLS */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t.filterRecords}
        </span>
        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
          {[
            { id: 'all', label: `${t.allHistory} (${timelineEvents.length})` },
            { id: 'consultation', label: `${t.consultations} (${summaryCounts.consultations})` },
            { id: 'prescription', label: `${t.prescriptionsTab} (${summaryCounts.prescriptions})` },
            { id: 'diagnostic', label: `${t.labDiagnostics} (${summaryCounts.labReports})` },
            { id: 'referral', label: `${t.referrals} (${summaryCounts.referrals})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: filterType === tab.id ? 700 : 600,
                border: filterType === tab.id ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                background: filterType === tab.id ? '#0d9488' : '#ffffff',
                color: filterType === tab.id ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. CONTENT AREA: LOADING / ERROR / EMPTY / CHRONOLOGICAL TIMELINE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid #ccfbf1', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div style={{ color: '#0f766e', fontWeight: 700, marginTop: '1rem', fontSize: '0.95rem' }}>
            {t.loadingRecords}
          </div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #fee2e2' }}>
          <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ color: '#0f172a', margin: '0 0 0.5rem 0' }}>{error}</h4>
          <button
            type="button"
            onClick={fetchRecords}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        /* 6. CLEAN EMPTY STATE */
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px dashed #cbd5e1'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f0fdfa',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <FileText size={30} />
          </div>
          <h4 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: 800 }}>
            {t.noRecordsFound}
          </h4>
          <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '520px', margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
            Your consultations, prescriptions, tests and referrals will appear here as you use Seva Health.
          </p>
          {filterType !== 'all' && (
            <button
              type="button"
              onClick={() => {
                setFilterType('all');
              }}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                background: '#f0fdfa',
                border: '1px solid #14b8a6',
                color: '#0f766e',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* 7. CHRONOLOGICAL GROUPED TIMELINE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {Object.entries(groupedEvents).map(([monthYear, eventsInMonth]) => (
            <div key={monthYear}>
              {/* Month / Year Section Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                >
                  {monthYear}
                </div>
                <div style={{ flex: 1, height: '1.5px', background: '#e2e8f0' }}></div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  {eventsInMonth.length} {eventsInMonth.length === 1 ? 'event' : 'events'}
                </div>
              </div>

              {/* Timeline Items Track */}
              <div
                style={{
                  position: 'relative',
                  borderLeft: '2px solid #cbd5e1',
                  marginLeft: '1.25rem',
                  paddingLeft: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}
              >
                {eventsInMonth.map((ev) => {
                  let icon = <FileText size={18} />;
                  let nodeColor = '#0d9488';

                  if (ev.type === 'consultation') {
                    icon = <Stethoscope size={18} />;
                    nodeColor = '#0d9488';
                  } else if (ev.type === 'prescription') {
                    icon = <Pill size={18} />;
                    nodeColor = '#7c3aed';
                  } else if (ev.type === 'diagnostic') {
                    icon = <Activity size={18} />;
                    nodeColor = '#f59e0b';
                  } else if (ev.type === 'referral') {
                    icon = <ArrowUpRight size={18} />;
                    nodeColor = '#0284c7';
                  } else if (ev.type === 'admission') {
                    icon = <Building2 size={18} />;
                    nodeColor = '#0369a1';
                  } else if (ev.type === 'home_visit') {
                    icon = <HeartPulse size={18} />;
                    nodeColor = '#059669';
                  } else if (ev.type === 'assessment') {
                    icon = <CheckCircle2 size={18} />;
                    nodeColor = '#e11d48';
                  }

                  return (
                    <div key={ev.id} style={{ position: 'relative' }}>
                      {/* Timeline Node Dot */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-2.72rem',
                          top: '1.15rem',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: nodeColor,
                          border: '3px solid #ffffff',
                          boxShadow: `0 0 0 2px ${nodeColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          zIndex: 2
                        }}
                      ></div>

                      {/* Timeline Card */}
                      <div
                        className="glass-panel"
                        style={{
                          padding: '1.35rem 1.5rem',
                          borderLeft: `4px solid ${nodeColor}`,
                          transition: 'all 0.18s ease'
                        }}
                      >
                        {/* Event Header: Date & Status Badge */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '0.4rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: nodeColor,
                                background: ev.badgeColor?.bg || '#f8fafc',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '9999px',
                                border: `1px solid ${ev.badgeColor?.border || '#e2e8f0'}`
                              }}
                            >
                              {icon} {ev.type.replace('_', ' ')}
                            </span>

                            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={13} /> {formatEventDate(ev.date)}
                            </span>
                          </div>

                          {ev.status && (
                            <span
                              style={{
                                background: ev.badgeColor?.bg || '#f1f5f9',
                                color: ev.badgeColor?.text || '#334155',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                border: `1px solid ${ev.badgeColor?.border || '#cbd5e1'}`
                              }}
                            >
                              {ev.status}
                            </span>
                          )}
                        </div>

                        {/* Event Title */}
                        <h4 style={{ fontSize: '1.18rem', color: '#0f172a', margin: '0.2rem 0 0.35rem 0', fontWeight: 800 }}>
                          {ev.title}
                        </h4>

                        {/* Facility & Doctor info */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.84rem', color: '#475569', marginBottom: '0.75rem' }}>
                          {ev.facilityName && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <MapPin size={14} color="#0d9488" /> {ev.facilityName}
                            </span>
                          )}
                          {ev.doctorName && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <User size={14} color="#475569" /> Doctor: <strong>{ev.doctorName}</strong>
                              {ev.doctorSpecialty ? ` (${ev.doctorSpecialty})` : ''}
                            </span>
                          )}
                        </div>

                        {/* Event-Specific Clinical Previews */}
                        {/* A. Consultation Vitals & Notes */}
                        {ev.type === 'consultation' && (
                          <div>
                            {ev.data?.vitals_json && (() => {
                              try {
                                const vitals = JSON.parse(ev.data.vitals_json);
                                return (
                                  <div style={{ display: 'flex', gap: '0.75rem', background: '#f0fdfa', padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', color: '#0f766e', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                                    {vitals.bp && <span>BP: <strong>{vitals.bp}</strong></span>}
                                    {vitals.pulse && <span>Pulse: <strong>{vitals.pulse}</strong></span>}
                                    {vitals.spo2 && <span>SpO2: <strong>{vitals.spo2}</strong></span>}
                                    {vitals.weight && <span>Weight: <strong>{vitals.weight}</strong></span>}
                                  </div>
                                );
                              } catch {
                                return null;
                              }
                            })()}

                            {ev.data?.clinical_notes && (
                              <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, margin: '0 0 0.65rem 0' }}>
                                <strong>Clinical Notes:</strong> {ev.data.clinical_notes}
                              </p>
                            )}

                            {/* Prescriptions preview inside consultation */}
                            {ev.data?.medicines_json && (() => {
                              try {
                                const meds = JSON.parse(ev.data.medicines_json);
                                if (Array.isArray(meds) && meds.length > 0) {
                                  return (
                                    <div style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Pill size={14} /> Prescribed Medicines:
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {meds.map((m: any, idx: number) => (
                                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>• {m.name} ({m.dosage})</span>
                                            <span style={{ color: '#64748b' }}>{m.frequency} • {m.days}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                              } catch {}
                              return null;
                            })()}
                          </div>
                        )}

                        {/* B. Standalone Prescription details */}
                        {ev.type === 'prescription' && (
                          <div>
                            {ev.data?.medicines_json && (() => {
                              try {
                                const meds = JSON.parse(ev.data.medicines_json);
                                if (Array.isArray(meds) && meds.length > 0) {
                                  return (
                                    <div style={{ background: '#f5f3ff', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #ddd6fe', marginBottom: '0.75rem' }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Pill size={15} /> Active Prescribed Medicines:
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                        {meds.map((m: any, idx: number) => (
                                          <div key={idx} style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ede9fe', fontSize: '0.82rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1e293b' }}>
                                              <span>{m.name}</span>
                                              <span style={{ color: '#7c3aed' }}>{m.dosage}</span>
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '0.15rem' }}>
                                              Frequency: {m.frequency} | Duration: {m.days}
                                              {m.instructions && <div>Instructions: {m.instructions}</div>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                              } catch {}
                              return null;
                            })()}
                          </div>
                        )}

                        {/* C. Diagnostic Lab Test Findings */}
                        {ev.type === 'diagnostic' && ev.data?.result_summary && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem', color: '#1e293b', marginBottom: '0.75rem' }}>
                            <strong>Report Findings:</strong> {ev.data.result_summary}
                            {ev.data.turnaround_time && (
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>
                                Turnaround: {ev.data.turnaround_time} • Category: {ev.data.category}
                              </div>
                            )}
                          </div>
                        )}

                        {/* D. Referral details */}
                        {ev.type === 'referral' && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem', marginBottom: '0.75rem' }}>
                            <div style={{ color: '#334155', marginBottom: '0.35rem' }}>
                              <strong>Clinical Reason:</strong> {ev.data.clinical_reason}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#0f766e', fontWeight: 600 }}>
                              Outcome Status: {ev.data.outcome_notes || 'Accepted by secondary facility specialist.'}
                            </div>
                          </div>
                        )}

                        {/* E. Hospital Admission stay */}
                        {ev.type === 'admission' && (
                          <div style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem', marginBottom: '0.75rem' }}>
                            <div style={{ color: '#334155', marginBottom: '0.3rem' }}>
                              <strong>Ward & Bed:</strong> {ev.data.ward_name || 'General Ward'} (Bed {ev.data.bed_number || '01'}) • Department: {ev.data.department || 'General Medicine'}
                            </div>
                            {ev.data.provisional_diagnosis && (
                              <div style={{ color: '#334155', marginBottom: '0.3rem' }}>
                                <strong>Diagnosis:</strong> {ev.data.provisional_diagnosis}
                              </div>
                            )}
                            {ev.data.discharge_condition && (
                              <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                                Discharge Condition: {ev.data.discharge_condition}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Action: View Details */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedEvent(ev)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#0f766e',
                              padding: '0.45rem 0.85rem',
                              borderRadius: '6px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#f0fdfa';
                              e.currentTarget.style.borderColor = '#0d9488';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                          >
                            <Eye size={14} /> View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 8. RECORD DETAILS MODAL */}
      {selectedEvent && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '650px',
              maxHeight: '88vh',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #093430 0%, #0d9488 100%)',
                color: '#ffffff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#99f6e4', letterSpacing: '0.05em' }}>
                  {selectedEvent.type.replace('_', ' ')} Record Details
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '0.35rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, fontSize: '0.88rem', color: '#334155' }}>
              {/* Event Metadata Banner */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date & Time</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                      {formatEventDate(selectedEvent.date)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Facility</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                      {selectedEvent.facilityName || 'Public Healthcare Facility'}
                    </div>
                  </div>

                  {selectedEvent.doctorName && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Clinician / Medical Officer</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                        {selectedEvent.doctorName} {selectedEvent.doctorSpecialty ? `(${selectedEvent.doctorSpecialty})` : ''}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status</div>
                    <div style={{ fontWeight: 700, color: '#0f766e', marginTop: '0.15rem' }}>
                      {selectedEvent.status || 'Verified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultation specifics */}
              {selectedEvent.type === 'consultation' && (
                <div>
                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Consultation & Clinical Assessment
                  </h5>
                  <p style={{ margin: '0 0 1rem 0', lineHeight: 1.6 }}>
                    <strong>Diagnosis:</strong> {selectedEvent.data?.diagnosis}
                  </p>
                  {selectedEvent.data?.clinical_notes && (
                    <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      <strong>Physician Clinical Notes:</strong>
                      <div style={{ marginTop: '0.25rem' }}>{selectedEvent.data?.clinical_notes}</div>
                    </div>
                  )}

                  {selectedEvent.data?.medicines_json && (() => {
                    try {
                      const meds = JSON.parse(selectedEvent.data.medicines_json);
                      return (
                        <div>
                          <strong>Prescribed Medications:</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {meds.map((m: any, idx: number) => (
                              <div key={idx} style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 700, color: '#0f766e' }}>{m.name} ({m.dosage})</div>
                                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>
                                  Frequency: {m.frequency} • Duration: {m.days}
                                  {m.instructions && <div>Instructions: {m.instructions}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              )}

              {/* Prescription specifics */}
              {selectedEvent.type === 'prescription' && (
                <div>
                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f766e', marginBottom: '0.5rem' }}>
                    Medication Order Details
                  </h5>
                  {selectedEvent.data?.instructions && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>General Instructions:</strong> {selectedEvent.data.instructions}
                    </div>
                  )}
                  {selectedEvent.data?.medicines_json && (() => {
                    try {
                      const meds = JSON.parse(selectedEvent.data.medicines_json);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {meds.map((m: any, idx: number) => (
                            <div key={idx} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                                Dosage: <strong>{m.dosage}</strong> • Schedule: <strong>{m.frequency}</strong> • Duration: <strong>{m.days}</strong>
                              </div>
                              {m.instructions && (
                                <div style={{ fontSize: '0.8rem', color: '#0f766e', marginTop: '0.2rem' }}>
                                  Note: {m.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              )}

              {/* Diagnostic specifics */}
              {selectedEvent.type === 'diagnostic' && (
                <div>
                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Diagnostic Laboratory Findings
                  </h5>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                    <div><strong>Test Name:</strong> {selectedEvent.data?.test_name}</div>
                    <div><strong>Category:</strong> {selectedEvent.data?.category}</div>
                    <div><strong>Status:</strong> {selectedEvent.data?.status}</div>
                    <div><strong>Turnaround:</strong> {selectedEvent.data?.turnaround_time}</div>
                  </div>
                  {selectedEvent.data?.result_summary && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
                      <strong style={{ color: '#166534' }}>Report Summary:</strong>
                      <div style={{ color: '#14532d', marginTop: '0.35rem', lineHeight: 1.5 }}>
                        {selectedEvent.data?.result_summary}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Referral specifics */}
              {selectedEvent.type === 'referral' && (
                <div>
                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Inter-Facility Referral Pathway
                  </h5>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                    <div><strong>Referral Code:</strong> {selectedEvent.data?.referral_code}</div>
                    <div><strong>Referring Facility:</strong> {selectedEvent.data?.referring_facility_name}</div>
                    <div><strong>Receiving Facility:</strong> {selectedEvent.data?.receiving_facility_name}</div>
                    <div><strong>Priority Level:</strong> {selectedEvent.data?.priority || 'Priority'}</div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong>Clinical Reason for Transfer:</strong>
                    <div style={{ marginTop: '0.25rem' }}>{selectedEvent.data?.clinical_reason}</div>
                  </div>
                  {selectedEvent.data?.outcome_notes && (
                    <div style={{ background: '#ede9fe', border: '1px solid #ddd6fe', padding: '0.75rem', borderRadius: '8px', color: '#5b21b6' }}>
                      <strong>Outcome Notes:</strong> {selectedEvent.data?.outcome_notes}
                    </div>
                  )}
                </div>
              )}

              {/* Admission specifics */}
              {selectedEvent.type === 'admission' && (
                <div>
                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Inpatient Hospital Stay Details
                  </h5>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                    <div><strong>Admission Code:</strong> {selectedEvent.data?.admission_number}</div>
                    <div><strong>Department:</strong> {selectedEvent.data?.department}</div>
                    <div><strong>Ward & Bed:</strong> {selectedEvent.data?.ward_name} (Bed {selectedEvent.data?.bed_number})</div>
                    <div><strong>Admitted On:</strong> {selectedEvent.data?.admission_date}</div>
                    {selectedEvent.data?.discharge_date && <div><strong>Discharged On:</strong> {selectedEvent.data?.discharge_date}</div>}
                  </div>
                  {selectedEvent.data?.treatment_summary && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Treatment Summary:</strong>
                      <div style={{ marginTop: '0.25rem' }}>{selectedEvent.data?.treatment_summary}</div>
                    </div>
                  )}
                  {selectedEvent.data?.discharge_condition && (
                    <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534' }}>
                      <strong>Discharge Condition:</strong> {selectedEvent.data?.discharge_condition}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                padding: '0.85rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Print Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
