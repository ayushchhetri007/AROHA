"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTokenStatus = exports.callNextToken = exports.getFacilityQueue = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const getFacilityQueue = async (req, res) => {
    const facilityId = req.query.facility_id || 'fac-phc-shirwal';
    // The Live Token Queue must only ever show genuine live-queue entries.
    // 'booked' tokens (appointment made, but not yet checked into the live
    // queue) are excluded by default. Staff-facing queue-management views that
    // need to see - and check in - pending bookings pass ?scope=all.
    const includeBooked = req.query.scope === 'all';
    const tokens = await db_js_1.default.prepare(`
    SELECT q.*, p.full_name as patient_name, p.age, p.gender, p.village,
           a.appointment_number, a.service_name, a.priority,
           d.full_name as doctor_name
    FROM queue_tokens q
    JOIN patients p ON q.patient_id = p.id
    JOIN appointments a ON q.appointment_id = a.id
    LEFT JOIN doctors d ON q.doctor_id = d.id
    WHERE q.facility_id = ?
    ${includeBooked ? '' : "AND q.status != 'booked'"}
    ORDER BY
      CASE q.status
        WHEN 'in_progress' THEN 1
        WHEN 'called' THEN 2
        WHEN 'waiting' THEN 3
        WHEN 'booked' THEN 4
        WHEN 'completed' THEN 5
        ELSE 6
      END,
      q.token_number ASC
  `).all(facilityId);
    // Stats
    const activeToken = tokens.find((t) => t.status === 'in_progress' || t.status === 'called');
    const waitingCount = tokens.filter((t) => t.status === 'waiting').length;
    const completedCount = tokens.filter((t) => t.status === 'completed').length;
    res.json({
        facilityId,
        activeToken: activeToken || null,
        waitingCount,
        completedCount,
        tokens
    });
};
exports.getFacilityQueue = getFacilityQueue;
const callNextToken = async (req, res) => {
    const { facility_id, doctor_id } = req.body;
    const facilityId = facility_id || 'fac-phc-shirwal';
    // Mark current in_progress as completed if any
    await db_js_1.default.prepare(`
    UPDATE queue_tokens SET status = 'completed'
    WHERE facility_id = ? AND status = 'in_progress'
  `).run(facilityId);
    // Find next waiting token
    const nextToken = await db_js_1.default.prepare(`
    SELECT * FROM queue_tokens
    WHERE facility_id = ? AND status = 'waiting'
    ORDER BY token_number ASC LIMIT 1
  `).get(facilityId);
    if (!nextToken) {
        return res.json({ message: 'No more waiting patients in queue' });
    }
    await db_js_1.default.prepare(`
    UPDATE queue_tokens
    SET status = 'in_progress', called_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nextToken.id);
    // Also update appointment status
    await db_js_1.default.prepare(`
    UPDATE appointments SET status = 'in_consultation' WHERE id = ?
  `).run(nextToken.appointment_id);
    res.json({
        message: `Token #${nextToken.token_number} called to consultation room`,
        token: nextToken
    });
};
exports.callNextToken = callNextToken;
const updateTokenStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'waiting' | 'called' | 'in_progress' | 'completed' | 'skipped'
    await db_js_1.default.prepare('UPDATE queue_tokens SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Queue token status updated', id, status });
};
exports.updateTokenStatus = updateTokenStatus;
