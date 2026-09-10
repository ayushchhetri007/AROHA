import { Router } from 'express';
import {
  getMe, login, register, switchDemoRole, listDemoAccounts,
  sendPatientOtp, verifyPatientOtp,
  getUserProfile, forgotPatientIdSendOtp, forgotPatientIdVerifyOtp
} from '../controllers/auth.controller.js';
import { getAllFacilities, getFacilityById } from '../controllers/facility.controller.js';
import { getMyAppointments, createAppointment, cancelAppointment } from '../controllers/appointment.controller.js';
import { getFacilityQueue, callNextToken, updateTokenStatus } from '../controllers/queue.controller.js';
import { getPatientTimeline, createConsultation, saveHealthAssessment, getHealthAssessments } from '../controllers/clinical.controller.js';
import { getAllReferrals, getReferralById, updateReferralStatus } from '../controllers/referral.controller.js';
import { searchMedicines, updateMedicineStock } from '../controllers/medicine.controller.js';
import { searchInventory, addEquipment, updateEquipment } from '../controllers/inventory.controller.js';
import { getCommunitySummary, getHighRiskRoster, recordHomeVisit, syncOfflineVisits } from '../controllers/frontline.controller.js';
import { getDistrictAnalytics, getStateAnalytics } from '../controllers/analytics.controller.js';
import { triageAssessment, healthAssistant } from '../controllers/ai.controller.js';
import { submitGrievance, getGrievances } from '../controllers/grievance.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';

import {
  getHospitalOverview, getWardsAndBeds, updateBedStatus,
  getAdmissions, createAdmission, updateAdmissionStatus, dischargePatient,
  getHospitalStaff, getFacilityNetwork
} from '../controllers/hospital.controller.js';
import {
  getFhirPatient, getFhirObservations, getFhirConditions, getFhirEncounters,
  getFhirMedicationRequests, getFhirDiagnosticReports, getFhirServiceRequests,
  getFhirPatientBundle
} from '../controllers/fhir.controller.js';

const router = Router();

// Auth & Session
router.get('/auth/me', authMiddleware, getMe);
router.get('/profile', authMiddleware, getUserProfile);
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/patient/send-otp', sendPatientOtp);
router.post('/auth/patient/verify-otp', verifyPatientOtp);
router.post('/auth/patient/forgot-id/send-otp', forgotPatientIdSendOtp);
router.post('/auth/patient/forgot-id/verify-otp', forgotPatientIdVerifyOtp);
router.post('/auth/demo-switch', switchDemoRole);
router.get('/auth/demo-accounts', listDemoAccounts);

// Facilities Discovery
router.get('/facilities', getAllFacilities);
router.get('/facilities/:id', getFacilityById);

// Hospital Management Suite (Overview, Beds, Admissions, Discharges, Staff, Network)
router.get('/hospitals/overview', getHospitalOverview);
router.get('/hospitals/beds', getWardsAndBeds);
router.patch('/hospitals/beds/:id', authMiddleware, auditLog('UPDATE_BED_STATUS', 'Bed', req => req.params.id), updateBedStatus);
router.get('/hospitals/admissions', getAdmissions);
router.post('/hospitals/admissions', authMiddleware, auditLog('CREATE_ADMISSION', 'Admission'), createAdmission);
router.patch('/hospitals/admissions/:id/status', authMiddleware, updateAdmissionStatus);
router.post('/hospitals/admissions/:id/discharge', authMiddleware, auditLog('DISCHARGE_PATIENT', 'Admission', req => req.params.id), dischargePatient);
router.get('/hospitals/staff', getHospitalStaff);
router.get('/hospitals/network', getFacilityNetwork);

// FHIR R4 Interoperability Endpoints
router.get('/fhir/Patient/:id', getFhirPatient);
router.get('/fhir/Observation', getFhirObservations);
router.get('/fhir/Condition', getFhirConditions);
router.get('/fhir/Encounter', getFhirEncounters);
router.get('/fhir/MedicationRequest', getFhirMedicationRequests);
router.get('/fhir/DiagnosticReport', getFhirDiagnosticReports);
router.get('/fhir/ServiceRequest', getFhirServiceRequests);
router.get('/fhir/Bundle/:patientId', getFhirPatientBundle);

// Appointments & Queue Tokens
router.get('/appointments', authMiddleware, getMyAppointments);
router.post('/appointments', authMiddleware, auditLog('CREATE_APPOINTMENT', 'Appointment'), createAppointment);
router.patch('/appointments/:id/cancel', authMiddleware, auditLog('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), cancelAppointment);
router.delete('/appointments/:id', authMiddleware, auditLog('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), cancelAppointment);

// Real-Time Queue
router.get('/queues', getFacilityQueue);
router.post('/queues/call-next', authMiddleware, auditLog('CALL_QUEUE_TOKEN', 'QueueToken'), callNextToken);
router.patch('/queues/tokens/:id', authMiddleware, updateTokenStatus);

// Clinical & Longitudinal EHR
router.get('/clinical/timeline/:patientId', authMiddleware, auditLog('VIEW_PATIENT_TIMELINE', 'Patient', req => req.params.patientId), getPatientTimeline);
router.post('/clinical/consultations', authMiddleware, auditLog('CREATE_CONSULTATION', 'Consultation'), createConsultation);
router.post('/clinical/assessments', authMiddleware, auditLog('CREATE_HEALTH_ASSESSMENT', 'HealthAssessment'), saveHealthAssessment);
router.get('/clinical/assessments/:patientId', authMiddleware, getHealthAssessments);

// Inter-Facility Referrals
router.get('/referrals', authMiddleware, getAllReferrals);
router.get('/referrals/:id', authMiddleware, getReferralById);
router.patch('/referrals/:id/status', authMiddleware, auditLog('UPDATE_REFERRAL_STATUS', 'Referral', req => req.params.id), updateReferralStatus);

// Medicines Inventory
router.get('/medicines', searchMedicines);
router.patch('/medicines/:id/stock', authMiddleware, auditLog('UPDATE_STOCK', 'Medicine', req => req.params.id), updateMedicineStock);

// Facility Inventory & Capability Search ("find a facility that has this")
router.get('/inventory/search', searchInventory);
router.post('/hospitals/equipment', authMiddleware, auditLog('ADD_EQUIPMENT', 'Equipment'), addEquipment);
router.patch('/hospitals/equipment/:id', authMiddleware, auditLog('UPDATE_EQUIPMENT', 'Equipment', req => req.params.id), updateEquipment);

// Frontline (ASHA / ANM)
router.get('/frontline/community', authMiddleware, getCommunitySummary);
router.get('/frontline/high-risk-roster', authMiddleware, getHighRiskRoster);
router.post('/frontline/home-visits', authMiddleware, auditLog('RECORD_HOME_VISIT', 'HomeVisit'), recordHomeVisit);
router.post('/frontline/sync-offline', authMiddleware, auditLog('SYNC_OFFLINE_VISITS', 'HomeVisit'), syncOfflineVisits);

// Analytics & Command Center
router.get('/analytics/district', getDistrictAnalytics);
router.get('/analytics/state', getStateAnalytics);

// AI Decision Support Triage & Assistant
router.post('/ai/triage', triageAssessment);
router.post('/ai/assistant', healthAssistant);

// Grievances & Feedback
router.post('/grievances', submitGrievance);
router.get('/grievances', getGrievances);

export default router;

