import { Request, Response } from 'express';
import db from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCommunitySummary = (req: AuthRequest, res: Response) => {
  const ashaId = req.query.asha_id as string || 'usr-asha-1';

  // Counts
  const totalBeneficiaries = db.prepare('SELECT COUNT(*) as count FROM patients WHERE village IN (?, ?)').get('Shirwal', 'Khed') as any;
  const pregnantWomen = db.prepare('SELECT COUNT(*) as count FROM maternal_records').get() as any;
  const highRiskPregnant = db.prepare('SELECT COUNT(*) as count FROM maternal_records WHERE high_risk_flag = 1').get() as any;
  const infants = db.prepare('SELECT COUNT(*) as count FROM child_health_records').get() as any;
  const chronicPatients = db.prepare('SELECT COUNT(*) as count FROM chronic_care_records').get() as any;
  const pendingVisits = 4; // Synthetic pending scheduled visits
  const pendingReferrals = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE status IN ('created', 'accepted')").get() as any;

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

export const getHighRiskRoster = (req: Request, res: Response) => {
  const maternalHighRisk = db.prepare(`
    SELECT m.*, p.full_name, p.age, p.phone, p.village, p.blood_group
    FROM maternal_records m
    JOIN patients p ON m.patient_id = p.id
    WHERE m.high_risk_flag = 1
  `).all();

  const chronicHighRisk = db.prepare(`
    SELECT c.*, p.full_name, p.age, p.phone, p.village, p.blood_group
    FROM chronic_care_records c
    JOIN patients p ON c.patient_id = p.id
    WHERE c.risk_level IN ('high', 'moderate')
  `).all();

  const childRoster = db.prepare(`
    SELECT ch.*, p.full_name as mother_name, p.village, p.phone
    FROM child_health_records ch
    JOIN patients p ON ch.patient_id = p.id
  `).all();

  const postDischargeFollowUps = db.prepare(`
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


export const recordHomeVisit = (req: Request, res: Response) => {
  const { asha_id, patient_id, visit_date, vitals, observations, pregnancy_notes, child_growth_notes, symptoms } = req.body;

  const id = `vis-${Date.now()}`;
  db.prepare(`
    INSERT INTO home_visits (id, asha_id, patient_id, visit_date, vitals_json, observations, pregnancy_notes, child_growth_notes, symptoms, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
  `).run(
    id,
    asha_id || 'usr-asha-1',
    patient_id,
    visit_date || new Date().toISOString().split('T')[0],
    JSON.stringify(vitals || {}),
    observations || 'Regular community home visit conducted',
    pregnancy_notes || null,
    child_growth_notes || null,
    symptoms || null
  );

  res.status(201).json({ message: 'Home visit recorded successfully', id });
};

export const syncOfflineVisits = (req: Request, res: Response) => {
  const { visits } = req.body; // Array of offline recorded visits

  if (!Array.isArray(visits) || visits.length === 0) {
    return res.json({ syncedCount: 0, message: 'No records to sync' });
  }

  const insert = db.prepare(`
    INSERT INTO home_visits (id, asha_id, patient_id, visit_date, vitals_json, observations, pregnancy_notes, child_growth_notes, symptoms, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
  `);

  let count = 0;
  db.transaction(() => {
    for (const v of visits) {
      const id = v.id || `vis-sync-${Date.now()}-${count++}`;
      insert.run(
        id,
        v.asha_id || 'usr-asha-1',
        v.patient_id || 'pat-meera',
        v.visit_date || new Date().toISOString().split('T')[0],
        typeof v.vitals === 'string' ? v.vitals : JSON.stringify(v.vitals || {}),
        v.observations || 'Synced offline home visit',
        v.pregnancy_notes || null,
        v.child_growth_notes || null,
        v.symptoms || null
      );
    }
  })();

  res.json({
    syncedCount: visits.length,
    message: `Successfully synchronized ${visits.length} offline visit records with the central database.`
  });
};
