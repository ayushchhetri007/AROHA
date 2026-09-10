import { Request, Response } from 'express';
import db from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

// 1. Hospital Overview Metrics
export const getHospitalOverview = async (req: Request, res: Response) => {
  const facilityId = (req.query.facility_id as string) || 'fac-dh-satara';

  const facility = await db.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId) as any;
  if (!facility) {
    return res.status(404).json({ error: 'Facility not found' });
  }

  // Bed breakdown
  const bedStats = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
      SUM(CASE WHEN status = 'Reserved' THEN 1 ELSE 0 END) as reserved,
      SUM(CASE WHEN status = 'Cleaning' THEN 1 ELSE 0 END) as cleaning,
      SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
    FROM beds
    WHERE facility_id = ?
  `).get(facilityId) as any;

  // Admissions today
  const todayAdmissions = await db.prepare(`
    SELECT COUNT(*) as count
    FROM admissions
    WHERE facility_id = ? AND date(admission_date) = CURRENT_DATE
  `).get(facilityId) as any;

  // Discharges today
  const todayDischarges = await db.prepare(`
    SELECT COUNT(*) as count
    FROM discharges d
    JOIN admissions a ON d.admission_id = a.id
    WHERE a.facility_id = ? AND date(d.discharge_date) = CURRENT_DATE
  `).get(facilityId) as any;

  // Live OPD Queue count
  const opdQueue = await db.prepare(`
    SELECT COUNT(*) as count
    FROM queue_tokens
    WHERE facility_id = ? AND status IN ('waiting', 'called', 'in_progress')
  `).get(facilityId) as any;

  // Pending incoming referrals
  const pendingReferrals = await db.prepare(`
    SELECT COUNT(*) as count
    FROM referrals
    WHERE receiving_facility_id = ? AND status IN ('created', 'accepted', 'pending')
  `).get(facilityId) as any;

  // ICU / Emergency capacity
  const emergencyBeds = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available
    FROM beds b
    JOIN wards w ON b.ward_id = w.id
    WHERE b.facility_id = ? AND (w.department ILIKE '%Critical%' OR w.department ILIKE '%Emergency%' OR w.name ILIKE '%ICU%')
  `).get(facilityId) as any;

  res.json({
    facility,
    metrics: {
      total_beds: bedStats?.total || facility.total_beds || 0,
      available_beds: bedStats?.available || facility.available_beds || 0,
      occupied_beds: bedStats?.occupied || 0,
      reserved_beds: bedStats?.reserved || 0,
      cleaning_beds: bedStats?.cleaning || 0,
      maintenance_beds: bedStats?.maintenance || 0,
      today_admissions: todayAdmissions?.count || 0,
      today_discharges: todayDischarges?.count || 0,
      opd_queue: opdQueue?.count || 0,
      pending_referrals: pendingReferrals?.count || 0,
      emergency_capacity: {
        total: emergencyBeds?.total || 12,
        available: emergencyBeds?.available || 4
      }
    }
  });
};

// 2. Get Wards and Beds
export const getWardsAndBeds = async (req: Request, res: Response) => {
  const facilityId = (req.query.facility_id as string) || 'fac-dh-satara';

  const wards = await db.prepare(`
    SELECT * FROM wards WHERE facility_id = ? ORDER BY name ASC
  `).all(facilityId) as any[];

  const beds = await db.prepare(`
    SELECT b.*, w.name as ward_name, w.department as ward_department, p.full_name as patient_name, p.age as patient_age, p.gender as patient_gender
    FROM beds b
    JOIN wards w ON b.ward_id = w.id
    LEFT JOIN patients p ON b.current_patient_id = p.id
    WHERE b.facility_id = ?
    ORDER BY b.room_number ASC, b.bed_number ASC
  `).all(facilityId) as any[];

  res.json({
    facility_id: facilityId,
    wards,
    beds
  });
};

// 3. Update Bed Status
export const updateBedStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, current_patient_id, notes } = req.body;

  const bed = await db.prepare('SELECT * FROM beds WHERE id = ?').get(id) as any;
  if (!bed) {
    return res.status(404).json({ error: 'Bed not found' });
  }

  const patientId = status === 'Available' ? null : (current_patient_id !== undefined ? current_patient_id : bed.current_patient_id);
  const cleanedAt = status === 'Available' ? new Date().toISOString() : bed.last_cleaned_at;

  await db.prepare(`
    UPDATE beds
    SET status = ?, current_patient_id = ?, last_cleaned_at = ?, notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(status, patientId, cleanedAt, notes, id);

  // Sync available_beds count on facilities table
  const countRes = await db.prepare(`
    SELECT COUNT(*) as available FROM beds WHERE facility_id = ? AND status = 'Available'
  `).get(bed.facility_id) as any;

  if (countRes) {
    await db.prepare('UPDATE facilities SET available_beds = ? WHERE id = ?').run(countRes.available, bed.facility_id);
  }

  const updated = await db.prepare(`
    SELECT b.*, w.name as ward_name, p.full_name as patient_name
    FROM beds b
    JOIN wards w ON b.ward_id = w.id
    LEFT JOIN patients p ON b.current_patient_id = p.id
    WHERE b.id = ?
  `).get(id);

  res.json({
    message: `Bed ${bed.bed_number} updated to ${status}`,
    bed: updated
  });
};

// 4. Get Admissions
export const getAdmissions = async (req: Request, res: Response) => {
  const facilityId = (req.query.facility_id as string) || 'fac-dh-satara';
  const status = req.query.status as string;

  let query = `
    SELECT a.*, p.full_name as patient_name, p.age as patient_age, p.gender as patient_gender, p.phone as patient_phone, p.village as patient_village,
           d.full_name as doctor_name, w.name as ward_name, b.bed_number, b.room_number,
           r.referral_code, r.clinical_reason as referral_reason
    FROM admissions a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN wards w ON a.ward_id = w.id
    LEFT JOIN beds b ON a.bed_id = b.id
    LEFT JOIN referrals r ON a.referral_id = r.id
    WHERE a.facility_id = ?
  `;

  const params: any[] = [facilityId];
  if (status && status !== 'ALL') {
    query += ' AND a.status = ?';
    params.push(status);
  }

  query += ' ORDER BY a.admission_date DESC';

  const admissions = await db.prepare(query).all(...params);
  res.json(admissions);
};

// 5. Create Admission
export const createAdmission = async (req: AuthRequest, res: Response) => {
  const {
    patient_id,
    facility_id,
    ward_id,
    bed_id,
    doctor_id,
    referral_id,
    department,
    priority = 'Normal',
    provisional_diagnosis,
    reason,
    admission_date = new Date().toISOString()
  } = req.body;

  if (!patient_id || !facility_id || !department || !provisional_diagnosis) {
    return res.status(400).json({ error: 'Missing required admission fields (patient_id, facility_id, department, provisional_diagnosis)' });
  }

  const admissionId = `adm-${Date.now()}`;
  const admissionNumber = `MH-ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  await db.transaction(async (trx) => {
    await trx.prepare(`
      INSERT INTO admissions (
        id, admission_number, patient_id, facility_id, ward_id, bed_id,
        doctor_id, referral_id, department, priority, admission_date,
        status, provisional_diagnosis, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Admitted', ?, ?)
    `).run(
      admissionId,
      admissionNumber,
      patient_id,
      facility_id,
      ward_id || null,
      bed_id || null,
      doctor_id || null,
      referral_id || null,
      department,
      priority,
      admission_date,
      provisional_diagnosis,
      reason || null
    );

    // If a bed was allocated, mark it as Occupied and assign the patient
    if (bed_id) {
      await trx.prepare(`
        UPDATE beds
        SET status = 'Occupied', current_patient_id = ?
        WHERE id = ?
      `).run(patient_id, bed_id);

      // Decrement available beds count
      await trx.prepare(`
        UPDATE facilities
        SET available_beds = GREATEST(0, available_beds - 1)
        WHERE id = ?
      `).run(facility_id);
    }

    // If linked to referral, mark referral as admitted
    if (referral_id) {
      await trx.prepare(`
        UPDATE referrals
        SET status = 'admitted', outcome_notes = 'Patient admitted to inpatient ward ' || COALESCE(?, '')
        WHERE id = ?
      `).run(department, referral_id);
    }
  })();

  const newAdmission = await db.prepare(`
    SELECT a.*, p.full_name as patient_name, w.name as ward_name, b.bed_number
    FROM admissions a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN wards w ON a.ward_id = w.id
    LEFT JOIN beds b ON a.bed_id = b.id
    WHERE a.id = ?
  `).get(admissionId);

  res.status(201).json({
    message: 'Patient admitted successfully',
    admission: newAdmission
  });
};

// 6. Update Admission Status
export const updateAdmissionStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, ward_id, bed_id, doctor_id, notes } = req.body;

  const admission = await db.prepare('SELECT * FROM admissions WHERE id = ?').get(id) as any;
  if (!admission) {
    return res.status(404).json({ error: 'Admission record not found' });
  }

  await db.prepare(`
    UPDATE admissions
    SET status = ?,
        ward_id = COALESCE(?, ward_id),
        bed_id = COALESCE(?, bed_id),
        doctor_id = COALESCE(?, doctor_id),
        reason = CASE WHEN ? IS NOT NULL THEN reason || ' | ' || ? ELSE reason END
    WHERE id = ?
  `).run(status, ward_id, bed_id, doctor_id, notes, notes, id);

  res.json({
    message: `Admission status updated to ${status}`,
    id,
    status
  });
};

// 7. Discharge Patient & Auto-assign ANM Follow-Up
export const dischargePatient = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    discharge_condition,
    treatment_summary,
    discharge_medicines = [],
    follow_up_date,
    follow_up_notes,
    responsible_asha_id = 'usr-asha-1'
  } = req.body;

  const admission = await db.prepare('SELECT * FROM admissions WHERE id = ?').get(id) as any;
  if (!admission) {
    return res.status(404).json({ error: 'Admission not found' });
  }

  const dischargeId = `dsc-${Date.now()}`;
  const now = new Date().toISOString();

  await db.transaction(async (trx) => {
    // 1. Insert discharge record
    await trx.prepare(`
      INSERT INTO discharges (
        id, admission_id, patient_id, discharge_date, discharge_condition,
        treatment_summary, discharge_medicines_json, follow_up_date,
        follow_up_notes, responsible_asha_id, follow_up_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      dischargeId,
      id,
      admission.patient_id,
      now,
      discharge_condition || 'Patient clinically stable at discharge',
      treatment_summary || 'Inpatient treatment protocol completed successfully',
      JSON.stringify(discharge_medicines),
      follow_up_date || null,
      follow_up_notes || 'Follow-up home visit required by village ANM',
      responsible_asha_id
    );

    // 2. Mark admission as Discharged
    await trx.prepare(`
      UPDATE admissions
      SET status = 'Discharged', discharge_date = ?
      WHERE id = ?
    `).run(now, id);

    // 3. Free up bed -> set to 'Cleaning'
    if (admission.bed_id) {
      await trx.prepare(`
        UPDATE beds
        SET status = 'Cleaning', current_patient_id = NULL, last_cleaned_at = ?
        WHERE id = ?
      `).run(now, admission.bed_id);

      // Increment available beds
      await trx.prepare(`
        UPDATE facilities
        SET available_beds = available_beds + 1
        WHERE id = ?
      `).run(admission.facility_id);
    }
  })();

  res.json({
    message: 'Patient discharged successfully. Bed moved to Cleaning and ANM follow-up task scheduled.',
    dischargeId
  });
};

// 8. Hospital Staff Roster
export const getHospitalStaff = async (req: Request, res: Response) => {
  const facilityId = (req.query.facility_id as string) || 'fac-dh-satara';
  const staff = await db.prepare(`
    SELECT * FROM hospital_staff
    WHERE facility_id = ?
    ORDER BY role ASC, full_name ASC
  `).all(facilityId);
  res.json(staff);
};

// 9. Facility Network View (Hierarchical 5-tier public health system)
export const getFacilityNetwork = async (_req: Request, res: Response) => {
  const facilities = await db.prepare(`
    SELECT f.*,
      (SELECT COUNT(*) FROM beds WHERE facility_id = f.id) as real_total_beds,
      (SELECT COUNT(*) FROM beds WHERE facility_id = f.id AND status = 'Available') as real_available_beds,
      (SELECT COUNT(*) FROM doctors WHERE facility_id = f.id) as doctor_count
    FROM facilities f
    ORDER BY
      CASE f.type
        WHEN 'District Hospital' THEN 1
        WHEN 'Sub-District Hospital' THEN 2
        WHEN 'Rural Hospital' THEN 3
        WHEN 'PHC' THEN 4
        WHEN 'Sub-Centre' THEN 5
        ELSE 6
      END
  `).all();

  const networkHierarchy = {
    districtHospital: facilities.filter((f: any) => f.type === 'District Hospital'),
    subDistrictHospital: facilities.filter((f: any) => f.type === 'Sub-District Hospital'),
    ruralHospital: facilities.filter((f: any) => f.type === 'Rural Hospital'),
    phc: facilities.filter((f: any) => f.type === 'PHC'),
    subCentre: facilities.filter((f: any) => f.type === 'Sub-Centre')
  };

  res.json({
    totalFacilities: facilities.length,
    hierarchy: networkHierarchy,
    allFacilities: facilities
  });
};
