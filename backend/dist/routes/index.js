"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const facility_controller_js_1 = require("../controllers/facility.controller.js");
const appointment_controller_js_1 = require("../controllers/appointment.controller.js");
const queue_controller_js_1 = require("../controllers/queue.controller.js");
const clinical_controller_js_1 = require("../controllers/clinical.controller.js");
const referral_controller_js_1 = require("../controllers/referral.controller.js");
const medicine_controller_js_1 = require("../controllers/medicine.controller.js");
const inventory_controller_js_1 = require("../controllers/inventory.controller.js");
const frontline_controller_js_1 = require("../controllers/frontline.controller.js");
const analytics_controller_js_1 = require("../controllers/analytics.controller.js");
const ai_controller_js_1 = require("../controllers/ai.controller.js");
const grievance_controller_js_1 = require("../controllers/grievance.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const audit_js_1 = require("../middleware/audit.js");
const asyncHandler_js_1 = require("../middleware/asyncHandler.js");
const hospital_controller_js_1 = require("../controllers/hospital.controller.js");
const fhir_controller_js_1 = require("../controllers/fhir.controller.js");
const router = (0, express_1.Router)();
const auth = (0, asyncHandler_js_1.asyncHandler)(auth_js_1.authMiddleware);
// Auth & Session
router.get('/auth/me', auth, (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.getMe));
router.get('/profile', auth, (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.getUserProfile));
router.post('/auth/login', (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.login));
router.post('/auth/register', (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.register));
router.post('/auth/patient/send-otp', (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.sendPatientOtp));
router.post('/auth/patient/verify-otp', (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.verifyPatientOtp));
router.post('/auth/patient/forgot-id/send-otp', (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.forgotPatientIdSendOtp));
router.post('/auth/patient/forgot-id/verify-otp', auth_controller_js_1.forgotPatientIdVerifyOtp);
router.post('/auth/demo-switch', (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.switchDemoRole));
router.get('/auth/demo-accounts', (0, asyncHandler_js_1.asyncHandler)(auth_controller_js_1.listDemoAccounts));
// Facilities Discovery
router.get('/facilities', (0, asyncHandler_js_1.asyncHandler)(facility_controller_js_1.getAllFacilities));
router.get('/facilities/:id', (0, asyncHandler_js_1.asyncHandler)(facility_controller_js_1.getFacilityById));
// Hospital Management Suite (Overview, Beds, Admissions, Discharges, Staff, Network)
router.get('/hospitals/overview', (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.getHospitalOverview));
router.get('/hospitals/beds', (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.getWardsAndBeds));
router.patch('/hospitals/beds/:id', auth, (0, audit_js_1.auditLog)('UPDATE_BED_STATUS', 'Bed', req => req.params.id), (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.updateBedStatus));
router.get('/hospitals/admissions', (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.getAdmissions));
router.post('/hospitals/admissions', auth, (0, audit_js_1.auditLog)('CREATE_ADMISSION', 'Admission'), (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.createAdmission));
router.patch('/hospitals/admissions/:id/status', auth, (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.updateAdmissionStatus));
router.post('/hospitals/admissions/:id/discharge', auth, (0, audit_js_1.auditLog)('DISCHARGE_PATIENT', 'Admission', req => req.params.id), (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.dischargePatient));
router.get('/hospitals/staff', (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.getHospitalStaff));
router.get('/hospitals/network', (0, asyncHandler_js_1.asyncHandler)(hospital_controller_js_1.getFacilityNetwork));
// FHIR R4 Interoperability Endpoints
router.get('/fhir/Patient/:id', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirPatient));
router.get('/fhir/Observation', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirObservations));
router.get('/fhir/Condition', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirConditions));
router.get('/fhir/Encounter', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirEncounters));
router.get('/fhir/MedicationRequest', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirMedicationRequests));
router.get('/fhir/DiagnosticReport', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirDiagnosticReports));
router.get('/fhir/ServiceRequest', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirServiceRequests));
router.get('/fhir/Bundle/:patientId', (0, asyncHandler_js_1.asyncHandler)(fhir_controller_js_1.getFhirPatientBundle));
// Appointments & Queue Tokens
router.get('/appointments', auth, (0, asyncHandler_js_1.asyncHandler)(appointment_controller_js_1.getMyAppointments));
router.post('/appointments', auth, (0, audit_js_1.auditLog)('CREATE_APPOINTMENT', 'Appointment'), (0, asyncHandler_js_1.asyncHandler)(appointment_controller_js_1.createAppointment));
router.patch('/appointments/:id/cancel', auth, (0, audit_js_1.auditLog)('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), (0, asyncHandler_js_1.asyncHandler)(appointment_controller_js_1.cancelAppointment));
router.delete('/appointments/:id', auth, (0, audit_js_1.auditLog)('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), (0, asyncHandler_js_1.asyncHandler)(appointment_controller_js_1.cancelAppointment));
// Real-Time Queue
router.get('/queues', (0, asyncHandler_js_1.asyncHandler)(queue_controller_js_1.getFacilityQueue));
router.post('/queues/call-next', auth, (0, audit_js_1.auditLog)('CALL_QUEUE_TOKEN', 'QueueToken'), (0, asyncHandler_js_1.asyncHandler)(queue_controller_js_1.callNextToken));
router.patch('/queues/tokens/:id', auth, (0, asyncHandler_js_1.asyncHandler)(queue_controller_js_1.updateTokenStatus));
// Clinical & Longitudinal EHR
router.get('/clinical/timeline/:patientId', auth, (0, audit_js_1.auditLog)('VIEW_PATIENT_TIMELINE', 'Patient', req => req.params.patientId), (0, asyncHandler_js_1.asyncHandler)(clinical_controller_js_1.getPatientTimeline));
router.post('/clinical/consultations', auth, (0, audit_js_1.auditLog)('CREATE_CONSULTATION', 'Consultation'), (0, asyncHandler_js_1.asyncHandler)(clinical_controller_js_1.createConsultation));
router.post('/clinical/assessments', auth, (0, audit_js_1.auditLog)('CREATE_HEALTH_ASSESSMENT', 'HealthAssessment'), (0, asyncHandler_js_1.asyncHandler)(clinical_controller_js_1.saveHealthAssessment));
router.get('/clinical/assessments/:patientId', auth, (0, asyncHandler_js_1.asyncHandler)(clinical_controller_js_1.getHealthAssessments));
// Inter-Facility Referrals
router.get('/referrals', auth, (0, asyncHandler_js_1.asyncHandler)(referral_controller_js_1.getAllReferrals));
router.get('/referrals/:id', auth, (0, asyncHandler_js_1.asyncHandler)(referral_controller_js_1.getReferralById));
router.patch('/referrals/:id/status', auth, (0, audit_js_1.auditLog)('UPDATE_REFERRAL_STATUS', 'Referral', req => req.params.id), (0, asyncHandler_js_1.asyncHandler)(referral_controller_js_1.updateReferralStatus));
// Medicines Inventory
router.get('/medicines', (0, asyncHandler_js_1.asyncHandler)(medicine_controller_js_1.searchMedicines));
router.patch('/medicines/:id/stock', auth, (0, audit_js_1.auditLog)('UPDATE_STOCK', 'Medicine', req => req.params.id), (0, asyncHandler_js_1.asyncHandler)(medicine_controller_js_1.updateMedicineStock));
// Facility Inventory & Capability Search ("find a facility that has this")
router.get('/inventory/search', (0, asyncHandler_js_1.asyncHandler)(inventory_controller_js_1.searchInventory));
router.post('/hospitals/equipment', auth, (0, audit_js_1.auditLog)('ADD_EQUIPMENT', 'Equipment'), (0, asyncHandler_js_1.asyncHandler)(inventory_controller_js_1.addEquipment));
router.patch('/hospitals/equipment/:id', auth, (0, audit_js_1.auditLog)('UPDATE_EQUIPMENT', 'Equipment', req => req.params.id), (0, asyncHandler_js_1.asyncHandler)(inventory_controller_js_1.updateEquipment));
// Frontline (ASHA / ANM)
router.get('/frontline/community', auth, (0, asyncHandler_js_1.asyncHandler)(frontline_controller_js_1.getCommunitySummary));
router.get('/frontline/high-risk-roster', auth, (0, asyncHandler_js_1.asyncHandler)(frontline_controller_js_1.getHighRiskRoster));
router.post('/frontline/home-visits', auth, (0, audit_js_1.auditLog)('RECORD_HOME_VISIT', 'HomeVisit'), (0, asyncHandler_js_1.asyncHandler)(frontline_controller_js_1.recordHomeVisit));
router.post('/frontline/sync-offline', auth, (0, audit_js_1.auditLog)('SYNC_OFFLINE_VISITS', 'HomeVisit'), (0, asyncHandler_js_1.asyncHandler)(frontline_controller_js_1.syncOfflineVisits));
// Analytics & Command Center
router.get('/analytics/district', (0, asyncHandler_js_1.asyncHandler)(analytics_controller_js_1.getDistrictAnalytics));
router.get('/analytics/state', analytics_controller_js_1.getStateAnalytics);
// AI Decision Support Triage & Assistant
router.post('/ai/triage', (0, asyncHandler_js_1.asyncHandler)(ai_controller_js_1.triageAssessment));
router.post('/ai/assistant', ai_controller_js_1.healthAssistant);
router.post('/ai/symptom-triage', (0, asyncHandler_js_1.asyncHandler)(ai_controller_js_1.geminiSymptomTriage));
// Grievances & Feedback
router.post('/grievances', (0, asyncHandler_js_1.asyncHandler)(grievance_controller_js_1.submitGrievance));
router.get('/grievances', (0, asyncHandler_js_1.asyncHandler)(grievance_controller_js_1.getGrievances));
exports.default = router;
