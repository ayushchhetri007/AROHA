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
import { asyncHandler } from '../middleware/asyncHandler.js';

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
const auth = asyncHandler(authMiddleware);

// Auth & Session
router.get('/auth/me', auth, asyncHandler(getMe));
router.get('/profile', auth, asyncHandler(getUserProfile));
router.post('/auth/login', asyncHandler(login));
router.post('/auth/register', asyncHandler(register));
router.post('/auth/patient/send-otp', asyncHandler(sendPatientOtp));
router.post('/auth/patient/verify-otp', asyncHandler(verifyPatientOtp));
router.post('/auth/patient/forgot-id/send-otp', asyncHandler(forgotPatientIdSendOtp));
router.post('/auth/patient/forgot-id/verify-otp', forgotPatientIdVerifyOtp);
router.post('/auth/demo-switch', asyncHandler(switchDemoRole));
router.get('/auth/demo-accounts', asyncHandler(listDemoAccounts));

// Facilities Discovery
router.get('/facilities', asyncHandler(getAllFacilities));
router.get('/facilities/:id', asyncHandler(getFacilityById));

// Hospital Management Suite (Overview, Beds, Admissions, Discharges, Staff, Network)
router.get('/hospitals/overview', asyncHandler(getHospitalOverview));
router.get('/hospitals/beds', asyncHandler(getWardsAndBeds));
router.patch('/hospitals/beds/:id', auth, auditLog('UPDATE_BED_STATUS', 'Bed', req => req.params.id), asyncHandler(updateBedStatus));
router.get('/hospitals/admissions', asyncHandler(getAdmissions));
router.post('/hospitals/admissions', auth, auditLog('CREATE_ADMISSION', 'Admission'), asyncHandler(createAdmission));
router.patch('/hospitals/admissions/:id/status', auth, asyncHandler(updateAdmissionStatus));
router.post('/hospitals/admissions/:id/discharge', auth, auditLog('DISCHARGE_PATIENT', 'Admission', req => req.params.id), asyncHandler(dischargePatient));
router.get('/hospitals/staff', asyncHandler(getHospitalStaff));
router.get('/hospitals/network', asyncHandler(getFacilityNetwork));

// FHIR R4 Interoperability Endpoints
router.get('/fhir/Patient/:id', asyncHandler(getFhirPatient));
router.get('/fhir/Observation', asyncHandler(getFhirObservations));
router.get('/fhir/Condition', asyncHandler(getFhirConditions));
router.get('/fhir/Encounter', asyncHandler(getFhirEncounters));
router.get('/fhir/MedicationRequest', asyncHandler(getFhirMedicationRequests));
router.get('/fhir/DiagnosticReport', asyncHandler(getFhirDiagnosticReports));
router.get('/fhir/ServiceRequest', asyncHandler(getFhirServiceRequests));
router.get('/fhir/Bundle/:patientId', asyncHandler(getFhirPatientBundle));

// Appointments & Queue Tokens
router.get('/appointments', auth, asyncHandler(getMyAppointments));
router.post('/appointments', auth, auditLog('CREATE_APPOINTMENT', 'Appointment'), asyncHandler(createAppointment));
router.patch('/appointments/:id/cancel', auth, auditLog('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), asyncHandler(cancelAppointment));
router.delete('/appointments/:id', auth, auditLog('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), asyncHandler(cancelAppointment));

// Real-Time Queue
router.get('/queues', asyncHandler(getFacilityQueue));
router.post('/queues/call-next', auth, auditLog('CALL_QUEUE_TOKEN', 'QueueToken'), asyncHandler(callNextToken));
router.patch('/queues/tokens/:id', auth, asyncHandler(updateTokenStatus));

// Clinical & Longitudinal EHR
router.get('/clinical/timeline/:patientId', auth, auditLog('VIEW_PATIENT_TIMELINE', 'Patient', req => req.params.patientId), asyncHandler(getPatientTimeline));
router.post('/clinical/consultations', auth, auditLog('CREATE_CONSULTATION', 'Consultation'), asyncHandler(createConsultation));
router.post('/clinical/assessments', auth, auditLog('CREATE_HEALTH_ASSESSMENT', 'HealthAssessment'), asyncHandler(saveHealthAssessment));
router.get('/clinical/assessments/:patientId', auth, asyncHandler(getHealthAssessments));

// Inter-Facility Referrals
router.get('/referrals', auth, asyncHandler(getAllReferrals));
router.get('/referrals/:id', auth, asyncHandler(getReferralById));
router.patch('/referrals/:id/status', auth, auditLog('UPDATE_REFERRAL_STATUS', 'Referral', req => req.params.id), asyncHandler(updateReferralStatus));

// Medicines Inventory
router.get('/medicines', asyncHandler(searchMedicines));
router.patch('/medicines/:id/stock', auth, auditLog('UPDATE_STOCK', 'Medicine', req => req.params.id), asyncHandler(updateMedicineStock));

// Facility Inventory & Capability Search ("find a facility that has this")
router.get('/inventory/search', asyncHandler(searchInventory));
router.post('/hospitals/equipment', auth, auditLog('ADD_EQUIPMENT', 'Equipment'), asyncHandler(addEquipment));
router.patch('/hospitals/equipment/:id', auth, auditLog('UPDATE_EQUIPMENT', 'Equipment', req => req.params.id), asyncHandler(updateEquipment));

// Frontline (ASHA / ANM)
router.get('/frontline/community', auth, asyncHandler(getCommunitySummary));
router.get('/frontline/high-risk-roster', auth, asyncHandler(getHighRiskRoster));
router.post('/frontline/home-visits', auth, auditLog('RECORD_HOME_VISIT', 'HomeVisit'), asyncHandler(recordHomeVisit));
router.post('/frontline/sync-offline', auth, auditLog('SYNC_OFFLINE_VISITS', 'HomeVisit'), asyncHandler(syncOfflineVisits));

// Analytics & Command Center
router.get('/analytics/district', asyncHandler(getDistrictAnalytics));
router.get('/analytics/state', getStateAnalytics);

// AI Decision Support Triage & Assistant
router.post('/ai/triage', asyncHandler(triageAssessment));
router.post('/ai/assistant', healthAssistant);

// Grievances & Feedback
router.post('/grievances', asyncHandler(submitGrievance));
router.get('/grievances', asyncHandler(getGrievances));

export default router;
