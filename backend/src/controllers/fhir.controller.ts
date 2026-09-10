import { Request, Response } from 'express';
import db from '../config/db.js';

/**
 * Standard HL7 FHIR R4 Mapping Layer for Seva Health
 * Maps internal SQLite models to compliant FHIR R4 JSON schemas
 */

// 1. FHIR Patient Mapper
export const getFhirPatient = (req: Request, res: Response) => {
  const patientId = req.params.id || 'pat-meera';
  const p = db.prepare('SELECT * FROM patients WHERE id = ? OR abha_id = ?').get(patientId, patientId) as any;

  if (!p) {
    return res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'error', code: 'not-found', diagnostics: `Patient ${patientId} not found` }]
    });
  }

  const fhirPatient = {
    resourceType: 'Patient',
    id: p.id,
    identifier: [
      {
        use: 'official',
        system: 'https://healthid.ndhm.gov.in',
        value: p.abha_id,
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'ABHA', display: 'Ayushman Bharat Health Account' }] }
      },
      {
        use: 'usual',
        system: 'https://sevahealth.maharashtra.gov.in/patients',
        value: p.id
      }
    ],
    active: true,
    name: [{
      use: 'official',
      text: p.full_name,
      family: p.full_name.split(' ').slice(-1)[0] || '',
      given: p.full_name.split(' ').slice(0, -1)
    }],
    telecom: [{
      system: 'phone',
      value: p.phone,
      use: 'mobile'
    }],
    gender: p.gender === 'F' ? 'female' : p.gender === 'M' ? 'male' : 'other',
    address: [{
      use: 'home',
      line: [p.village],
      city: p.taluka,
      district: p.district,
      state: 'Maharashtra',
      country: 'IND'
    }]
  };

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(fhirPatient);
};

// 2. FHIR Observations (Vitals)
export const getFhirObservations = (req: Request, res: Response) => {
  const patientId = req.params.patientId || (req.query.patient as string) || 'pat-meera';

  const consultations = db.prepare(`
    SELECT c.id, c.patient_id, c.created_at, c.vitals_json, d.full_name as doctor_name
    FROM consultations c
    JOIN doctors d ON c.doctor_id = d.id
    WHERE c.patient_id = ?
    ORDER BY c.created_at DESC
  `).all(patientId) as any[];

  const entries: any[] = [];

  consultations.forEach((c) => {
    let vitals: any = {};
    try {
      vitals = typeof c.vitals_json === 'string' ? JSON.parse(c.vitals_json) : c.vitals_json;
    } catch {
      vitals = {};
    }

    // BP Observation
    if (vitals.bp) {
      const parts = vitals.bp.split('/');
      entries.push({
        resource: {
          resourceType: 'Observation',
          id: `obs-bp-${c.id}`,
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
          code: {
            coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel with all children optional' }],
            text: 'Blood Pressure'
          },
          subject: { reference: `Patient/${c.patient_id}` },
          effectiveDateTime: c.created_at,
          component: [
            {
              code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
              valueQuantity: { value: parseFloat(parts[0]) || 120, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
            },
            {
              code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
              valueQuantity: { value: parseFloat(parts[1]) || 80, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
            }
          ]
        }
      });
    }

    // Pulse
    if (vitals.pulse) {
      entries.push({
        resource: {
          resourceType: 'Observation',
          id: `obs-pulse-${c.id}`,
          status: 'final',
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }], text: 'Heart Rate' },
          subject: { reference: `Patient/${c.patient_id}` },
          effectiveDateTime: c.created_at,
          valueQuantity: { value: parseFloat(vitals.pulse), unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' }
        }
      });
    }
  });

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: entries.length,
    entry: entries
  });
};

// 3. FHIR Condition (Diagnoses)
export const getFhirConditions = (req: Request, res: Response) => {
  const patientId = req.params.patientId || (req.query.patient as string) || 'pat-meera';

  const consultations = db.prepare(`
    SELECT c.id, c.patient_id, c.diagnosis, c.created_at, c.clinical_notes, d.full_name as doctor_name
    FROM consultations c
    JOIN doctors d ON c.doctor_id = d.id
    WHERE c.patient_id = ?
  `).all(patientId) as any[];

  const entries = consultations.map((c) => ({
    resource: {
      resourceType: 'Condition',
      id: `cond-${c.id}`,
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
      code: { text: c.diagnosis },
      subject: { reference: `Patient/${c.patient_id}` },
      recordedDate: c.created_at,
      note: [{ text: c.clinical_notes }]
    }
  }));

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: entries.length,
    entry: entries
  });
};

// 4. FHIR Encounters (Consultations & Admissions)
export const getFhirEncounters = (req: Request, res: Response) => {
  const patientId = req.params.patientId || (req.query.patient as string) || 'pat-meera';

  const consultations = db.prepare(`
    SELECT c.id, c.patient_id, c.created_at, f.name as facility_name, d.full_name as doctor_name
    FROM consultations c
    JOIN facilities f ON c.facility_id = f.id
    JOIN doctors d ON c.doctor_id = d.id
    WHERE c.patient_id = ?
  `).all(patientId) as any[];

  const admissions = db.prepare(`
    SELECT a.id, a.patient_id, a.admission_date, a.discharge_date, a.department, a.status,
           f.name as facility_name, d.full_name as doctor_name
    FROM admissions a
    JOIN facilities f ON a.facility_id = f.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = ?
  `).all(patientId) as any[];

  const entries = [
    ...consultations.map((c) => ({
      resource: {
        resourceType: 'Encounter',
        id: `enc-opd-${c.id}`,
        status: 'finished',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
        subject: { reference: `Patient/${c.patient_id}` },
        period: { start: c.created_at },
        serviceProvider: { display: c.facility_name }
      }
    })),
    ...admissions.map((a) => ({
      resource: {
        resourceType: 'Encounter',
        id: `enc-imp-${a.id}`,
        status: a.status === 'Discharged' ? 'finished' : 'in-progress',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'inpatient encounter' },
        subject: { reference: `Patient/${a.patient_id}` },
        period: { start: a.admission_date, end: a.discharge_date || undefined },
        serviceProvider: { display: a.facility_name }
      }
    }))
  ];

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: entries.length,
    entry: entries
  });
};

// 5. FHIR MedicationRequest (Prescriptions)
export const getFhirMedicationRequests = (req: Request, res: Response) => {
  const patientId = req.params.patientId || (req.query.patient as string) || 'pat-meera';

  const prescriptions = db.prepare(`
    SELECT pr.id, pr.patient_id, pr.medicines_json, pr.instructions, pr.created_at,
           d.full_name as doctor_name
    FROM prescriptions pr
    JOIN doctors d ON pr.doctor_id = d.id
    WHERE pr.patient_id = ?
  `).all(patientId) as any[];

  const entries: any[] = [];
  prescriptions.forEach((pr) => {
    let meds: any[] = [];
    try {
      meds = typeof pr.medicines_json === 'string' ? JSON.parse(pr.medicines_json) : pr.medicines_json;
    } catch {
      meds = [];
    }

    meds.forEach((m, idx) => {
      entries.push({
        resource: {
          resourceType: 'MedicationRequest',
          id: `medrx-${pr.id}-${idx}`,
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: { text: m.name },
          subject: { reference: `Patient/${pr.patient_id}` },
          authoredOn: pr.created_at,
          requester: { display: pr.doctor_name },
          dosageInstruction: [{
            text: `${m.dosage} - ${m.frequency} for ${m.days}. Instructions: ${m.instructions || ''}`
          }]
        }
      });
    });
  });

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: entries.length,
    entry: entries
  });
};

// 6. FHIR DiagnosticReport (Lab Reports)
export const getFhirDiagnosticReports = (req: Request, res: Response) => {
  const patientId = req.params.patientId || (req.query.patient as string) || 'pat-meera';

  const tests = db.prepare(`
    SELECT dt.*, f.name as facility_name
    FROM diagnostic_tests dt
    JOIN facilities f ON dt.facility_id = f.id
    WHERE dt.patient_id = ?
  `).all(patientId) as any[];

  const entries = tests.map((t) => ({
    resource: {
      resourceType: 'DiagnosticReport',
      id: `diag-${t.id}`,
      status: t.status === 'completed' ? 'final' : 'preliminary',
      code: { text: t.test_name },
      subject: { reference: `Patient/${t.patient_id}` },
      effectiveDateTime: t.created_at,
      issued: t.completed_at || t.created_at,
      conclusion: t.result_summary || 'Analysis in progress'
    }
  }));

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: entries.length,
    entry: entries
  });
};

// 7. FHIR ServiceRequest (Referrals)
export const getFhirServiceRequests = (req: Request, res: Response) => {
  const patientId = req.params.patientId || (req.query.patient as string) || 'pat-meera';

  const referrals = db.prepare(`
    SELECT r.*, rf.name as from_facility, rec.name as to_facility, d.full_name as doctor_name
    FROM referrals r
    JOIN facilities rf ON r.referring_facility_id = rf.id
    JOIN facilities rec ON r.receiving_facility_id = rec.id
    JOIN doctors d ON r.referring_doctor_id = d.id
    WHERE r.patient_id = ?
  `).all(patientId) as any[];

  const entries = referrals.map((r) => ({
    resource: {
      resourceType: 'ServiceRequest',
      id: `serv-${r.id}`,
      identifier: [{ system: 'https://sevahealth.maharashtra.gov.in/referrals', value: r.referral_code }],
      status: r.status === 'completed' ? 'completed' : 'active',
      intent: 'order',
      priority: r.priority === 'emergency' ? 'stat' : r.priority === 'priority' ? 'urgent' : 'routine',
      code: { text: r.specialty_required },
      subject: { reference: `Patient/${r.patient_id}` },
      requester: { display: `${r.doctor_name} (${r.from_facility})` },
      performer: [{ display: r.to_facility }],
      reasonCode: [{ text: r.clinical_reason }]
    }
  }));

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: entries.length,
    entry: entries
  });
};

// 8. Full Patient FHIR R4 Bundle (Document Bundle)
export const getFhirPatientBundle = (req: Request, res: Response) => {
  const patientId = req.params.patientId || 'pat-meera';

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId) as any;
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const bundle = {
    resourceType: 'Bundle',
    id: `bundle-${patient.id}-${Date.now()}`,
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `urn:uuid:patient-${patient.id}`,
        resource: {
          resourceType: 'Patient',
          id: patient.id,
          identifier: [{ system: 'https://healthid.ndhm.gov.in', value: patient.abha_id }],
          name: [{ text: patient.full_name }],
          gender: patient.gender === 'F' ? 'female' : 'male',
          birthDate: `${new Date().getFullYear() - patient.age}-01-01`,
          address: [{ text: `${patient.village}, ${patient.taluka}, ${patient.district}` }]
        }
      }
    ]
  };

  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
};
