import { Request, Response } from 'express';
import db from '../config/db.js';

export const getDistrictAnalytics = (req: Request, res: Response) => {
  const district = (req.query.district as string) || 'Satara';

  const totalFacilities = db.prepare('SELECT COUNT(*) as count FROM facilities WHERE district = ?').get(district) as any;
  const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients WHERE district = ?').get(district) as any;
  const totalAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get() as any;
  const completedReferrals = db.prepare("SELECT COUNT(*) as count FROM referrals WHERE status IN ('completed', 'attended', 'accepted')").get() as any;
  const totalReferrals = db.prepare('SELECT COUNT(*) as count FROM referrals').get() as any;

  const totalMeds = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'out_of_stock' THEN 1 ELSE 0 END) as stockouts,
           SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as instock
    FROM medicines m
    JOIN facilities f ON m.facility_id = f.id
    WHERE f.district = ?
  `).get(district) as any;

  const medAvailabilityRate = totalMeds.total ? Math.round((totalMeds.instock / totalMeds.total) * 100) : 92;
  const referralCompletionRate = totalReferrals.count ? Math.round((completedReferrals.count / totalReferrals.count) * 100) : 88;

  res.json({
    district,
    state: 'Maharashtra',
    kpis: {
      citizensServed: 24680,
      appointmentsToday: 1284,
      teleconsultations: 438,
      referralCompletionRate,
      averageWaitingTimeMinutes: 28,
      medicineAvailabilityRate: medAvailabilityRate,
      diagnosticAvailabilityRate: 89,
      followUpCompletionRate: 82,
      estimatedTravelSavedKm: 14200
    },
    facilityHierarchy: [
      { level: 'District Hospital', count: 1, name: 'District Hospital Satara (350 Beds)' },
      { level: 'Sub-District Hospital', count: 1, name: 'SDH Karad (100 Beds)' },
      { level: 'Rural Hospitals', count: 2, names: ['RH Khandala', 'RH Wai'] },
      { level: 'Primary Health Centres (PHC)', count: 1, name: 'PHC Shirwal (24x7 Emergency)' },
      { level: 'Sub-Centres', count: 2, names: ['SC Shirwal-Wadi', 'SC Pargaon'] }
    ],
    waitingTimeTrends: [
      { month: 'Apr', waitMins: 46, referralsCompleted: 71 },
      { month: 'May', waitMins: 42, referralsCompleted: 75 },
      { month: 'Jun', waitMins: 38, referralsCompleted: 79 },
      { month: 'Jul', waitMins: 34, referralsCompleted: 83 },
      { month: 'Aug', waitMins: 30, referralsCompleted: 86 },
      { month: 'Sep', waitMins: 28, referralsCompleted: 88 }
    ]
  });
};

export const getStateAnalytics = (_req: Request, res: Response) => {
  const districtPerformance = [
    { district: 'Satara', facilities: 7, citizensServed: 24680, waitTime: 28, referralComp: 88, medAvail: 92 },
    { district: 'Pune (Rural)', facilities: 4, citizensServed: 31200, waitTime: 26, referralComp: 91, medAvail: 94 },
    { district: 'Ahmednagar', facilities: 2, citizensServed: 18400, waitTime: 32, referralComp: 84, medAvail: 89 },
    { district: 'Nandurbar (Tribal)', facilities: 3, citizensServed: 14900, waitTime: 35, referralComp: 81, medAvail: 86 },
    { district: 'Gadchiroli (Aspirational)', facilities: 4, citizensServed: 12100, waitTime: 31, referralComp: 83, medAvail: 85 }
  ];

  res.json({
    state: 'Maharashtra',
    stateSummary: {
      totalDistrictsActive: 5,
      totalFacilitiesMonitored: 20,
      totalCitizensRegistered: 101280,
      totalReferralsCoordinated: 6420,
      averageTravelDistanceSavedKm: 23.4,
      totalConsultationsConducted: 48900
    },
    districtPerformance
  });
};
