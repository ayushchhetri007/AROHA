"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFacilityNetwork = exports.getHospitalStaff = exports.dischargePatient = exports.updateAdmissionStatus = exports.createAdmission = exports.getAdmissions = exports.updateBedStatus = exports.getWardsAndBeds = exports.getHospitalOverview = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
// 1. Hospital Overview Metrics
const getHospitalOverview = (req, res) => {
    const facilityId = req.query.facility_id || 'fac-dh-satara';
    const facility = db_js_1.default.prepare('SELECT * FROM facilities WHERE id = ?').get(facilityId);
    if (!facility) {
        return res.status(404).json({ error: 'Facility not found' });
    }
    // Bed breakdown
    const bedStats = db_js_1.default.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
      SUM(CASE WHEN status = 'Reserved' THEN 1 ELSE 0 END) as reserved,
      SUM(CASE WHEN status = 'Cleaning' THEN 1 ELSE 0 END) as cleaning,
      SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
    FROM beds
    WHERE facility_id = ?
  `).get(facilityId);
    // Admissions today
    const todayAdmissions = db_js_1.default.prepare(`
    SELECT COUNT(*) as count
    FROM admissions
    WHERE facility_id = ? AND date(admission_date) = date('now')
  `).get(facilityId);
    // Discharges today
    const todayDischarges = db_js_1.default.prepare(`
    SELECT COUNT(*) as count
    FROM discharges d
    JOIN admissions a ON d.admission_id = a.id
    WHERE a.facility_id = ? AND date(d.discharge_date) = date('now')
  `).get(facilityId);
    // Live OPD Queue count
    const opdQueue = db_js_1.default.prepare(`
    SELECT COUNT(*) as count
    FROM queue_tokens
    WHERE facility_id = ? AND status IN ('waiting', 'called', 'in_progress')
  `).get(facilityId);
    // Pending incoming referrals
    const pendingReferrals = db_js_1.default.prepare(`
    SELECT COUNT(*) as count
    FROM referrals
    WHERE receiving_facility_id = ? AND status IN ('created', 'accepted', 'pending')
  `).get(facilityId);
    // ICU / Emergency capacity
    const emergencyBeds = db_js_1.default.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available
    FROM beds b
    JOIN wards w ON b.ward_id = w.id
    WHERE b.facility_id = ? AND (w.department LIKE '%Critical%' OR w.department LIKE '%Emergency%' OR w.name LIKE '%ICU%')
  `).get(facilityId);
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
exports.getHospitalOverview = getHospitalOverview;
// 2. Get Wards and Beds
const getWardsAndBeds = (req, res) => {
    const facilityId = req.query.facility_id || 'fac-dh-satara';
    const wards = db_js_1.default.prepare(`
    SELECT * FROM wards WHERE facility_id = ? ORDER BY name ASC
  `).all(facilityId);
    const beds = db_js_1.default.prepare(`
    SELECT b.*, w.name as ward_name, w.department as ward_department, p.full_name as patient_name, p.age as patient_age, p.gender as patient_gender
    FROM beds b
    JOIN wards w ON b.ward_id = w.id
    LEFT JOIN patients p ON b.current_patient_id = p.id
    WHERE b.facility_id = ?
    ORDER BY b.room_number ASC, b.bed_number ASC
  `).all(facilityId);
    res.json({
        facility_id: facilityId,
        wards,
        beds
    });
};
exports.getWardsAndBeds = getWardsAndBeds;
// 3. Update Bed Status
const updateBedStatus = (req, res) => {
    const { id } = req.params;
    const { status, current_patient_id, notes } = req.body;
    const bed = db_js_1.default.prepare('SELECT * FROM beds WHERE id = ?').get(id);
    if (!bed) {
        return res.status(404).json({ error: 'Bed not found' });
    }
    const patientId = status === 'Available' ? null : (current_patient_id !== undefined ? current_patient_id : bed.current_patient_id);
    const cleanedAt = status === 'Available' ? new Date().toISOString() : bed.last_cleaned_at;
    db_js_1.default.prepare(`
    UPDATE beds
    SET status = ?, current_patient_id = ?, last_cleaned_at = ?, notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(status, patientId, cleanedAt, notes, id);
    // Sync available_beds count on facilities table
    const countRes = db_js_1.default.prepare(`
    SELECT COUNT(*) as available FROM beds WHERE facility_id = ? AND status = 'Available'
  `).get(bed.facility_id);
    if (countRes) {
        db_js_1.default.prepare('UPDATE facilities SET available_beds = ? WHERE id = ?').run(countRes.available, bed.facility_id);
    }
    const updated = db_js_1.default.prepare(`
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
exports.updateBedStatus = updateBedStatus;
// 4. Get Admissions
const getAdmissions = (req, res) => {
    const facilityId = req.query.facility_id || 'fac-dh-satara';
    const status = req.query.status;
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
    const params = [facilityId];
    if (status && status !== 'ALL') {
        query += ' AND a.status = ?';
        params.push(status);
    }
    query += ' ORDER BY a.admission_date DESC';
    const admissions = db_js_1.default.prepare(query).all(...params);
    res.json(admissions);
};
exports.getAdmissions = getAdmissions;
// 5. Create Admission
const createAdmission = (req, res) => {
    const { patient_id, facility_id, ward_id, bed_id, doctor_id, referral_id, department, priority = 'Normal', provisional_diagnosis, reason, admission_date = new Date().toISOString() } = req.body;
    if (!patient_id || !facility_id || !department || !provisional_diagnosis) {
        return res.status(400).json({ error: 'Missing required admission fields (patient_id, facility_id, department, provisional_diagnosis)' });
    }
    const admissionId = `adm-${Date.now()}`;
    const admissionNumber = `MH-ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    db_js_1.default.transaction(() => {
        db_js_1.default.prepare(`
      INSERT INTO admissions (
        id, admission_number, patient_id, facility_id, ward_id, bed_id,
        doctor_id, referral_id, department, priority, admission_date,
        status, provisional_diagnosis, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Admitted', ?, ?)
    `).run(admissionId, admissionNumber, patient_id, facility_id, ward_id || null, bed_id || null, doctor_id || null, referral_id || null, department, priority, admission_date, provisional_diagnosis, reason || null);
        // If a bed was allocated, mark it as Occupied and assign the patient
        if (bed_id) {
            db_js_1.default.prepare(`
        UPDATE beds
        SET status = 'Occupied', current_patient_id = ?
        WHERE id = ?
      `).run(patient_id, bed_id);
            // Decrement available beds count
            db_js_1.default.prepare(`
        UPDATE facilities
        SET available_beds = MAX(0, available_beds - 1)
        WHERE id = ?
      `).run(facility_id);
        }
        // If linked to referral, mark referral as admitted
        if (referral_id) {
            db_js_1.default.prepare(`
        UPDATE referrals
        SET status = 'admitted', outcome_notes = 'Patient admitted to inpatient ward ' || COALESCE(?, '')
        WHERE id = ?
      `).run(department, referral_id);
        }
    })();
    const newAdmission = db_js_1.default.prepare(`
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
exports.createAdmission = createAdmission;
// 6. Update Admission Status
const updateAdmissionStatus = (req, res) => {
    const { id } = req.params;
    const { status, ward_id, bed_id, doctor_id, notes } = req.body;
    const admission = db_js_1.default.prepare('SELECT * FROM admissions WHERE id = ?').get(id);
    if (!admission) {
        return res.status(404).json({ error: 'Admission record not found' });
    }
    db_js_1.default.prepare(`
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
exports.updateAdmissionStatus = updateAdmissionStatus;
// 7. Discharge Patient & Auto-assign ANM Follow-Up
const dischargePatient = (req, res) => {
    const { id } = req.params;
    const { discharge_condition, treatment_summary, discharge_medicines = [], follow_up_date, follow_up_notes, responsible_asha_id = 'usr-asha-1' } = req.body;
    const admission = db_js_1.default.prepare('SELECT * FROM admissions WHERE id = ?').get(id);
    if (!admission) {
        return res.status(404).json({ error: 'Admission not found' });
    }
    const dischargeId = `dsc-${Date.now()}`;
    const now = new Date().toISOString();
    db_js_1.default.transaction(() => {
        // 1. Insert discharge record
        db_js_1.default.prepare(`
      INSERT INTO discharges (
        id, admission_id, patient_id, discharge_date, discharge_condition,
        treatment_summary, discharge_medicines_json, follow_up_date,
        follow_up_notes, responsible_asha_id, follow_up_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(dischargeId, id, admission.patient_id, now, discharge_condition || 'Patient clinically stable at discharge', treatment_summary || 'Inpatient treatment protocol completed successfully', JSON.stringify(discharge_medicines), follow_up_date || null, follow_up_notes || 'Follow-up home visit required by village ANM', responsible_asha_id);
        // 2. Mark admission as Discharged
        db_js_1.default.prepare(`
      UPDATE admissions
      SET status = 'Discharged', discharge_date = ?
      WHERE id = ?
    `).run(now, id);
        // 3. Free up bed -> set to 'Cleaning'
        if (admission.bed_id) {
            db_js_1.default.prepare(`
        UPDATE beds
        SET status = 'Cleaning', current_patient_id = NULL, last_cleaned_at = ?
        WHERE id = ?
      `).run(now, admission.bed_id);
            // Increment available beds
            db_js_1.default.prepare(`
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
exports.dischargePatient = dischargePatient;
// 8. Hospital Staff Roster
const getHospitalStaff = (req, res) => {
    const facilityId = req.query.facility_id || 'fac-dh-satara';
    const staff = db_js_1.default.prepare(`
    SELECT * FROM hospital_staff
    WHERE facility_id = ?
    ORDER BY role ASC, full_name ASC
  `).all(facilityId);
    res.json(staff);
};
exports.getHospitalStaff = getHospitalStaff;
// 9. Facility Network View (Hierarchical 5-tier public health system)
const getFacilityNetwork = (_req, res) => {
    const facilities = db_js_1.default.prepare(`
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
        districtHospital: facilities.filter((f) => f.type === 'District Hospital'),
        subDistrictHospital: facilities.filter((f) => f.type === 'Sub-District Hospital'),
        ruralHospital: facilities.filter((f) => f.type === 'Rural Hospital'),
        phc: facilities.filter((f) => f.type === 'PHC'),
        subCentre: facilities.filter((f) => f.type === 'Sub-Centre')
    };
    res.json({
        totalFacilities: facilities.length,
        hierarchy: networkHierarchy,
        allFacilities: facilities
    });
};
exports.getFacilityNetwork = getFacilityNetwork;
