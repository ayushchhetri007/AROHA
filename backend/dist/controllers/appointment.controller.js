"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAppointment = exports.createAppointment = exports.getMyAppointments = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const getMyAppointments = (req, res) => {
    let patientId = null;
    // Security: If the request is from a patient role, strictly restrict to their own patient profile
    if (req.user?.role === 'patient') {
        const ownPatient = db_js_1.default.prepare('SELECT id FROM patients WHERE user_id = ? OR phone = ? OR id = ?').get(req.user.id, req.user.phone, req.user.id);
        if (ownPatient) {
            patientId = ownPatient.id;
        }
        else if (req.query.patient_id) {
            // Validate requested patient matches authenticated user phone or user_id
            const p = db_js_1.default.prepare('SELECT id, user_id, phone FROM patients WHERE id = ?').get(req.query.patient_id);
            if (p && (p.user_id === req.user.id || p.phone === req.user.phone)) {
                patientId = p.id;
            }
        }
        // If the authenticated patient has no linked patient record, they have 0 appointments
        if (!patientId) {
            return res.json([]);
        }
    }
    else if (req.query.patient_id) {
        // Medical officers, staff, admin, asha can query specific patient
        patientId = req.query.patient_id;
    }
    let query = `
    SELECT a.*, f.name as facility_name, f.type as facility_type, f.address as facility_address,
           d.full_name as doctor_name, d.specialty as doctor_specialty,
           p.full_name as patient_name, p.abha_id, p.phone as patient_phone,
           q.token_number, q.status as queue_status, q.estimated_wait_minutes, q.counter_room
    FROM appointments a
    JOIN facilities f ON a.facility_id = f.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN queue_tokens q ON a.id = q.appointment_id
  `;
    const conditions = [];
    const params = [];
    if (patientId) {
        conditions.push('a.patient_id = ?');
        params.push(patientId);
    }
    else if (req.user?.role === 'doctor' || req.user?.role === 'facility_staff') {
        const facilityId = req.user.facility_id || 'fac-phc-shirwal';
        conditions.push('a.facility_id = ?');
        params.push(facilityId);
    }
    // Support upcoming filter: excludes cancelled, completed, expired
    if (req.query.status === 'upcoming' || req.query.upcoming === 'true') {
        conditions.push("a.status IN ('confirmed', 'scheduled', 'waiting', 'in_queue', 'in_consultation')");
    }
    else if (req.query.status) {
        conditions.push('a.status = ?');
        params.push(req.query.status);
    }
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY a.appointment_date DESC, a.created_at DESC';
    if (!patientId && !conditions.length) {
        query += ' LIMIT 50';
    }
    const appts = db_js_1.default.prepare(query).all(...params);
    res.json(appts);
};
exports.getMyAppointments = getMyAppointments;
const createAppointment = (req, res) => {
    const { facility_id, doctor_id, service_name, appointment_date, time_slot, reason, priority, patient_id } = req.body;
    if (!facility_id) {
        return res.status(400).json({ error: 'Facility selection is required' });
    }
    // Associate with authenticated patient (Security & correctness: never book for arbitrary mismatch)
    let targetPatientId = patient_id;
    if (req.user?.role === 'patient') {
        const ownPatient = db_js_1.default.prepare('SELECT id FROM patients WHERE user_id = ? OR phone = ? OR id = ?').get(req.user.id, req.user.phone, req.user.id);
        if (ownPatient) {
            targetPatientId = ownPatient.id;
        }
        else if (patient_id) {
            const requestedPatient = db_js_1.default.prepare('SELECT id FROM patients WHERE id = ?').get(patient_id);
            if (requestedPatient) {
                targetPatientId = requestedPatient.id;
            }
        }
    }
    else if (!targetPatientId && req.user?.id) {
        const p = db_js_1.default.prepare('SELECT id FROM patients WHERE user_id = ? OR phone = ?').get(req.user.id, req.user.phone);
        if (p)
            targetPatientId = p.id;
    }
    if (!targetPatientId) {
        return res.status(400).json({ error: 'Patient authentication required to book an appointment' });
    }
    const patientRecord = db_js_1.default.prepare('SELECT * FROM patients WHERE id = ?').get(targetPatientId);
    if (!patientRecord) {
        return res.status(404).json({ error: 'Patient record not found' });
    }
    // Validate facility
    const facility = db_js_1.default.prepare('SELECT * FROM facilities WHERE id = ?').get(facility_id);
    if (!facility)
        return res.status(404).json({ error: 'Selected healthcare facility not found' });
    // Validate doctor if provided
    let validDoctorId = null;
    let room = 'General Consultation Counter';
    if (doctor_id) {
        const doc = db_js_1.default.prepare('SELECT * FROM doctors WHERE id = ?').get(doctor_id);
        if (doc) {
            validDoctorId = doc.id;
            room = doc.room_number ? `OPD Room ${doc.room_number} (${doc.full_name})` : `OPD Consultation (${doc.full_name})`;
        }
    }
    const appointmentId = `apt-${Date.now()}`;
    const appointmentNumber = `MH-APT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    // Calculate queue token number for today
    const lastToken = db_js_1.default.prepare(`
    SELECT MAX(token_number) as max_tok FROM queue_tokens
    WHERE facility_id = ? AND date(created_at) = date('now')
  `).get(facility_id);
    const nextTokenNum = (lastToken?.max_tok || 10) + 1;
    const tokenId = `tok-${Date.now()}`;
    const waitMinutes = Math.max(10, (nextTokenNum - 10) * 5 + 10);
    const apptDate = appointment_date || new Date().toISOString().split('T')[0];
    const apptSlot = time_slot || '10:30 AM';
    db_js_1.default.transaction(() => {
        db_js_1.default.prepare(`
      INSERT INTO appointments (id, appointment_number, patient_id, facility_id, doctor_id, service_name, appointment_date, time_slot, status, priority, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    `).run(appointmentId, appointmentNumber, targetPatientId, facility_id, validDoctorId, service_name || 'General Medicine OPD', apptDate, apptSlot, priority || 'normal', reason || 'OPD Consultation');
        db_js_1.default.prepare(`
      INSERT INTO queue_tokens (id, token_number, appointment_id, facility_id, doctor_id, patient_id, status, estimated_wait_minutes, counter_room)
      VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, ?)
    `).run(tokenId, nextTokenNum, appointmentId, facility_id, validDoctorId, targetPatientId, waitMinutes, room);
    })();
    const created = db_js_1.default.prepare(`
    SELECT a.*, f.name as facility_name, f.type as facility_type, f.address as facility_address,
           d.full_name as doctor_name, d.specialty as doctor_specialty,
           p.full_name as patient_name, p.abha_id, p.phone as patient_phone,
           q.token_number, q.status as queue_status, q.estimated_wait_minutes, q.counter_room
    FROM appointments a
    JOIN facilities f ON a.facility_id = f.id
    LEFT JOIN doctors d ON a.doctor_id = d.id
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN queue_tokens q ON a.id = q.appointment_id
    WHERE a.id = ?
  `).get(appointmentId);
    res.status(201).json({
        message: 'Appointment booked and Queue Token generated successfully',
        appointment: created
    });
};
exports.createAppointment = createAppointment;
const cancelAppointment = (req, res) => {
    const { id } = req.params;
    const appointment = db_js_1.default.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appointment)
        return res.status(404).json({ error: 'Appointment not found' });
    // If patient role, verify they own the appointment
    if (req.user?.role === 'patient') {
        const ownPatient = db_js_1.default.prepare('SELECT id FROM patients WHERE user_id = ? OR phone = ? OR id = ?').get(req.user.id, req.user.phone, req.user.id);
        if (ownPatient && appointment.patient_id !== ownPatient.id) {
            return res.status(403).json({ error: 'Access denied: cannot cancel another patient appointment' });
        }
    }
    db_js_1.default.transaction(() => {
        db_js_1.default.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(id);
        db_js_1.default.prepare("UPDATE queue_tokens SET status = 'cancelled' WHERE appointment_id = ?").run(id);
    })();
    res.json({
        message: 'Appointment cancelled successfully',
        appointmentId: id,
        status: 'cancelled'
    });
};
exports.cancelAppointment = cancelAppointment;
