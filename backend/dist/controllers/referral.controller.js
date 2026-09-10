"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReferralStatus = exports.getReferralById = exports.getAllReferrals = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const getAllReferrals = async (req, res) => {
    const { status, facility_id } = req.query;
    let patient_id = req.query.patient_id;
    // Security: If the request is from a patient role, strictly restrict to their own patient profile
    if (req.user?.role === 'patient') {
        const ownPatient = await db_js_1.default.prepare('SELECT id FROM patients WHERE user_id = ? OR phone = ? OR id = ?').get(req.user.id, req.user.phone, req.user.id);
        if (ownPatient) {
            patient_id = ownPatient.id;
        }
        else if (patient_id) {
            const p = await db_js_1.default.prepare('SELECT id, user_id, phone FROM patients WHERE id = ?').get(patient_id);
            if (p && (p.user_id === req.user.id || p.phone === req.user.phone)) {
                patient_id = p.id;
            }
            else {
                return res.json([]);
            }
        }
        else {
            return res.json([]);
        }
    }
    let query = `
    SELECT r.*,
           p.full_name as patient_name, p.age, p.gender, p.village, p.phone as patient_phone, p.abha_id,
           rf.name as referring_facility_name, rf.type as referring_facility_type,
           rec.name as receiving_facility_name, rec.type as receiving_facility_type,
           d.full_name as referring_doctor_name
    FROM referrals r
    JOIN patients p ON r.patient_id = p.id
    JOIN facilities rf ON r.referring_facility_id = rf.id
    JOIN facilities rec ON r.receiving_facility_id = rec.id
    JOIN doctors d ON r.referring_doctor_id = d.id
    WHERE 1=1
  `;
    const params = [];
    if (status) {
        query += ' AND r.status = ?';
        params.push(status);
    }
    if (facility_id) {
        query += ' AND (r.referring_facility_id = ? OR r.receiving_facility_id = ?)';
        params.push(facility_id, facility_id);
    }
    if (patient_id) {
        query += ' AND r.patient_id = ?';
        params.push(patient_id);
    }
    query += ' ORDER BY r.created_at DESC';
    const referrals = await db_js_1.default.prepare(query).all(...params);
    res.json(referrals);
};
exports.getAllReferrals = getAllReferrals;
const getReferralById = async (req, res) => {
    const { id } = req.params;
    const referral = await db_js_1.default.prepare(`
    SELECT r.*,
           p.full_name as patient_name, p.age, p.gender, p.village, p.phone as patient_phone, p.abha_id,
           rf.name as referring_facility_name, rf.address as referring_address,
           rec.name as receiving_facility_name, rec.address as receiving_address,
           d.full_name as referring_doctor_name
    FROM referrals r
    JOIN patients p ON r.patient_id = p.id
    JOIN facilities rf ON r.referring_facility_id = rf.id
    JOIN facilities rec ON r.receiving_facility_id = rec.id
    JOIN doctors d ON r.referring_doctor_id = d.id
    WHERE r.id = ?
  `).get(id);
    if (!referral)
        return res.status(404).json({ error: 'Referral not found' });
    const events = await db_js_1.default.prepare('SELECT * FROM referral_events WHERE referral_id = ? ORDER BY timestamp ASC').all(id);
    res.json({
        referral,
        events
    });
};
exports.getReferralById = getReferralById;
const updateReferralStatus = async (req, res) => {
    const { id } = req.params;
    const { status, outcome_notes, actor_role } = req.body;
    await db_js_1.default.transaction(async (trx) => {
        await trx.prepare(`
      UPDATE referrals
      SET status = ?, outcome_notes = COALESCE(?, outcome_notes),
          completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `).run(status, outcome_notes || null, status, id);
        await trx.prepare(`
      INSERT INTO referral_events (id, referral_id, event_type, description, actor_role)
      VALUES (?, ?, ?, ?, ?)
    `).run(`re-${Date.now()}`, id, `Status updated to ${status.toUpperCase()}`, outcome_notes || `Referral status progressed to ${status}`, actor_role || 'facility_staff');
    })();
    res.json({ message: 'Referral status updated successfully', id, status });
};
exports.updateReferralStatus = updateReferralStatus;
