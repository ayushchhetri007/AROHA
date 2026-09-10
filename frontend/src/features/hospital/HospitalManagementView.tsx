import React, { useState, useEffect } from 'react';
import { useDemo } from '../../store/demoContext';
import api from '../../api/client';
import {
  Building2, Bed, Users, Calendar, Activity, CheckCircle2, AlertTriangle,
  Clock, ArrowUpRight, PlusCircle, RefreshCw, FileText, Pill, Stethoscope,
  Filter, Search, UserCheck, ShieldAlert, Sparkles, ChevronRight, Check,
  Layers, ArrowRight, Share2, AlertCircle, Eye, Download, Phone, MapPin
} from 'lucide-react';

type HospitalTab =
  | 'overview'
  | 'beds'
  | 'admissions'
  | 'referrals'
  | 'staff'
  | 'inventory'
  | 'diagnostics'
  | 'queue'
  | 'discharge'
  | 'network'
  | 'fhir';

export const HospitalManagementView: React.FC = () => {
  const { currentUser, activeFacilityId, setActiveFacilityId, showToast } = useDemo();
  const [currentTab, setCurrentTab] = useState<HospitalTab>('overview');
  const [facilityData, setFacilityData] = useState<any>(null);
  const [wardsAndBeds, setWardsAndBeds] = useState<{ wards: any[]; beds: any[] }>({ wards: [], beds: [] });
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [facilityNetwork, setFacilityNetwork] = useState<any>(null);
  const [fhirData, setFhirData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selected bed modal state
  const [selectedBed, setSelectedBed] = useState<any | null>(null);
  const [bedStatusToUpdate, setBedStatusToUpdate] = useState<string>('Available');
  const [bedNotes, setBedNotes] = useState<string>('');

  // Selected equipment modal state
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [equipQtyToUpdate, setEquipQtyToUpdate] = useState<string>('');
  const [equipAvailableToUpdate, setEquipAvailableToUpdate] = useState<boolean>(true);

  // New Admission modal state
  const [isNewAdmissionOpen, setIsNewAdmissionOpen] = useState(false);
  const [admPatientId, setAdmPatientId] = useState('pat-meera');
  const [admDepartment, setAdmDepartment] = useState('Obstetrics & Gynecology');
  const [admPriority, setAdmPriority] = useState('Maternal');
  const [admWardId, setAdmWardId] = useState('');
  const [admBedId, setAdmBedId] = useState('');
  const [admDiagnosis, setAdmDiagnosis] = useState('24 Weeks High Risk Gestation, Severe Anemia');
  const [admReason, setAdmReason] = useState('Admitted for intravenous iron therapy and fetal Doppler surveillance');

  // Discharge modal state
  const [selectedAdmissionForDischarge, setSelectedAdmissionForDischarge] = useState<any | null>(null);
  const [dscCondition, setDscCondition] = useState('Clinically stable, vital signs within normal parameters');
  const [dscSummary, setDscSummary] = useState('IV protocol completed. Patient advised rest and oral supplement compliance.');
  const [dscFollowUpDate, setDscFollowUpDate] = useState('2026-09-18');
  const [dscFollowUpNotes, setDscFollowUpNotes] = useState('ANM Asha Shinde: Check blood pressure twice weekly, monitor hemoglobin and fetal movement.');
  const [dscMedicines, setDscMedicines] = useState([
    { name: 'Iron & Folic Acid (IFA)', dosage: '1 Tab', frequency: 'Twice daily after meals', days: '30 days' },
    { name: 'Calcium Carbonate 500mg', dosage: '1 Tab', frequency: 'Once daily after lunch', days: '30 days' }
  ]);

  // Inventory filter
  const [invFilter, setInvFilter] = useState<'ALL' | 'low_stock' | 'out_of_stock' | 'in_stock'>('ALL');

  // Load facility data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, bedsRes, admRes, refRes, staffRes, medRes, qRes, netRes, facilityRes] = await Promise.all([
        api.getHospitalOverview(activeFacilityId),
        api.getWardsAndBeds(activeFacilityId),
        api.getAdmissions(activeFacilityId),
        api.getReferrals({ facility_id: activeFacilityId }),
        api.getHospitalStaff(activeFacilityId),
        api.searchMedicines('', 'Satara'),
        api.getQueue(activeFacilityId === 'fac-dh-satara' ? 'fac-phc-shirwal' : activeFacilityId),
        api.getFacilityNetwork(),
        api.getFacilityById(activeFacilityId)
      ]);

      setFacilityData(overviewRes);
      setWardsAndBeds(bedsRes);
      setAdmissions(admRes || []);
      setReferrals(refRes || []);
      setStaff(staffRes || []);
      setInventory(medRes.filter((m: any) => m.facility_id === activeFacilityId || activeFacilityId === 'fac-dh-satara'));
      setEquipment(facilityRes?.equipment || []);
      setQueue(qRes?.tokens || []);
      setFacilityNetwork(netRes);

      // Default ward and bed IDs if empty
      if (bedsRes?.wards?.length > 0 && !admWardId) {
        setAdmWardId(bedsRes.wards[0].id);
      }
    } catch (err: any) {
      console.error('Error loading hospital management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeFacilityId]);

  // Load FHIR demo data on tab click
  useEffect(() => {
    if (currentTab === 'fhir' && !fhirData) {
      api.getFhirBundle('pat-meera').then(res => setFhirData(res)).catch(() => {});
    }
  }, [currentTab]);

  // Quick Bed Status Update
  const handleUpdateBed = async () => {
    if (!selectedBed) return;
    try {
      await api.updateBedStatus(selectedBed.id, bedStatusToUpdate, null, bedNotes);
      showToast(`Bed ${selectedBed.bed_number} updated to ${bedStatusToUpdate}`, 'success');
      setSelectedBed(null);
      loadAllData();
    } catch (err: any) {
      showToast('Error updating bed: ' + err.message, 'error');
    }
  };

  // Quick Equipment Update - facility-scoped and enforced server-side
  const handleUpdateEquipment = async () => {
    if (!selectedEquipment) return;
    try {
      const qty = equipQtyToUpdate === '' ? undefined : Number(equipQtyToUpdate);
      await api.updateEquipment(selectedEquipment.id, {
        quantity_available: qty,
        is_available: equipAvailableToUpdate ? 1 : 0
      });
      showToast(`${selectedEquipment.equipment_name} updated`, 'success');
      setSelectedEquipment(null);
      loadAllData();
    } catch (err: any) {
      showToast('Error updating equipment: ' + err.message, 'error');
    }
  };

  // Submit Admission
  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdmission({
        patient_id: admPatientId,
        facility_id: activeFacilityId,
        ward_id: admWardId || null,
        bed_id: admBedId || null,
        doctor_id: 'doc-2',
        department: admDepartment,
        priority: admPriority,
        provisional_diagnosis: admDiagnosis,
        reason: admReason
      });
      showToast('Patient admission confirmed & Bed allocated successfully!', 'success');
      setIsNewAdmissionOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast('Admission failed: ' + err.message, 'error');
    }
  };

  // Execute Discharge
  const handleExecuteDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionForDischarge) return;
    try {
      await api.dischargePatient(selectedAdmissionForDischarge.id, {
        discharge_condition: dscCondition,
        treatment_summary: dscSummary,
        discharge_medicines: dscMedicines,
        follow_up_date: dscFollowUpDate,
        follow_up_notes: dscFollowUpNotes,
        responsible_asha_id: 'usr-asha-1'
      });
      showToast('Patient discharged. Bed moved to Cleaning & ANM Follow-Up scheduled!', 'success');
      setSelectedAdmissionForDischarge(null);
      loadAllData();
    } catch (err: any) {
      showToast('Discharge failed: ' + err.message, 'error');
    }
  };

  const metrics = facilityData?.metrics || {
    total_beds: 350,
    available_beds: 84,
    occupied_beds: 242,
    reserved_beds: 12,
    cleaning_beds: 8,
    maintenance_beds: 4,
    today_admissions: 14,
    today_discharges: 9,
    opd_queue: 28,
    pending_referrals: 6,
    emergency_capacity: { total: 12, available: 4 }
  };

  const facility = facilityData?.facility || {
    name: 'District Hospital Satara',
    district: 'Satara',
    type: 'District Hospital'
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Available':
        return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
      case 'Occupied':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      case 'Reserved':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      case 'Cleaning':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' };
      case 'Maintenance':
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      {/* Hospital Banner & Facility Selector */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '1.5rem', borderLeft: '6px solid #0284c7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                {facility.name}
              </h1>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
                {facility.type}
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span>District: <strong>{facility.district}</strong></span>
              <span>•</span>
              <span>Active User: <strong>{currentUser.full_name} ({currentUser.role.toUpperCase()})</strong></span>
              <span>•</span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>24/7 Emergency Active 🟢</span>
            </div>
          </div>

          {/* Facility Switcher Dropdown & Admission Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Switch Hospital:</span>
              <select
                value={activeFacilityId}
                onChange={(e) => setActiveFacilityId(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
              >
                <option value="fac-dh-satara">District Hospital Satara (DH)</option>
                <option value="fac-rh-khandala">Rural Hospital Khandala (RH)</option>
                <option value="fac-phc-shirwal">PHC Shirwal (Primary Care)</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewAdmissionOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
              }}
            >
              <PlusCircle size={16} /> New Admission
            </button>
          </div>
        </div>
      </div>

      {/* Hospital Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '0.75rem', marginBottom: '1.75rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'beds', label: `Beds (${metrics.available_beds} Free)`, icon: Bed },
          { id: 'admissions', label: `Admissions (${admissions.length})`, icon: Calendar },
          { id: 'referrals', label: `Referrals (${metrics.pending_referrals})`, icon: Share2 },
          { id: 'queue', label: `OPD Queue (${metrics.opd_queue})`, icon: Clock },
          { id: 'inventory', label: 'Inventory & EDL', icon: Pill },
          { id: 'diagnostics', label: 'Diagnostics Lab', icon: Activity },
          { id: 'staff', label: 'Staff Management', icon: Users },
          { id: 'network', label: '5-Tier Network', icon: Layers },
          { id: 'fhir', label: 'FHIR R4 Layer', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as HospitalTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0284c7' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#0284c7' : '#64748b'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Hospital Overview */}
      {currentTab === 'overview' && (
        <div>
          {/* Top 6 KPI Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '4px solid #0284c7' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL CAPACITY</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                {metrics.total_beds}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#0369a1' }}>Total Registered Beds</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '4px solid #16a34a' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>AVAILABLE BEDS</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#16a34a', margin: '0.2rem 0' }}>
                {metrics.available_beds}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#15803d' }}>Ready for immediate intake</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '4px solid #dc2626' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>OCCUPIED BEDS</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#dc2626', margin: '0.2rem 0' }}>
                {metrics.occupied_beds}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b91c1c' }}>
                Occupancy: {metrics.total_beds ? Math.round((metrics.occupied_beds / metrics.total_beds) * 100) : 70}%
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '4px solid #f59e0b' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>RESERVED / TRANSIT</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#d97706', margin: '0.2rem 0' }}>
                {metrics.reserved_beds}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b45309' }}>Incoming PHC referrals</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '4px solid #38bdf8' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>CLEANING & DISINFECTION</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0284c7', margin: '0.2rem 0' }}>
                {metrics.cleaning_beds}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#0369a1' }}>Post-discharge sanitize</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '4px solid #9333ea' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>TODAY'S FLOW</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0' }}>
                +{metrics.today_admissions} Adm / -{metrics.today_discharges} Dis
              </div>
              <div style={{ fontSize: '0.78rem', color: '#7e22ce' }}>Net Census: +{metrics.today_admissions - metrics.today_discharges}</div>
            </div>
          </div>

          {/* Operational Snapshots Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* ICU & Emergency Snapshot */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <ShieldAlert size={18} color="#dc2626" /> Emergency & Critical Care Capacity
                </h3>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  24/7 Red Alert Desk
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                    {metrics.emergency_capacity?.available} / {metrics.emergency_capacity?.total}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Ventilator Beds Free</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>
                    {metrics.pending_referrals}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Pending Incoming Referrals</div>
                </div>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                Priority triaging in effect. High-risk maternal emergencies from Sub-Centres and PHCs receive auto-reserved Level-II beds.
              </p>
            </div>

            {/* Quick Actions & Departmental Status */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '1rem', margin: 0 }}>
                Hospital Operational Quick Access
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setCurrentTab('beds')}
                  style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Bed size={16} style={{ marginBottom: '0.25rem' }} />
                  <div>Manage Bed Grid</div>
                </button>
                <button
                  onClick={() => setCurrentTab('admissions')}
                  style={{ padding: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Calendar size={16} style={{ marginBottom: '0.25rem' }} />
                  <div>Active Admissions</div>
                </button>
                <button
                  onClick={() => setCurrentTab('referrals')}
                  style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem', color: '#b45309', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Share2 size={16} style={{ marginBottom: '0.25rem' }} />
                  <div>Inter-Tier Referrals</div>
                </button>
                <button
                  onClick={() => setCurrentTab('network')}
                  style={{ padding: '0.75rem', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '0.5rem', color: '#7e22ce', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Layers size={16} style={{ marginBottom: '0.25rem' }} />
                  <div>Facility Network</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bed Management */}
      {currentTab === 'beds' && (
        <div>
          {/* Bed Legend */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>STATUS LEGEND:</span>
              {['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'].map(st => {
                const style = getStatusBadgeColor(st);
                return (
                  <span
                    key={st}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: style.bg,
                      color: style.color,
                      border: `1px solid ${style.border}`,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    ● {st}
                  </span>
                );
              })}
            </div>

            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              💡 Click on any bed to change status or assign patient
            </span>
          </div>

          {/* Wards with their beds */}
          {wardsAndBeds.wards.map(w => {
            const wardBeds = wardsAndBeds.beds.filter(b => b.ward_id === w.id);
            return (
              <div key={w.id} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                      {w.name}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Dept: <strong>{w.department}</strong> • Floor: <strong>{w.floor}</strong> • Gender: <strong>{w.gender_allowed}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284c7' }}>
                    {wardBeds.filter(b => b.status === 'Available').length} / {wardBeds.length} Available
                  </div>
                </div>

                {/* Bed Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
                  {wardBeds.map(b => {
                    const st = getStatusBadgeColor(b.status);
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBed(b);
                          setBedStatusToUpdate(b.status);
                          setBedNotes(b.notes || '');
                        }}
                        style={{
                          background: st.bg,
                          border: `1px solid ${st.border}`,
                          borderRadius: '0.75rem',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: st.color }}>
                            {b.bed_number}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: st.color }}>
                            {b.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.5rem' }}>
                          {b.room_number}
                        </div>

                        {b.patient_name ? (
                          <div style={{ background: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.78rem' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>👤 {b.patient_name}</div>
                            {b.notes && (
                              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.2rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {b.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                            {b.notes || 'Clean linen ready'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Admission Management */}
      {currentTab === 'admissions' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                Inpatient Admission Pipeline & Clinical Stages
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Flow: Referral ➔ Verification ➔ Doctor Assessment ➔ Bed Allocation ➔ Inpatient Treatment ➔ Discharge
              </p>
            </div>

            <button
              onClick={() => setIsNewAdmissionOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={15} /> Admit Patient
            </button>
          </div>

          {/* Admissions Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Adm #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Dept / Priority</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bed & Ward</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Doctor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map(adm => (
                  <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0284c7' }}>
                      {adm.admission_number}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{adm.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{adm.patient_village} • {adm.patient_age}y / {adm.patient_gender}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>{adm.department}</div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: adm.priority === 'Emergency' ? '#fee2e2' : adm.priority === 'Maternal' ? '#fef3c7' : '#f1f5f9',
                        color: adm.priority === 'Emergency' ? '#b91c1c' : adm.priority === 'Maternal' ? '#b45309' : '#475569'
                      }}>
                        {adm.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {adm.bed_number ? (
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>
                          🛏️ {adm.bed_number} ({adm.ward_name})
                        </span>
                      ) : (
                        <span style={{ color: '#d97706', fontSize: '0.8rem' }}>Pending Bed Allocation</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {adm.doctor_name || 'Assigned Resident'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: adm.status === 'Discharged' ? '#f1f5f9' : adm.status === 'Under Treatment' ? '#dcfce7' : '#e0f2fe',
                        color: adm.status === 'Discharged' ? '#64748b' : adm.status === 'Under Treatment' ? '#15803d' : '#0369a1'
                      }}>
                        {adm.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {adm.status !== 'Discharged' ? (
                        <button
                          onClick={() => setSelectedAdmissionForDischarge(adm)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          Discharge Summary ➔
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Completed ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Referral Management Integration */}
      {currentTab === 'referrals' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                Inter-Facility Referral Pipeline — Public Health Tier Escalations
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Village ➔ Sub-Centre / ANM ➔ PHC ➔ Rural Hospital ➔ District Specialist Hospital
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {referrals.map(ref => (
              <div
                key={ref.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: ref.priority === 'emergency' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  background: ref.priority === 'emergency' ? '#fff5f5' : '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem' }}>
                      {ref.referral_code}
                    </span>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: ref.priority === 'emergency' ? '#fee2e2' : '#fef3c7',
                      color: ref.priority === 'emergency' ? '#b91c1c' : '#b45309'
                    }}>
                      {ref.priority.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Target Date: <strong>{ref.target_date}</strong>
                    </span>
                  </div>

                  <div style={{ marginTop: '0.35rem', fontSize: '0.92rem', color: '#0f172a', fontWeight: 700 }}>
                    Patient ID: {ref.patient_id} • Required Specialty: {ref.specialty_required}
                  </div>

                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: '#475569', maxWidth: '750px', lineHeight: 1.5 }}>
                    {ref.clinical_reason}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: '#e0f2fe',
                    color: '#0369a1'
                  }}>
                    {ref.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => {
                      setAdmPatientId(ref.patient_id);
                      setAdmDepartment(ref.specialty_required);
                      setAdmDiagnosis(ref.clinical_reason);
                      setIsNewAdmissionOpen(true);
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Admit to Bed ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Hospital Staff Management */}
      {currentTab === 'staff' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
              Authorized Healthcare Staff & Duty Shifts
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Doctors, Staff Nurses, Lab Technologists & Frontline Coordinators
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {staff.map(stf => (
              <div key={stf.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                      {stf.full_name}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, marginTop: '0.15rem' }}>
                      {stf.role}
                    </div>
                  </div>
                  <span style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: stf.is_available ? '#dcfce7' : '#fee2e2',
                    color: stf.is_available ? '#15803d' : '#b91c1c'
                  }}>
                    {stf.is_available ? 'ON DUTY' : 'OFF DUTY'}
                  </span>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>Emp ID: <strong>{stf.employee_id}</strong></div>
                  <div>Department: <strong>{stf.department}</strong></div>
                  <div>Current Shift: <strong>{stf.shift}</strong></div>
                  {stf.phone && <div>Contact: <strong>{stf.phone}</strong></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Medicine & Medical Inventory */}
      {currentTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                Essential Drugs List (EDL) & Medical Supplies Inventory
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                Batch tracking, expiry dates, and real-time buffer stock monitoring
              </div>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
              {(['ALL', 'in_stock', 'low_stock', 'out_of_stock'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => setInvFilter(flt)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: invFilter === flt ? '#fff' : 'transparent',
                    fontWeight: invFilter === flt ? 700 : 500,
                    fontSize: '0.8rem',
                    color: invFilter === flt ? '#0284c7' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {flt.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Medicine Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Generic / Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Batch & Expiry</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Storage Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Stock Level</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter(m => invFilter === 'ALL' || m.status === invFilter)
                  .map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        {m.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                        <div>{m.generic_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.category}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <div>Batch: <strong>{m.batch_number || 'BATCH-2026-A'}</strong></div>
                        <div>Exp: <strong>{m.expiry_date || '2027-12-31'}</strong></div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                        {m.storage_location || 'Main Pharmacy'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>
                        {m.stock_quantity.toLocaleString()} {m.unit}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: m.status === 'in_stock' ? '#dcfce7' : m.status === 'low_stock' ? '#fef3c7' : '#fee2e2',
                          color: m.status === 'in_stock' ? '#15803d' : m.status === 'low_stock' ? '#b45309' : '#b91c1c'
                        }}>
                          {m.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Medical Equipment */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 1rem', fontWeight: 700 }}>
              Medical Equipment
            </h3>
            {equipment.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No equipment records for this facility.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {equipment.map((e) => (
                  <div key={e.id} className="glass-panel" style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{e.equipment_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{e.category}</div>
                      </div>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                        background: e.is_available ? '#dcfce7' : '#fee2e2',
                        color: e.is_available ? '#15803d' : '#b91c1c'
                      }}>
                        {e.is_available ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </div>
                    {e.quantity_available != null && (
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem' }}>
                        Quantity: <strong>{e.quantity_available}</strong>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedEquipment(e);
                        setEquipQtyToUpdate(e.quantity_available != null ? String(e.quantity_available) : '');
                        setEquipAvailableToUpdate(!!e.is_available);
                      }}
                      style={{ marginTop: '0.6rem', width: '100%', padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Update
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Diagnostics Management */}
      {currentTab === 'diagnostics' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                Diagnostic Laboratory & Radiology Workflow
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Doctor Request ➔ Sample Collection ➔ Processing ➔ Report Ready ➔ Clinician Notified
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {[
              {
                id: 'diag-101',
                test: 'Level II / TIFFA Obstetric Ultrasound Scan',
                patient: 'Meera Patil (pat-meera)',
                doctor: 'Dr. Rajiv Joshi (OB-GYN)',
                sample_status: 'Scheduled',
                processing_status: 'Equipment Ready',
                equipment: 'GE Logiq P9 Ultrasound System',
                turnaround: 'Same Day at DH Satara',
                priority: 'Priority'
              },
              {
                id: 'diag-102',
                test: 'Complete Blood Count (CBC) & Serum Ferritin',
                patient: 'Meera Patil (pat-meera)',
                doctor: 'Dr. Rajiv Joshi (OB-GYN)',
                sample_status: 'Sample Collected',
                processing_status: 'In Processing',
                equipment: 'Mindray BC-5150 Auto Hematology Analyzer',
                turnaround: '45 Minutes',
                priority: 'Routine'
              },
              {
                id: 'diag-103',
                test: 'Continuous Blood Glucose & HbA1c Profile',
                patient: 'Prakash Jadhav (pat-prakash)',
                doctor: 'Dr. Vinod Mane (Medicine)',
                sample_status: 'Sample Collected',
                processing_status: 'Processing',
                equipment: 'Bio-Rad D-10 HPLC Analyzer',
                turnaround: '2 Hours',
                priority: 'Urgent'
              }
            ].map(d => (
              <div key={d.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                    {d.test}
                  </h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c' }}>
                    {d.priority}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem' }}>
                  <div>Patient: <strong>{d.patient}</strong></div>
                  <div>Ordering Doctor: <strong>{d.doctor}</strong></div>
                  <div>Equipment: <strong>{d.equipment}</strong></div>
                  <div>Sample Status: <strong style={{ color: '#0284c7' }}>{d.sample_status}</strong></div>
                  <div>Processing: <strong style={{ color: '#16a34a' }}>{d.processing_status}</strong></div>
                  <div>Turnaround Time: <strong>{d.turnaround}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Queue Management */}
      {currentTab === 'queue' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
              Live OPD Counter Queue & Token Calling Desk
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700 }}>
              Counter: Room 2 • Dr. Anand Deshmukh
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Token #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Patient Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Service & Reason</th>
                <th style={{ padding: '0.75rem 1rem' }}>Wait Est.</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(tok => (
                <tr key={tok.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
                    #{tok.token_number}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    {tok.patient_name} ({tok.village})
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                    {tok.service_name}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {tok.estimated_wait_minutes} mins
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: tok.status === 'in_progress' ? '#e0f2fe' : tok.status === 'completed' ? '#f1f5f9' : '#fef3c7',
                      color: tok.status === 'in_progress' ? '#0369a1' : tok.status === 'completed' ? '#64748b' : '#b45309'
                    }}>
                      {tok.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 9: Facility Network Hierarchy View */}
      {currentTab === 'network' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
              Integrated Maharashtra Public Health Network Hierarchy
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Seamless continuity of care from community doorstep to tertiary specialist care
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                tier: 'Tier 5: Tertiary & Specialist District Hospitals',
                type: 'District Hospital',
                icon: '🏥',
                desc: 'Specialist departments, ICU, blood banks, high-risk surgical suites, Level-II NICU',
                facilities: facilityNetwork?.hierarchy?.districtHospital || []
              },
              {
                tier: 'Tier 4: Sub-District Hospitals (SDH)',
                type: 'Sub-District Hospital',
                icon: '🏢',
                desc: 'Specialist OPD, inpatient wards (50-100 beds), minor OT, blood storage',
                facilities: facilityNetwork?.hierarchy?.subDistrictHospital || []
              },
              {
                tier: 'Tier 3: Community Health Centres & Rural Hospitals',
                type: 'Rural Hospital',
                icon: '🏛️',
                desc: '30-bed inpatient care, emergency stabilization, basic ultrasound and X-ray',
                facilities: facilityNetwork?.hierarchy?.ruralHospital || []
              },
              {
                tier: 'Tier 2: Primary Health Centres (PHC)',
                type: 'PHC',
                icon: '🩺',
                desc: '24/7 delivery services, day-care observation, basic laboratory, pharmacy dispensing',
                facilities: facilityNetwork?.hierarchy?.phc || []
              },
              {
                tier: 'Tier 1: Ayushman Arogya Mandirs (Sub-Centres)',
                type: 'Sub-Centre',
                icon: '🏡',
                desc: 'ANM frontline community clinic, ANC checkups, immunization, telemedicine node',
                facilities: facilityNetwork?.hierarchy?.subCentre || []
              }
            ].map(lvl => (
              <div key={lvl.tier} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{lvl.icon}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                        {lvl.tier}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{lvl.desc}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {lvl.facilities.length} Facilities in System
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {lvl.facilities.slice(0, 4).map((f: any) => (
                    <div key={f.id} style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{f.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{f.taluka}, {f.district}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
                        <span>Beds: {f.available_beds} / {f.total_beds}</span>
                        <span>Emergency: {f.emergency_24x7 ? 'Yes 🟢' : 'No'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 10: FHIR Interoperability Inspector */}
      {currentTab === 'fhir' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                HL7 FHIR R4 Interoperability Standard Mapping
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                Standards-compliant digital health data export (Patient, Observation, Condition, Encounter, MedicationRequest, ServiceRequest)
              </p>
            </div>

            <button
              onClick={() => showToast('FHIR Document Bundle JSON Copied to Clipboard', 'success')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 0.95rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Download size={15} /> Export FHIR R4 JSON
            </button>
          </div>

          <div style={{ background: '#0f172a', color: '#38bdf8', padding: '1.25rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '0.82rem', maxHeight: '420px', overflowY: 'auto' }}>
            <pre style={{ margin: 0 }}>
              {JSON.stringify(fhirData || {
                resourceType: 'Bundle',
                id: 'bundle-pat-meera',
                type: 'document',
                entry: [
                  {
                    resource: {
                      resourceType: 'Patient',
                      id: 'pat-meera',
                      identifier: [{ system: 'https://healthid.ndhm.gov.in', value: '91-8834-2910-1029' }],
                      name: [{ text: 'Meera Patil' }],
                      gender: 'female',
                      address: [{ line: ['Shirwal'], city: 'Khandala', state: 'Maharashtra' }]
                    }
                  },
                  {
                    resource: {
                      resourceType: 'Encounter',
                      id: 'enc-imp-adm-meera-101',
                      status: 'in-progress',
                      class: { code: 'IMP', display: 'inpatient encounter' },
                      serviceProvider: { display: 'District Hospital Satara' }
                    }
                  }
                ]
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Bed Status Update Modal */}
      {selectedBed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', background: '#ffffff', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
              Manage Bed {selectedBed.bed_number}
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Ward: <strong>{selectedBed.ward_name}</strong> • Room: <strong>{selectedBed.room_number}</strong>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Bed Status:
              </label>
              <select
                value={bedStatusToUpdate}
                onChange={(e) => setBedStatusToUpdate(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
              >
                <option value="Available">Available (Clean & Ready)</option>
                <option value="Occupied">Occupied (Patient Assigned)</option>
                <option value="Reserved">Reserved (Incoming Referral)</option>
                <option value="Cleaning">Cleaning (Disinfection in progress)</option>
                <option value="Maintenance">Maintenance (Equipment Repair)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Operational Notes:
              </label>
              <textarea
                value={bedNotes}
                onChange={(e) => setBedNotes(e.target.value)}
                placeholder="e.g. Oxygen flow verified, sanitized post-discharge"
                rows={3}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                onClick={() => setSelectedBed(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBed}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Update Modal */}
      {selectedEquipment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
              Update {selectedEquipment.equipment_name}
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Category: <strong>{selectedEquipment.category}</strong>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Quantity Available:
              </label>
              <input
                type="number"
                min={0}
                value={equipQtyToUpdate}
                onChange={(e) => setEquipQtyToUpdate(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={equipAvailableToUpdate}
                onChange={(e) => setEquipAvailableToUpdate(e.target.checked)}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Currently Available</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                onClick={() => setSelectedEquipment(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEquipment}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#0d9488', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Admission Modal */}
      {isNewAdmissionOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', background: '#ffffff', borderRadius: '1rem', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', color: '#0f172a', fontWeight: 800 }}>
              Direct Inpatient Admission & Bed Allocation
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: '#64748b' }}>
              Admitting to {facility.name} • Clinical assessment verification
            </p>

            <form onSubmit={handleCreateAdmission}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Patient:</label>
                  <select
                    value={admPatientId}
                    onChange={(e) => setAdmPatientId(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="pat-meera">Meera Patil (pat-meera, 28y)</option>
                    <option value="pat-prakash">Prakash Jadhav (pat-prakash, 54y)</option>
                    <option value="pat-sunita">Sunita Pawar (pat-sunita, 32y)</option>
                    <option value="pat-maruti">Maruti Shinde (pat-maruti, 68y)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Priority:</label>
                  <select
                    value={admPriority}
                    onChange={(e) => setAdmPriority(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Maternal">Maternal Priority</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Department:</label>
                  <select
                    value={admDepartment}
                    onChange={(e) => setAdmDepartment(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Critical Care / ICU">Critical Care / ICU</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Allocate Available Bed:</label>
                  <select
                    value={admBedId}
                    onChange={(e) => setAdmBedId(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- Select Bed --</option>
                    {wardsAndBeds.beds.filter(b => b.status === 'Available').map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bed_number} ({b.ward_name} - {b.room_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Provisional Diagnosis:</label>
                <input
                  type="text"
                  value={admDiagnosis}
                  onChange={(e) => setAdmDiagnosis(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Reason & Care Plan:</label>
                <textarea
                  value={admReason}
                  onChange={(e) => setAdmReason(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNewAdmissionOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Summary & ANM Follow-Up Drawer/Modal */}
      {selectedAdmissionForDischarge && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '1rem', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', color: '#0f172a', fontWeight: 800 }}>
              Generate Discharge Summary & Post-Care Plan
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Patient: <strong>{selectedAdmissionForDischarge.patient_name}</strong> • Admission: <strong>{selectedAdmissionForDischarge.admission_number}</strong>
            </div>

            <form onSubmit={handleExecuteDischarge}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Discharge Condition:</label>
                <input
                  type="text"
                  value={dscCondition}
                  onChange={(e) => setDscCondition(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Inpatient Treatment Summary:</label>
                <textarea
                  value={dscSummary}
                  onChange={(e) => setDscSummary(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#166534', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Automated Frontline ANM Follow-Up Assignment
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '0.2rem' }}>Follow-Up Date:</label>
                    <input
                      type="date"
                      value={dscFollowUpDate}
                      onChange={(e) => setDscFollowUpDate(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #86efac', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '0.2rem' }}>Tasks for ANM (Asha Shinde):</label>
                    <input
                      type="text"
                      value={dscFollowUpNotes}
                      onChange={(e) => setDscFollowUpNotes(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '0.375rem', border: '1px solid #86efac', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAdmissionForDischarge(null)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Discharge & Notify ANM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementView;
