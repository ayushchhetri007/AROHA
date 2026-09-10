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
const hospital_controller_js_1 = require("../controllers/hospital.controller.js");
const fhir_controller_js_1 = require("../controllers/fhir.controller.js");
const router = (0, express_1.Router)();
// Auth & Session
router.get('/auth/me', auth_js_1.authMiddleware, auth_controller_js_1.getMe);
router.get('/profile', auth_js_1.authMiddleware, auth_controller_js_1.getUserProfile);
router.post('/auth/login', auth_controller_js_1.login);
router.post('/auth/register', auth_controller_js_1.register);
router.post('/auth/patient/send-otp', auth_controller_js_1.sendPatientOtp);
router.post('/auth/patient/verify-otp', auth_controller_js_1.verifyPatientOtp);
router.post('/auth/patient/forgot-id/send-otp', auth_controller_js_1.forgotPatientIdSendOtp);
router.post('/auth/patient/forgot-id/verify-otp', auth_controller_js_1.forgotPatientIdVerifyOtp);
router.post('/auth/demo-switch', auth_controller_js_1.switchDemoRole);
router.get('/auth/demo-accounts', auth_controller_js_1.listDemoAccounts);
// Facilities Discovery
router.get('/facilities', facility_controller_js_1.getAllFacilities);
router.get('/facilities/:id', facility_controller_js_1.getFacilityById);
// Hospital Management Suite (Overview, Beds, Admissions, Discharges, Staff, Network)
router.get('/hospitals/overview', hospital_controller_js_1.getHospitalOverview);
router.get('/hospitals/beds', hospital_controller_js_1.getWardsAndBeds);
router.patch('/hospitals/beds/:id', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('UPDATE_BED_STATUS', 'Bed', req => req.params.id), hospital_controller_js_1.updateBedStatus);
router.get('/hospitals/admissions', hospital_controller_js_1.getAdmissions);
router.post('/hospitals/admissions', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('CREATE_ADMISSION', 'Admission'), hospital_controller_js_1.createAdmission);
router.patch('/hospitals/admissions/:id/status', auth_js_1.authMiddleware, hospital_controller_js_1.updateAdmissionStatus);
router.post('/hospitals/admissions/:id/discharge', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('DISCHARGE_PATIENT', 'Admission', req => req.params.id), hospital_controller_js_1.dischargePatient);
router.get('/hospitals/staff', hospital_controller_js_1.getHospitalStaff);
router.get('/hospitals/network', hospital_controller_js_1.getFacilityNetwork);
// FHIR R4 Interoperability Endpoints
router.get('/fhir/Patient/:id', fhir_controller_js_1.getFhirPatient);
router.get('/fhir/Observation', fhir_controller_js_1.getFhirObservations);
router.get('/fhir/Condition', fhir_controller_js_1.getFhirConditions);
router.get('/fhir/Encounter', fhir_controller_js_1.getFhirEncounters);
router.get('/fhir/MedicationRequest', fhir_controller_js_1.getFhirMedicationRequests);
router.get('/fhir/DiagnosticReport', fhir_controller_js_1.getFhirDiagnosticReports);
router.get('/fhir/ServiceRequest', fhir_controller_js_1.getFhirServiceRequests);
router.get('/fhir/Bundle/:patientId', fhir_controller_js_1.getFhirPatientBundle);
// Appointments & Queue Tokens
router.get('/appointments', auth_js_1.authMiddleware, appointment_controller_js_1.getMyAppointments);
router.post('/appointments', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('CREATE_APPOINTMENT', 'Appointment'), appointment_controller_js_1.createAppointment);
router.patch('/appointments/:id/cancel', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), appointment_controller_js_1.cancelAppointment);
router.delete('/appointments/:id', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('CANCEL_APPOINTMENT', 'Appointment', req => req.params.id), appointment_controller_js_1.cancelAppointment);
// Real-Time Queue
router.get('/queues', queue_controller_js_1.getFacilityQueue);
router.post('/queues/call-next', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('CALL_QUEUE_TOKEN', 'QueueToken'), queue_controller_js_1.callNextToken);
router.patch('/queues/tokens/:id', auth_js_1.authMiddleware, queue_controller_js_1.updateTokenStatus);
// Clinical & Longitudinal EHR
router.get('/clinical/timeline/:patientId', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('VIEW_PATIENT_TIMELINE', 'Patient', req => req.params.patientId), clinical_controller_js_1.getPatientTimeline);
router.post('/clinical/consultations', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('CREATE_CONSULTATION', 'Consultation'), clinical_controller_js_1.createConsultation);
router.post('/clinical/assessments', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('CREATE_HEALTH_ASSESSMENT', 'HealthAssessment'), clinical_controller_js_1.saveHealthAssessment);
router.get('/clinical/assessments/:patientId', auth_js_1.authMiddleware, clinical_controller_js_1.getHealthAssessments);
// Inter-Facility Referrals
router.get('/referrals', auth_js_1.authMiddleware, referral_controller_js_1.getAllReferrals);
router.get('/referrals/:id', auth_js_1.authMiddleware, referral_controller_js_1.getReferralById);
router.patch('/referrals/:id/status', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('UPDATE_REFERRAL_STATUS', 'Referral', req => req.params.id), referral_controller_js_1.updateReferralStatus);
// Medicines Inventory
router.get('/medicines', medicine_controller_js_1.searchMedicines);
router.patch('/medicines/:id/stock', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('UPDATE_STOCK', 'Medicine', req => req.params.id), medicine_controller_js_1.updateMedicineStock);
// Facility Inventory & Capability Search ("find a facility that has this")
router.get('/inventory/search', inventory_controller_js_1.searchInventory);
router.post('/hospitals/equipment', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('ADD_EQUIPMENT', 'Equipment'), inventory_controller_js_1.addEquipment);
router.patch('/hospitals/equipment/:id', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('UPDATE_EQUIPMENT', 'Equipment', req => req.params.id), inventory_controller_js_1.updateEquipment);
// Frontline (ASHA / ANM)
router.get('/frontline/community', auth_js_1.authMiddleware, frontline_controller_js_1.getCommunitySummary);
router.get('/frontline/high-risk-roster', auth_js_1.authMiddleware, frontline_controller_js_1.getHighRiskRoster);
router.post('/frontline/home-visits', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('RECORD_HOME_VISIT', 'HomeVisit'), frontline_controller_js_1.recordHomeVisit);
router.post('/frontline/sync-offline', auth_js_1.authMiddleware, (0, audit_js_1.auditLog)('SYNC_OFFLINE_VISITS', 'HomeVisit'), frontline_controller_js_1.syncOfflineVisits);
// Analytics & Command Center
router.get('/analytics/district', analytics_controller_js_1.getDistrictAnalytics);
router.get('/analytics/state', analytics_controller_js_1.getStateAnalytics);
// AI Decision Support Triage & Assistant
router.post('/ai/triage', ai_controller_js_1.triageAssessment);
router.post('/ai/assistant', ai_controller_js_1.healthAssistant);
// Grievances & Feedback
router.post('/grievances', grievance_controller_js_1.submitGrievance);
router.get('/grievances', grievance_controller_js_1.getGrievances);
exports.default = router;
