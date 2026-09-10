"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthAssessments = exports.saveHealthAssessment = exports.createConsultation = exports.getPatientTimeline = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const getPatientTimeline = async (req, res) => {
    let patientId = req.params.patientId;
    // Security check: If authenticated user is a patient, verify they only access their own records
    if (req.user && req.user.role === 'patient') {
        const matchingPatient = await db_js_1.default.prepare('SELECT id FROM patients WHERE id = ? AND (user_id = ? OR phone = ?)').get(patientId, req.user.id, req.user.phone);
        let ownPatient = matchingPatient;
        if (!ownPatient) {
            ownPatient = await db_js_1.default.prepare('SELECT id FROM patients WHERE phone = ? OR user_id = ? OR id = ?').get(req.user.phone, req.user.id, req.user.id);
        }
        if (ownPatient) {
            if (patientId && patientId !== ownPatient.id && !matchingPatient) {
                return res.status(403).json({ error: 'Access denied: You can only view your own health records.' });
            }
            if (!patientId) {
                patientId = ownPatient.id;
            }
        }
    }
    if (!patientId) {
        patientId = 'pat-meera';
    }
    const patient = await db_js_1.default.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!patient)
        return res.status(404).json({ error: 'Patient not found' });
    const maternal = await db_js_1.default.prepare('SELECT * FROM maternal_records WHERE patient_id = ?').get(patientId);
    const child = await db_js_1.default.prepare('SELECT * FROM child_health_records WHERE patient_id = ?').get(patientId);
    const chronic = await db_js_1.default.prepare('SELECT * FROM chronic_care_records WHERE patient_id = ?').get(patientId);
    const family = await db_js_1.default.prepare('SELECT * FROM family_members WHERE patient_id = ?').all(patientId);
    // Consultations with prescriptions and ordering doctor (LEFT JOINs ensure no records dropped)
    const consultations = await db_js_1.default.prepare(`
    SELECT c.*, d.full_name as doctor_name, d.specialty as doctor_specialty, f.name as facility_name,
           p.medicines_json, p.instructions as rx_instructions
    FROM consultations c
    LEFT JOIN doctors d ON c.doctor_id = d.id
    LEFT JOIN facilities f ON c.facility_id = f.id
    LEFT JOIN prescriptions p ON c.id = p.consultation_id
    WHERE c.patient_id = ?
    ORDER BY c.created_at DESC
  `).all(patientId);
    // Diagnostic tests
    const diagnostics = await db_js_1.default.prepare(`
    SELECT dt.*, f.name as facility_name
    FROM diagnostic_tests dt
    LEFT JOIN facilities f ON dt.facility_id = f.id
    WHERE dt.patient_id = ?
    ORDER BY dt.created_at DESC
  `).all(patientId);
    // Referrals
    const referrals = await db_js_1.default.prepare(`
    SELECT r.*,
           rf.name as referring_facility_name,
           rec.name as receiving_facility_name,
           d.full_name as referring_doctor_name
    FROM referrals r
    LEFT JOIN facilities rf ON r.referring_facility_id = rf.id
    LEFT JOIN facilities rec ON r.receiving_facility_id = rec.id
    LEFT JOIN doctors d ON r.referring_doctor_id = d.id
    WHERE r.patient_id = ?
    ORDER BY r.created_at DESC
  `).all(patientId);
    // Home Visits
    const homeVisits = await db_js_1.default.prepare(`
    SELECT hv.*, u.full_name as asha_name
    FROM home_visits hv
    LEFT JOIN users u ON hv.asha_id = u.id
    WHERE hv.patient_id = ?
    ORDER BY hv.visit_date DESC
  `).all(patientId);
    // Hospital Admissions & Discharges
    const admissions = await db_js_1.default.prepare(`
    SELECT a.*, f.name as facility_name, w.name as ward_name, b.bed_number, b.room_number,
           d.full_name as doctor_name,
           dsc.discharge_condition, dsc.treatment_summary, dsc.discharge_medicines_json, dsc.follow_up_date, dsc.follow_up_notes
    FROM admissions a
    LEFT JOIN facilities f ON a.facility_id = f.id
    LEFT JOIN wards w ON a.ward_id = w.id
    LEFT JOIN beds b ON a.bed_id = b.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    LEFT JOIN discharges dsc ON a.id = dsc.admission_id
    WHERE a.patient_id = ?
    ORDER BY a.admission_date DESC
  `).all(patientId);
    // Prescriptions list
    const prescriptions = await db_js_1.default.prepare(`
    SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty, f.name as facility_name, c.diagnosis
    FROM prescriptions p
    LEFT JOIN doctors d ON p.doctor_id = d.id
    LEFT JOIN consultations c ON p.consultation_id = c.id
    LEFT JOIN facilities f ON c.facility_id = f.id
    WHERE p.patient_id = ?
    ORDER BY p.created_at DESC
  `).all(patientId);
    // Health Assessments
    const assessments = await db_js_1.default.prepare(`
    SELECT ha.*, f.name as facility_name
    FROM health_assessments ha
    LEFT JOIN facilities f ON ha.recommended_facility_id = f.id
    WHERE ha.patient_id = ?
    ORDER BY ha.created_at DESC
  `).all(patientId);
    res.json({
        patient,
        maternal,
        child,
        chronic,
        family,
        consultations,
        diagnostics,
        referrals,
        homeVisits,
        admissions,
        prescriptions,
        assessments
    });
};
exports.getPatientTimeline = getPatientTimeline;
const createConsultation = async (req, res) => {
    const { appointment_id, patient_id, doctor_id, facility_id, symptoms, diagnosis, vitals, clinical_notes, follow_up_date, prescriptions, // array of { name, dosage, frequency, days, instructions }
    diagnostic_tests, // array of { test_name, category, priority }
    referral // optional { receiving_facility_id, specialty_required, priority, clinical_reason, summary, target_date }
     } = req.body;
    const consultationId = `cns-${Date.now()}`;
    const docId = doctor_id || 'doc-1';
    const facId = facility_id || 'fac-phc-shirwal';
    await db_js_1.default.transaction(async (trx) => {
        // 1. Insert Consultation
        await trx.prepare(`
      INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, facility_id, symptoms, diagnosis, vitals_json, clinical_notes, follow_up_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(consultationId, appointment_id || `apt-temp-${Date.now()}`, patient_id, docId, facId, symptoms || 'General weakness and fatigue', diagnosis || 'Clinical evaluation completed', JSON.stringify(vitals || { bp: '118/76', pulse: '76', spo2: '98%', temp: '98.4 F', weight: '54 kg' }), clinical_notes || '', follow_up_date || null);
        // 2. Insert Prescription
        if (prescriptions && prescriptions.length > 0) {
            await trx.prepare(`
        INSERT INTO prescriptions (id, consultation_id, patient_id, doctor_id, medicines_json, instructions)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`rx-${Date.now()}`, consultationId, patient_id, docId, JSON.stringify(prescriptions), 'Follow prescribed dosage schedule diligently. Hydrate well.');
        }
        // 3. Insert Diagnostic Tests
        if (diagnostic_tests && diagnostic_tests.length > 0) {
            const insertDiag = trx.prepare(`
        INSERT INTO diagnostic_tests (id, consultation_id, patient_id, facility_id, test_name, category, priority, status, turnaround_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ordered', ?)
      `);
            for (const t of diagnostic_tests) {
                await insertDiag.run(`dt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, consultationId, patient_id, facId, t.test_name, t.category || 'General', t.priority || 'routine', t.turnaround_time || '2-4 hours');
            }
        }
        // 4. Insert Referral if requested
        if (referral && referral.receiving_facility_id) {
            const refId = `ref-${Date.now()}`;
            const refCode = `MH-REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await trx.prepare(`
        INSERT INTO referrals (id, referral_code, patient_id, referring_facility_id, referring_doctor_id, receiving_facility_id, specialty_required, priority, clinical_reason, summary, status, target_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?)
      `).run(refId, refCode, patient_id, facId, docId, referral.receiving_facility_id, referral.specialty_required || 'Specialist Evaluation', referral.priority || 'priority', referral.clinical_reason || 'Requires tertiary care evaluation', referral.summary || clinical_notes || 'Inter-facility clinical referral', referral.target_date || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
            await trx.prepare(`
        INSERT INTO referral_events (id, referral_id, event_type, description, actor_role)
        VALUES (?, ?, 'Referral Created', 'Referral generated by doctor at primary facility', 'doctor')
      `).run(`re-${Date.now()}`, refId);
        }
        // 5. Complete Appointment & Queue token
        if (appointment_id) {
            await trx.prepare("UPDATE appointments SET status = 'completed' WHERE id = ?").run(appointment_id);
            await trx.prepare("UPDATE queue_tokens SET status = 'completed' WHERE appointment_id = ?").run(appointment_id);
        }
    })();
    res.status(201).json({
        message: 'Consultation saved, prescription created, and care coordination synchronized successfully',
        consultationId
    });
};
exports.createConsultation = createConsultation;
const saveHealthAssessment = async (req, res) => {
    const patientId = req.body.patientId || req.body.patient_id;
    const symptoms = req.body.symptoms || req.body.symptoms_json || [];
    const triageLevel = req.body.triageLevel || req.body.triage_level || 'PRIMARY CARE';
    const recommendation = req.body.recommendation || 'Evaluation recommended';
    const recommendedFacilityId = req.body.recommendedFacilityId || req.body.recommended_facility_id || null;
    const emergencyFlag = req.body.emergencyFlag !== undefined ? req.body.emergencyFlag : req.body.emergency_flag;
    let targetPatientId = patientId;
    if (!targetPatientId && req.user?.id) {
        const p = await db_js_1.default.prepare('SELECT id FROM patients WHERE user_id = ? OR id = ?').get(req.user.id, req.user.id);
        if (p)
            targetPatientId = p.id;
    }
    if (!targetPatientId) {
        targetPatientId = req.user?.id || 'P-10452';
    }
    const assessmentId = `asm-${Date.now()}`;
    await db_js_1.default.prepare(`
    INSERT INTO health_assessments (
      id, patient_id, symptoms_json, triage_level,
      recommendation, recommended_facility_id, emergency_flag
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(assessmentId, targetPatientId, typeof symptoms === 'string' ? symptoms : JSON.stringify(symptoms), triageLevel, recommendation, recommendedFacilityId, emergencyFlag ? 1 : 0);
    const assessment = await db_js_1.default.prepare('SELECT * FROM health_assessments WHERE id = ?').get(assessmentId);
    res.status(201).json({
        message: 'Health assessment recorded successfully into longitudinal record',
        assessment
    });
};
exports.saveHealthAssessment = saveHealthAssessment;
const getHealthAssessments = async (req, res) => {
    let targetPatientId = req.params.patientId;
    if (!targetPatientId || targetPatientId === 'current') {
        if (req.user?.id) {
            const p = await db_js_1.default.prepare('SELECT id FROM patients WHERE user_id = ? OR id = ?').get(req.user.id, req.user.id);
            targetPatientId = p ? p.id : req.user.id;
        }
    }
    if (!targetPatientId || targetPatientId === 'undefined' || targetPatientId === 'null') {
        return res.json([]);
    }
    const assessments = await db_js_1.default.prepare(`
    SELECT h.*, f.name as facility_name, f.type as facility_type
    FROM health_assessments h
    LEFT JOIN facilities f ON h.recommended_facility_id = f.id
    WHERE h.patient_id = ? OR h.patient_id = (SELECT id FROM patients WHERE user_id = ? LIMIT 1)
    ORDER BY h.created_at DESC, h.id DESC
  `).all(targetPatientId, targetPatientId);
    res.json(assessments);
};
exports.getHealthAssessments = getHealthAssessments;
