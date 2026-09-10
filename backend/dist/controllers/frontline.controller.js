"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOfflineVisits = exports.recordHomeVisit = exports.getHighRiskRoster = exports.getCommunitySummary = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const getCommunitySummary = async (req, res) => {
    const ashaId = req.query.asha_id || 'usr-asha-1';
    // Counts
    const totalBeneficiaries = await db_js_1.default.prepare('SELECT COUNT(*) as count FROM patients WHERE village IN (?, ?)').get('Shirwal', 'Khed');
    const pregnantWomen = await db_js_1.default.prepare('SELECT COUNT(*) as count FROM maternal_records').get();
    const highRiskPregnant = await db_js_1.default.prepare('SELECT COUNT(*) as count FROM maternal_records WHERE high_risk_flag = 1').get();
    const infants = await db_js_1.default.prepare('SELECT COUNT(*) as count FROM child_health_records').get();
    const chronicPatients = await db_js_1.default.prepare('SELECT COUNT(*) as count FROM chronic_care_records').get();
    const pendingVisits = 4; // Synthetic pending scheduled visits
    const pendingReferrals = await db_js_1.default.prepare("SELECT COUNT(*) as count FROM referrals WHERE status IN ('created', 'accepted')").get();
    res.json({
        assignedVillage: 'Shirwal & Shirwal-Wadi',
        subCentre: 'Sub-Centre Shirwal-Wadi (Under PHC Shirwal)',
        totalBeneficiaries: totalBeneficiaries?.count || 48,
        pregnantWomen: pregnantWomen?.count || 2,
        highRiskPregnant: highRiskPregnant?.count || 2,
        infants: infants?.count || 1,
        chronicPatients: chronicPatients?.count || 2,
        pendingVisits,
        pendingReferrals: pendingReferrals?.count || 1
    });
};
exports.getCommunitySummary = getCommunitySummary;
const getHighRiskRoster = async (req, res) => {
    const maternalHighRisk = await db_js_1.default.prepare(`
    SELECT m.*, p.full_name, p.age, p.phone, p.village, p.blood_group
    FROM maternal_records m
    JOIN patients p ON m.patient_id = p.id
    WHERE m.high_risk_flag = 1
  `).all();
    const chronicHighRisk = await db_js_1.default.prepare(`
    SELECT c.*, p.full_name, p.age, p.phone, p.village, p.blood_group
    FROM chronic_care_records c
    JOIN patients p ON c.patient_id = p.id
    WHERE c.risk_level IN ('high', 'moderate')
  `).all();
    const childRoster = await db_js_1.default.prepare(`
    SELECT ch.*, p.full_name as mother_name, p.village, p.phone
    FROM child_health_records ch
    JOIN patients p ON ch.patient_id = p.id
  `).all();
    const postDischargeFollowUps = await db_js_1.default.prepare(`
    SELECT d.*, p.full_name as patient_name, p.age, p.gender, p.phone, p.village,
           f.name as facility_name, a.department, a.admission_number
    FROM discharges d
    JOIN patients p ON d.patient_id = p.id
    JOIN admissions a ON d.admission_id = a.id
    JOIN facilities f ON a.facility_id = f.id
    WHERE d.follow_up_completed = 0
    ORDER BY d.follow_up_date ASC
  `).all();
    res.json({
        maternalHighRisk,
        chronicHighRisk,
        childRoster,
        postDischargeFollowUps
    });
};
exports.getHighRiskRoster = getHighRiskRoster;
const recordHomeVisit = async (req, res) => {
    const { asha_id, patient_id, visit_date, vitals, observations, pregnancy_notes, child_growth_notes, symptoms } = req.body;
    const id = `vis-${Date.now()}`;
    await db_js_1.default.prepare(`
    INSERT INTO home_visits (id, asha_id, patient_id, visit_date, vitals_json, observations, pregnancy_notes, child_growth_notes, symptoms, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
  `).run(id, asha_id || 'usr-asha-1', patient_id, visit_date || new Date().toISOString().split('T')[0], JSON.stringify(vitals || {}), observations || 'Regular community home visit conducted', pregnancy_notes || null, child_growth_notes || null, symptoms || null);
    res.status(201).json({ message: 'Home visit recorded successfully', id });
};
exports.recordHomeVisit = recordHomeVisit;
const syncOfflineVisits = async (req, res) => {
    const { visits } = req.body; // Array of offline recorded visits
    if (!Array.isArray(visits) || visits.length === 0) {
        return res.json({ syncedCount: 0, message: 'No records to sync' });
    }
    let count = 0;
    await db_js_1.default.transaction(async (trx) => {
        const insert = trx.prepare(`
      INSERT INTO home_visits (id, asha_id, patient_id, visit_date, vitals_json, observations, pregnancy_notes, child_growth_notes, symptoms, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
    `);
        for (const v of visits) {
            const id = v.id || `vis-sync-${Date.now()}-${count++}`;
            await insert.run(id, v.asha_id || 'usr-asha-1', v.patient_id || 'pat-meera', v.visit_date || new Date().toISOString().split('T')[0], typeof v.vitals === 'string' ? v.vitals : JSON.stringify(v.vitals || {}), v.observations || 'Synced offline home visit', v.pregnancy_notes || null, v.child_growth_notes || null, v.symptoms || null);
        }
    })();
    res.json({
        syncedCount: visits.length,
        message: `Successfully synchronized ${visits.length} offline visit records with the central database.`
    });
};
exports.syncOfflineVisits = syncOfflineVisits;
