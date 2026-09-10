export type SupportedLanguage = 'en' | 'mr' | 'hi';

export interface Translations {
  // Brand & Platform Header
  appTitle: string;
  appSubtitle: string;
  tagline: string;
  governmentOfMaharashtra: string;
  deptTitle: string;
  platformHome: string;
  hospitalManagement: string;
  emergencyHelp: string;

  // Navigation Items
  findHealthcare: string;
  bookAppointment: string;
  liveQueue: string;
  myRecords: string;
  referrals: string;
  medicines: string;
  triageAssistant: string;
  ashaCommunity: string;
  doctorOpd: string;
  adminDashboard: string;
  lowLiteracyMode: string;
  switchRole: string;

  // Header / Auth Actions
  signOut: string;
  confirmSignOut: string;
  signOutPrompt: string;
  cancel: string;
  close: string;
  refresh: string;
  refreshing: string;

  // Patient Dashboard Header & Identity
  welcome: string;
  abhaActive: string;
  patientLabel: string;
  patientIdLabel: string;
  abhaIdLabel: string;
  bloodGroupLabel: string;
  locationLabel: string;

  // Check Your Symptoms Hero Card
  preliminaryTriageBadge: string;
  checkYourSymptoms: string;
  checkSymptomsDesc: string;
  checkYourSymptomsBtn: string;

  // Healthcare Services 2x2 Grid
  yourHealthcareServices: string;
  servicesDesc: string;
  facilityDirectoryCardTitle: string;
  facilityDirectoryCardDesc: string;
  exploreFacilities: string;

  liveQueueCardTitle: string;
  liveQueueCardDesc: string;
  openLiveTracker: string;

  inventoryCardTitle: string;
  inventoryCardDesc: string;
  checkStock: string;

  recordsCardTitle: string;
  recordsCardDesc: string;
  viewRecords: string;

  // Facility Directory
  directoryTitle: string;
  directorySubtitle: string;
  searchFacilityPlaceholder: string;
  districtLabel: string;
  allDistricts: string;
  facilityTypeLabel: string;
  allTypes: string;
  emergencyOnlyFilter: string;
  listView: string;
  mapView: string;
  matchingFacilitiesCount: string;
  doctorAvailableToday: string;
  availableToday: string;
  onDutyNow: string;
  emergency24x7: string;
  queueWaitMin: string;
  viewDetails: string;
  getDirections: string;
  callFacility: string;
  viewInventory: string;
  noFacilitiesFound: string;

  // Facility Details Modal
  facilityDetailsTitle: string;
  doctorsAvailableHeader: string;
  servicesOfferedHeader: string;
  contactEmergencyHeader: string;
  phoneLabel: string;

  // Live Token Queue
  liveQueueTitle: string;
  liveQueueSubtitle: string;
  yourReservedToken: string;
  waitingInQueue: string;
  nowInRoom: string;
  activeStatus: string;
  tokenNumberLabel: string;
  tokenIdLabel: string;
  patientsAheadLabel: string;
  estimatedWaitTimeLabel: string;
  audioAnnouncement: string;
  playingAudio: string;
  nowInConsultationRoom: string;
  liveCounter: string;
  currentlyWithDoctor: string;
  noActiveTokenYet: string;
  routeToFacility: string;
  startNavigation: string;
  stopNavigation: string;
  distanceLabel: string;
  travelTimeLabel: string;
  recentAssessmentCard: string;
  upcomingApptCard: string;
  referralsFollowUpCard: string;
  noRecentAssessment: string;
  noUpcomingAppointment: string;
  noActiveReferral: string;

  // Longitudinal Health Records
  recordsTitle: string;
  recordsSubtitle: string;
  allHistoryTab: string;
  consultationsTab: string;
  prescriptionsTab: string;
  diagnosticsTab: string;
  referralsTab: string;
  assessmentsTab: string;
  noRecordsInTab: string;
  dateLabel: string;
  doctorLabel: string;
  facilityLabel: string;
  statusLabel: string;
  downloadReport: string;

  // Profile Drawer
  profileTitle: string;
  personalInfo: string;
  genderLabel: string;
  ageLabel: string;
  addressLabel: string;
  emergencyContactLabel: string;
  consentActive: string;

  // Authentication & Login
  citizenPatientTab: string;
  facilityStaffTab: string;
  medicalDoctorTab: string;
  adminRoleTab: string;
  patientLoginTitle: string;
  patientLoginSubtitle: string;
  enterPatientIdPlaceholder: string;
  sendOtpBtn: string;
  enterOtpPrompt: string;
  verifyOtpBtn: string;
  newPatientPrompt: string;
  registerNowBtn: string;
  staffIdPlaceholder: string;
  passwordPlaceholder: string;
  signInBtn: string;
  emergencyAssistance108: string;

  // Impact Metrics / How it works
  patientsServed: string;
  waitingTimeReduction: string;
  referralCompletion: string;
  travelSaved: string;
  howItWorksTitle: string;
  step1: string;
  step1Desc: string;
  step2: string;
  step2Desc: string;
  step3: string;
  step3Desc: string;
  step4: string;
  step4Desc: string;
  step5: string;
  step5Desc: string;
  emergencyCall108: string;
  disclaimerText: string;

  // Supplementary / Shared Aliases
  appTagline: string;
  selectRole: string;
  profileDrawerTitle: string;
  facilityDirectoryTitle: string;
  facilityDirectorySubtitle: string;
  searchFacilitiesPlaceholder: string;
  districtFilterLabel: string;
  typeFilterLabel: string;
  allFacilityTypes: string;
  subCentres: string;
  primaryHealthCentres: string;
  communityHealthCentres: string;
  ruralHospitals: string;
  subDistrictHospitals: string;
  districtHospitals: string;
  facilitiesMap: string;
  facilitiesShown: string;
  loadingDirectory: string;
  noFacilitiesMatched: string;
  emergency24x7Badge: string;
  detailsBtn: string;
  getDirectionsBtn: string;
  callFacilityBtn: string;
  loadingDetails: string;
  emergencyServicesAvailable: string;
  daytimeOpd: string;
  helpdeskPhone: string;
  doctorsAvailableToday: string;
  dutyRosterFor: string;
  available: string;
  noDoctorsScheduledToday: string;
  emergencyStaffActive: string;
  realTimeTokenSystem: string;
  liveOpdQueueTracker: string;
  currentQueueUpdatesFor: string;
  liveFacilityNavigation: string;
  tokenId: string;
  counterLabel: string;
  estimatedWait: string;
  patientsAhead: string;
  doctorOnDuty: string;
  tokenApproachingNotice: string;
  todaysOpdQueueRoster: string;
  tokenHash: string;
  patientName: string;
  departmentPriority: string;
  status: string;
  consultingDoctor: string;
  appointmentsReferralsFollowups: string;
  recentHealthAssessment: string;
  retakeAssessment: string;
  upcomingAppointment: string;
  trackQueue: string;
  bookNewSlot: string;
  referralsFollowUp: string;
  viewCareReferrals: string;
  longitudinalHealthRecords: string;
  patientHealthTimeline: string;
  completeHistoryDesc: string;
  printTimeline: string;
  exportHealthSummary: string;
  consultations: string;
  clinicalOpdEncounters: string;
  labReports: string;
  diagnosticInvestigations: string;
  activePrescriptions: string;
  ongoingDispensedMedications: string;
  interFacilityTransfers: string;
  filterRecords: string;
  allHistory: string;
  labDiagnostics: string;
  loadingRecords: string;
  noRecordsFound: string;
  active: string;
  startHealthAssessment: string;
  emergency24x7Btn: string;
  emergencyResponseBadge: string;
  emergencyAssistanceDesc: string;
  findNearestEmergencyFacility: string;
  confirmAppointment: string;
  selectDoctor: string;
  selectDate: string;
  availableSlots: string;
  appointmentConfirmed: string;
  viewAppointment: string;
  trackLiveQueue: string;
  registeredMobile: string;
  generalOpdDoctor: string;
  timeSlot: string;
  upcomingAppointments: string;
  confirmed: string;
  tellUsAboutSymptoms: string;
  symptomsIntro: string;
  startSymptomAssessment: string;
  describeSymptoms: string;
  describeSymptomsPrompt: string;
  symptomPlaceholder: string;
  durationPrompt: string;
  severityPrompt: string;
  mild: string;
  moderate: string;
  severe: string;
  continueBtn: string;
  previousBtn: string;
  emergencyCareRecommended: string;
  emergencyWarningText: string;
  emergencyAssistanceBtn: string;
  symptomSummary: string;
  reportedSymptoms: string;
  preliminaryCareGuidance: string;
  preliminaryGuidanceDisclaimer: string;
  continueBooking: string;
  appointmentSummary: string;
  stepIndicator: string;
  specialtyLabel: string;
  patientDetails: string;
  appointmentsTitle: string;
  noUpcomingAppointments: string;
  noAppointmentsBookedYet: string;
  cancelAppointment: string;
  appointmentCancelled: string;
  findNearbyFacility: string;
  noActiveReferrals: string;
  noActiveReferralsDesc: string;
  activePathway: string;
  sourceLabel: string;
  referredFrom: string;
  closedLoopActive: string;
  upcomingAppointmentCompact: string;
  referralId: string;
  referralStatus: string;
  referralReason: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appTitle: 'AROHA+',
    appSubtitle: 'Unified Rural Public Healthcare Coordination Ecosystem',
    tagline: 'Healthcare access should not depend on where you live.',
    governmentOfMaharashtra: 'Seva Health Care Continuum',
    deptTitle: 'Integrated Public Digital Healthcare Platform',
    platformHome: 'Platform Home',
    hospitalManagement: 'Hospital Management',
    emergencyHelp: 'Emergency 24x7',

    findHealthcare: 'Find Nearby Facility',
    bookAppointment: 'Book Appointment',
    liveQueue: 'Live Token Queue',
    myRecords: 'Longitudinal Health Records',
    referrals: 'Inter-Facility Referrals',
    medicines: 'Inventory',
    triageAssistant: 'Check Your Symptoms',
    ashaCommunity: 'Frontline ASHA Worker',
    doctorOpd: 'Doctor Clinical OPD',
    adminDashboard: 'State Command Center',
    lowLiteracyMode: 'Simplified Voice / Icon Mode',
    switchRole: 'Switch Demo Role',

    signOut: 'Sign Out',
    confirmSignOut: 'Confirm Sign Out',
    signOutPrompt: 'Are you sure you want to sign out? Your authenticated session will be closed securely.',
    cancel: 'Cancel',
    close: 'Close',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',

    welcome: 'Welcome',
    abhaActive: 'ABHA Active',
    patientLabel: 'Patient',
    patientIdLabel: 'Seva Health Patient ID',
    abhaIdLabel: 'ABHA ID',
    bloodGroupLabel: 'Blood Group',
    locationLabel: 'Location',

    preliminaryTriageBadge: 'PRELIMINARY DIGITAL TRIAGE SUPPORT',
    checkYourSymptoms: 'Check Your Symptoms',
    checkSymptomsDesc:
      'Answer a few simple questions about your symptoms. Seva Health will provide preliminary guidance and recommend the appropriate level of care and nearby public healthcare facility.',
    checkYourSymptomsBtn: 'Check Your Symptoms',

    yourHealthcareServices: 'Your Healthcare Services',
    servicesDesc:
      'Direct access to nearby public healthcare facilities, real-time OPD token queues, medicine stock availability, and longitudinal health records.',
    facilityDirectoryCardTitle: 'Find Nearby Facility',
    facilityDirectoryCardDesc:
      'Locate Sub-Centres, PHCs, Rural & District Hospitals with live doctor rosters, 24/7 casualty status, and in-app navigation routes.',
    exploreFacilities: 'Explore Facilities',

    liveQueueCardTitle: 'Live Token Queue',
    liveQueueCardDesc:
      'Track your OPD token number in real time, view doctors currently consulting, estimate wait times, and receive audio announcements.',
    openLiveTracker: 'Open Live Tracker',

    inventoryCardTitle: 'Medicine Stock & Inventory',
    inventoryCardDesc:
      'Real-time stock status of essential medicines, diagnostic reagents, and specialty clinical equipment across district facilities.',
    checkStock: 'Check Stock',

    recordsCardTitle: 'Longitudinal Health Records',
    recordsCardDesc:
      'Complete medical history including doctor consultations, digital prescriptions, lab diagnostic reports, and inter-facility referrals.',
    viewRecords: 'View Records',

    directoryTitle: 'Public Healthcare Facilities Directory',
    directorySubtitle:
      'Find nearby Sub-Centres, PHCs, Rural Hospitals, and District Hospitals across Maharashtra with real-time doctors, emergency readiness, and navigation.',
    searchFacilityPlaceholder: 'Search by facility name, taluka, or address...',
    districtLabel: 'District',
    allDistricts: 'All Districts',
    facilityTypeLabel: 'Facility Type',
    allTypes: 'All Types',
    emergencyOnlyFilter: '24x7 Emergency Only',
    listView: 'List View',
    mapView: 'Map View',
    matchingFacilitiesCount: 'public healthcare facilities matching filters',
    doctorAvailableToday: 'Doctor Available Today',
    availableToday: 'Available Today',
    onDutyNow: 'On Duty Now',
    emergency24x7: '24/7 Emergency',
    queueWaitMin: 'Min Wait',
    viewDetails: 'Details',
    getDirections: 'Get Directions',
    callFacility: 'Call Facility',
    viewInventory: 'View Inventory',
    noFacilitiesFound: 'No public facilities found matching the selected filters.',

    facilityDetailsTitle: 'Facility Details & Clinical Roster',
    doctorsAvailableHeader: 'DOCTORS AVAILABLE TODAY',
    servicesOfferedHeader: 'FACILITY SERVICES & DEPARTMENTS',
    contactEmergencyHeader: 'CONTACT & EMERGENCY INFORMATION',
    phoneLabel: 'Phone',

    liveQueueTitle: 'Live OPD Queue Tracker',
    liveQueueSubtitle:
      'Real-time outpatient department queue tracking, estimated wait times, and direct facility navigation.',
    yourReservedToken: 'Your Reserved Token',
    waitingInQueue: 'Waiting in Queue',
    nowInRoom: 'Now In Consultation Room',
    activeStatus: 'Active',
    tokenNumberLabel: 'Token Number',
    tokenIdLabel: 'Token ID',
    patientsAheadLabel: 'Patients Ahead of You',
    estimatedWaitTimeLabel: 'Estimated Waiting Time',
    audioAnnouncement: 'Audio Announcement',
    playingAudio: 'Playing Announcement...',
    nowInConsultationRoom: 'Now In Consultation Room',
    liveCounter: 'Live Counter',
    currentlyWithDoctor: 'Currently with Doctor',
    noActiveTokenYet: 'No active queue token currently reserved.',
    routeToFacility: 'In-App Route & Facility Navigation',
    startNavigation: 'Start Navigation',
    stopNavigation: 'Stop Navigation',
    distanceLabel: 'Distance',
    travelTimeLabel: 'Travel Time',
    recentAssessmentCard: 'RECENT HEALTH ASSESSMENT',
    upcomingApptCard: 'UPCOMING APPOINTMENT',
    referralsFollowUpCard: 'REFERRALS & FOLLOW-UP',
    noRecentAssessment: 'No health assessment recorded yet.',
    noUpcomingAppointment: 'No scheduled appointment found.',
    noActiveReferral: 'No active referrals on file.',

    recordsTitle: 'Longitudinal Health Records',
    recordsSubtitle:
      'Complete chronological clinical history across consultations, diagnoses, prescriptions, lab reports, referrals, and health assessments.',
    allHistoryTab: 'All History',
    consultationsTab: 'Consultations',
    prescriptionsTab: 'Prescriptions',
    diagnosticsTab: 'Lab & Diagnostics',
    referralsTab: 'Referrals',
    assessmentsTab: 'Health Assessments',
    noRecordsInTab: 'No clinical records recorded for this category yet.',
    dateLabel: 'Date',
    doctorLabel: 'Doctor',
    facilityLabel: 'Facility',
    statusLabel: 'Status',
    downloadReport: 'Download PDF',

    profileTitle: 'Patient Profile',
    personalInfo: 'Personal Information',
    genderLabel: 'Gender',
    ageLabel: 'Age',
    addressLabel: 'Address',
    emergencyContactLabel: 'Emergency Contact',
    consentActive: 'ABDM Consent Active',

    citizenPatientTab: 'Citizen / Patient',
    facilityStaffTab: 'Facility Staff',
    medicalDoctorTab: 'Medical Doctor',
    adminRoleTab: 'Admin & State',
    patientLoginTitle: 'Patient Login',
    patientLoginSubtitle:
      'Access your ABHA records, OPD appointments, live queue tokens, and digital health triage.',
    enterPatientIdPlaceholder: 'Enter Seva Health Patient ID (e.g. P-10452)',
    sendOtpBtn: 'Send OTP',
    enterOtpPrompt: 'Enter 6-Digit OTP',
    verifyOtpBtn: 'Verify OTP & Sign In',
    newPatientPrompt: 'New Patient?',
    registerNowBtn: 'Register Now',
    staffIdPlaceholder: 'Enter Staff ID (e.g. usr-staff-1)',
    passwordPlaceholder: 'Enter Password',
    signInBtn: 'Sign In',
    emergencyAssistance108: 'Call 108 Emergency',

    patientsServed: 'Citizens Benefited',
    waitingTimeReduction: 'Average Wait Time',
    referralCompletion: 'Referral Completion',
    travelSaved: 'Travel Distance Saved',
    howItWorksTitle: 'A Connected Healthcare Continuum',
    step1: '1. Discover',
    step1Desc: 'Locate nearby Sub-Centres, PHCs, Rural & District Hospitals with live doctor and bed status.',
    step2: '2. Book & Token',
    step2Desc: 'Reserve appointment slots and receive real-time queue tokens before traveling.',
    step3: '3. Consult',
    step3Desc: 'Consult medical officers in-person or assisted teleconsultation via ASHA workers.',
    step4: '4. Coordinate',
    step4Desc: 'Seamless digital diagnostic orders, medicine availability, and tertiary hospital referrals.',
    step5: '5. Follow Up',
    step5Desc: 'Track maternal, child, and chronic conditions via automated alerts and home visits.',
    emergencyCall108: 'Call 108 Ambulance',
    disclaimerText:
      'Decision support and care guidance prototype. Clinical decisions remain with authorized medical officers.',

    // Supplementary / Shared Aliases
    appTagline: 'Healthcare access should not depend on where you live.',
    selectRole: 'Select your role to access the platform:',
    profileDrawerTitle: 'Patient Profile & ABHA Identity',
    facilityDirectoryTitle: 'Public Health Facility Directory',
    facilityDirectorySubtitle:
      'Find nearby Sub-Centres, PHCs, Rural & District Hospitals across Maharashtra with live doctor availability and directions.',
    searchFacilitiesPlaceholder: 'Search hospital name, taluka, or address...',
    districtFilterLabel: 'District',
    typeFilterLabel: 'Facility Type',
    allFacilityTypes: 'All Types',
    subCentres: 'Sub Centres',
    primaryHealthCentres: 'Primary Health Centres (PHC)',
    communityHealthCentres: 'Community Health Centres (CHC)',
    ruralHospitals: 'Rural Hospitals (RH)',
    subDistrictHospitals: 'Sub-District Hospitals (SDH)',
    districtHospitals: 'District Hospitals (DH)',
    facilitiesMap: 'Public Health Facilities Map',
    facilitiesShown: 'facilities shown',
    loadingDirectory: 'Loading public healthcare directory...',
    noFacilitiesMatched: 'No public health facilities match your search criteria.',
    emergency24x7Badge: '24/7 Emergency',
    detailsBtn: 'Details',
    getDirectionsBtn: 'Get Directions',
    callFacilityBtn: 'Call Facility',
    loadingDetails: 'Loading details...',
    emergencyServicesAvailable: '24x7 Emergency Services Available',
    daytimeOpd: 'Daytime OPD & Outpatient Services',
    helpdeskPhone: 'Helpdesk Phone',
    doctorsAvailableToday: 'Doctors Available Today',
    dutyRosterFor: 'Duty roster for',
    available: 'Available',
    noDoctorsScheduledToday: 'No doctors scheduled on duty today.',
    emergencyStaffActive: 'Emergency medical officer & nursing staff on active rotation.',
    realTimeTokenSystem: 'Real-Time Token System',
    liveOpdQueueTracker: 'Live OPD Queue Tracker',
    currentQueueUpdatesFor: 'Live Outpatient Department (OPD) queue updates, real-time wait estimation, and route guidance for',
    liveFacilityNavigation: 'Live Facility Navigation',
    tokenId: 'Token ID',
    counterLabel: 'Counter',
    estimatedWait: 'Estimated Wait',
    patientsAhead: 'Patients Ahead',
    doctorOnDuty: 'Doctor on Duty',
    tokenApproachingNotice: 'Your token is approaching! Please be seated near OPD Consultation Room 3.',
    todaysOpdQueueRoster: "Today's OPD Queue Roster",
    tokenHash: 'Token #',
    patientName: 'Patient Name',
    departmentPriority: 'Dept / Priority',
    status: 'Status',
    consultingDoctor: 'Consulting Doctor',
    appointmentsReferralsFollowups: 'Appointments, Referrals & Follow-ups',
    recentHealthAssessment: 'Recent Health Assessment',
    retakeAssessment: 'Retake Assessment',
    upcomingAppointment: 'Upcoming Appointment',
    trackQueue: 'Track Queue',
    bookNewSlot: 'Book New Slot',
    referralsFollowUp: 'Referrals & Follow-up',
    viewCareReferrals: 'View Care Referrals',
    longitudinalHealthRecords: 'Longitudinal Health Records',
    patientHealthTimeline: 'Patient Health Timeline',
    completeHistoryDesc:
      'Complete chronological history of consultations, diagnoses, prescriptions, lab tests, referrals, and triage assessments under ABHA ecosystem.',
    printTimeline: 'Print Timeline',
    exportHealthSummary: 'Export Health Summary',
    consultations: 'Consultations',
    clinicalOpdEncounters: 'Clinical OPD encounters',
    labReports: 'Lab Reports',
    diagnosticInvestigations: 'Diagnostic investigations',
    activePrescriptions: 'Active Prescriptions',
    ongoingDispensedMedications: 'Ongoing & dispensed medications',
    interFacilityTransfers: 'Inter-facility transfers',
    filterRecords: 'Filter Records:',
    allHistory: 'All History',
    labDiagnostics: 'Lab & Diagnostics',
    loadingRecords: 'Loading longitudinal health records...',
    noRecordsFound: 'No medical records found matching the selected filter.',
    active: 'Active',
    startHealthAssessment: 'Start Health Assessment',
    emergency24x7Btn: 'Emergency 24X7',
    emergencyResponseBadge: '24/7 IMMEDIATE EMERGENCY PROTOCOL',
    emergencyAssistanceDesc: 'Need immediate help? Get emergency assistance and 108 ambulance dispatch now.',
    findNearestEmergencyFacility: 'Find Nearest Emergency Facility',
    confirmAppointment: 'Confirm Appointment',
    selectDoctor: 'Select Doctor',
    selectDate: 'Select Date',
    availableSlots: 'Available Slots',
    appointmentConfirmed: 'Appointment Confirmed',
    viewAppointment: 'View Appointment',
    trackLiveQueue: 'Track Live Queue',
    registeredMobile: 'Registered Mobile',
    generalOpdDoctor: 'General OPD / Duty Medical Officer',
    timeSlot: 'Time Slot',
    upcomingAppointments: 'Upcoming Appointments',
    confirmed: 'Confirmed',
    tellUsAboutSymptoms: 'Tell us about your symptoms',
    symptomsIntro: 'Before booking your appointment, tell us what you are experiencing so we can guide you toward the appropriate care.',
    startSymptomAssessment: 'Start Symptom Assessment',
    describeSymptoms: 'Describe Symptoms',
    describeSymptomsPrompt: 'What symptoms are you experiencing?',
    symptomPlaceholder: 'Example: fever, cough, headache, stomach pain, body ache...',
    durationPrompt: 'How long have you had these symptoms?',
    severityPrompt: 'How severe are the symptoms?',
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe',
    continueBtn: 'Continue',
    previousBtn: 'Previous',
    emergencyCareRecommended: 'EMERGENCY CARE RECOMMENDED',
    emergencyWarningText: 'Your response may indicate a symptom that requires immediate medical attention. Please seek emergency medical care.',
    emergencyAssistanceBtn: 'Emergency Assistance',
    symptomSummary: 'Symptom Summary',
    reportedSymptoms: 'Reported symptoms',
    preliminaryCareGuidance: 'Preliminary Care Guidance',
    preliminaryGuidanceDisclaimer: 'This is preliminary guidance and does not replace examination by a qualified healthcare professional.',
    continueBooking: 'Continue Booking',
    appointmentSummary: 'Appointment Summary',
    stepIndicator: 'Step',
    specialtyLabel: 'Specialty',
    patientDetails: 'Patient Details',
    appointmentsTitle: 'Appointments',
    noUpcomingAppointments: 'No upcoming appointments',
    noAppointmentsBookedYet: 'You have not booked any appointments yet.',
    cancelAppointment: 'Cancel Appointment',
    appointmentCancelled: 'Appointment cancelled successfully',
    findNearbyFacility: 'Find Nearby Facility',
    noActiveReferrals: 'No active referrals',
    noActiveReferralsDesc: 'You currently have no active care referrals.',
    activePathway: 'Active Pathway',
    sourceLabel: 'Source',
    referredFrom: 'Referred from',
    closedLoopActive: 'Closed-Loop Referral Tracking Active',
    upcomingAppointmentCompact: 'Upcoming Appointment',
    referralId: 'Referral ID',
    referralStatus: 'Referral Status',
    referralReason: 'Referral Reason'
  },

  mr: {
    appTitle: 'AROHA+',
    appSubtitle: 'एकात्मिक ग्रामीण सार्वजनिक आरोग्य समन्वय व्यासपीठ',
    tagline: 'आरोग्य सेवा ही आपण कुठे राहता यावर अवलंबून नसावी.',
    governmentOfMaharashtra: 'सेवा आरोग्य मंच',
    deptTitle: 'एकात्मिक सार्वजनिक डिजिटल आरोग्य व्यासपीठ',
    platformHome: 'प्लॅटफॉर्म होम',
    hospitalManagement: 'रुग्णालय व्यवस्थापन',
    emergencyHelp: 'तातडीची मदत २४x७',

    findHealthcare: 'जवळचे आरोग्य केंद्र शोधा',
    bookAppointment: 'अपॉइंटमेंट बुक करा',
    liveQueue: 'थेट टोकन रांग',
    myRecords: 'दीर्घकालीन आरोग्य नोंदी',
    referrals: 'रुग्णालय रेफरल्स',
    medicines: 'इन्व्हेंटरी (साठा)',
    triageAssistant: 'लक्षणे तपासा',
    ashaCommunity: 'आशा सेविका पोर्टल',
    doctorOpd: 'डॉक्टर ओपीडी',
    adminDashboard: 'आरोग्य नियंत्रण कक्ष',
    lowLiteracyMode: 'सुलभ आवाज / चिन्ह मोड',
    switchRole: 'भूमिका बदला',

    signOut: 'साइन आउट',
    confirmSignOut: 'साइन आउटची पुष्टी करा',
    signOutPrompt: 'तुम्हाला नक्की साइन आउट करायचे आहे का? तुमचे सत्र सुरक्षितपणे बंद केले जाईल.',
    cancel: 'रद्द करा',
    close: 'बंद करा',
    refresh: 'रिफ्रेश करा',
    refreshing: 'माहिती अद्यतनित होत आहे...',

    welcome: 'स्वागत आहे',
    abhaActive: 'आभा सक्रिय',
    patientLabel: 'रुग्ण',
    patientIdLabel: 'सेवा हेल्थ रुग्ण आयडी',
    abhaIdLabel: 'आभा आयडी',
    bloodGroupLabel: 'रक्तगट',
    locationLabel: 'ठिकाण',

    preliminaryTriageBadge: 'प्राथमिक डिजिटल ट्रायज सहाय्य',
    checkYourSymptoms: 'तुमची लक्षणे तपासा',
    checkSymptomsDesc:
      'तुमच्या आजाराच्या लक्षणांविषयी काही सोप्या प्रश्नांची उत्तरे द्या. सेवा हेल्थ तुम्हाला योग्य उपचार पातळी आणि जवळच्या शासकीय आरोग्य केंद्राची शिफारस करेल.',
    checkYourSymptomsBtn: 'लक्षणे तपासा',

    yourHealthcareServices: 'तुमच्या आरोग्य सेवा',
    servicesDesc:
      'जवळच्या शासकीय आरोग्य सुविधा, थेट ओपीडी टोकन रांग, मोफत औषध साठा आणि वैद्यकीय नोंदींची माहिती.',
    facilityDirectoryCardTitle: 'जवळचे आरोग्य केंद्र शोधा',
    facilityDirectoryCardDesc:
      'उप-केंद्रे, प्राथमिक आरोग्य केंद्रे, ग्रामीण व जिल्हा रुग्णालये, आज उपलब्ध असलेले डॉक्टर आणि थेट नकाशा दिशा.',
    exploreFacilities: 'आरोग्य केंद्रे पहा',

    liveQueueCardTitle: 'थेट ओपीडी टोकन रांग',
    liveQueueCardDesc:
      'तुमचा ओपीडी टोकन क्रमांक थेट ट्रॅक करा, तपासणी सुरू असलेले डॉक्टर पहा, प्रतीक्षा वेळेचा अंदाज घ्या आणि ध्वनी घोषणा ऐका.',
    openLiveTracker: 'थेट रांग पहा',

    inventoryCardTitle: 'औषध साठा व इन्व्हेंटरी',
    inventoryCardDesc:
      'जिल्ह्यातील शासकीय रुग्णालयांमध्ये मोफत उपलब्ध असणाऱ्या आवश्यक औषधांचा, चाचण्यांचा आणि उपकरणांचा थेट साठा.',
    checkStock: 'साठा तपासा',

    recordsCardTitle: 'दीर्घकालीन आरोग्य नोंदी',
    recordsCardDesc:
      'डॉक्टरांच्या तपासण्या, डिजिटल औषधोपचार चिठ्ठ्या, लॅब रिपोर्ट, रेफरल इतिहास आणि लक्षण तपासणीचे संपूर्ण रेकॉर्ड.',
    viewRecords: 'नोंदी पहा',

    directoryTitle: 'सार्वजनिक आरोग्य सुविधा निर्देशिका',
    directorySubtitle:
      'महाराष्ट्रातील शासकीय उपकेंद्रे, प्राथमिक आरोग्य केंद्रे, ग्रामीण आणि जिल्हा रुग्णालये थेट डॉक्टर उपलब्धता व नकाशासह शोधा.',
    searchFacilityPlaceholder: 'रुग्णालयाचे नाव, तालुका किंवा पत्ता शोधा...',
    districtLabel: 'जिल्हा',
    allDistricts: 'सर्व जिल्हे',
    facilityTypeLabel: 'आरोग्य केंद्र प्रकार',
    allTypes: 'सर्व प्रकार',
    emergencyOnlyFilter: 'फक्त २४x७ आपत्कालीन',
    listView: 'यादी पहा',
    mapView: 'नकाशा पहा',
    matchingFacilitiesCount: 'शासकीय आरोग्य सुविधा उपलब्ध',
    doctorAvailableToday: 'आज डॉक्टर उपलब्ध',
    availableToday: 'आज उपलब्ध',
    onDutyNow: 'सध्या कर्तव्यावर',
    emergency24x7: '२४/७ आपत्कालीन',
    queueWaitMin: 'मिनिटे प्रतीक्षा',
    viewDetails: 'तपशील',
    getDirections: 'दिशा मिळवा',
    callFacility: 'कॉल करा',
    viewInventory: 'इन्व्हेंटरी पहा',
    noFacilitiesFound: 'निवडलेल्या निकषांशी जुळणारे कोणतेही शासकीय केंद्र आढळले नाही.',

    facilityDetailsTitle: 'रुग्णालय तपशील व डॉक्टर रोस्टर',
    doctorsAvailableHeader: 'आज उपलब्ध असलेले डॉक्टर',
    servicesOfferedHeader: 'उपलब्ध आरोग्य सेवा व विभाग',
    contactEmergencyHeader: 'संपर्क व आपत्कालीन माहिती',
    phoneLabel: 'फोन',

    liveQueueTitle: 'थेट ओपीडी टोकन रांग ट्रॅकर',
    liveQueueSubtitle:
      'थेट बाह्यरुग्ण विभाग (OPD) रांग ट्रॅकिंग, अंदाजे प्रतीक्षा वेळ आणि थेट रुग्णालय नेव्हिगेशन.',
    yourReservedToken: 'तुमचे राखीव टोकन',
    waitingInQueue: 'रांगेत प्रतीक्षेत',
    nowInRoom: 'सध्या तपासणी सुरू असलेले टोकन',
    activeStatus: 'सक्रिय',
    tokenNumberLabel: 'टोकन क्रमांक',
    tokenIdLabel: 'टोकन आयडी',
    patientsAheadLabel: 'तुमच्यापुढील रुग्ण',
    estimatedWaitTimeLabel: 'अंदाजे प्रतीक्षा वेळ',
    audioAnnouncement: 'ध्वनी घोषणा',
    playingAudio: 'घोषणा सुरू आहे...',
    nowInConsultationRoom: 'सध्या तपासणी कक्षामध्ये',
    liveCounter: 'थेट काउंटर',
    currentlyWithDoctor: 'डॉक्टरांकडे उपस्थित',
    noActiveTokenYet: 'सध्या कोणतेही सक्रिय रांग टोकन राखीव नाही.',
    routeToFacility: 'थेट इन-अॅप नकाशा व नेव्हिगेशन',
    startNavigation: 'नेव्हिगेशन सुरू करा',
    stopNavigation: 'नेव्हिगेशन थांबवा',
    distanceLabel: 'अंतर',
    travelTimeLabel: 'प्रवासाचा वेळ',
    recentAssessmentCard: 'अलीकडील आरोग्य तपासणी',
    upcomingApptCard: 'आगामी तपासणी भेट',
    referralsFollowUpCard: 'रेफरल्स आणि पाठपुरावा',
    noRecentAssessment: 'अद्याप कोणतीही आरोग्य तपासणी नोंदवलेली नाही.',
    noUpcomingAppointment: 'कोणतीही नियोजित भेट नाही.',
    noActiveReferral: 'कोणताही सक्रिय रेफरल उपलब्ध नाही.',

    recordsTitle: 'दीर्घकालीन आरोग्य नोंदी',
    recordsSubtitle:
      'वैद्यकीय तपासण्या, आजार निदान, औषधोपचार, प्रयोगशाळा चाचण्या, रेफरल्स आणि आरोग्य तपासणीचा संपूर्ण इतिहास.',
    allHistoryTab: 'सर्व इतिहास',
    consultationsTab: 'वैद्यकीय तपासण्या',
    prescriptionsTab: 'औषध चिठ्ठी',
    diagnosticsTab: 'लॅब व तपासण्या',
    referralsTab: 'रेफरल्स',
    assessmentsTab: 'आरोग्य तपासण्या',
    noRecordsInTab: 'या प्रकारात अद्याप कोणत्याही नोंदी उपलब्ध नाहीत.',
    dateLabel: 'दिनांक',
    doctorLabel: 'डॉक्टर',
    facilityLabel: 'रुग्णालय',
    statusLabel: 'स्थिती',
    downloadReport: 'पीडीएफ डाउनलोड करा',

    profileTitle: 'रुग्ण प्रोफाइल',
    personalInfo: 'वैयक्तिक माहिती',
    genderLabel: 'लिंग',
    ageLabel: 'वय',
    addressLabel: 'पत्ता',
    emergencyContactLabel: 'आपत्कालीन संपर्क',
    consentActive: 'आभा संमती सक्रिय',

    citizenPatientTab: 'नागरिक / रुग्ण',
    facilityStaffTab: 'रुग्णालय कर्मचारी',
    medicalDoctorTab: 'वैद्यकीय अधिकारी (डॉक्टर)',
    adminRoleTab: 'प्रशासक व राज्य कक्ष',
    patientLoginTitle: 'रुग्ण लॉगिन',
    patientLoginSubtitle:
      'तुमचे आभा रेकॉर्ड, ओपीडी अपॉइंटमेंट, थेट टोकन आणि डिजिटल आरोग्य तपासणीसाठी लॉगिन करा.',
    enterPatientIdPlaceholder: 'सेवा हेल्थ रुग्ण आयडी टाका (उदा. P-10452)',
    sendOtpBtn: 'ओटीपी पाठवा',
    enterOtpPrompt: '६-अंकी ओटीपी टाका',
    verifyOtpBtn: 'ओटीपी पडताळा व लॉगिन करा',
    newPatientPrompt: 'नवीन रुग्ण आहात का?',
    registerNowBtn: 'नवीन नोंदणी करा',
    staffIdPlaceholder: 'कर्मचारी आयडी टाका (उदा. usr-staff-1)',
    passwordPlaceholder: 'पासवर्ड टाका',
    signInBtn: 'लॉगिन करा',
    emergencyAssistance108: '१०८ रुग्णवाहिका कॉल करा',

    patientsServed: 'उपचार घेतलेले नागरिक',
    waitingTimeReduction: 'सरासरी प्रतीक्षा वेळ',
    referralCompletion: 'रेफरल पूर्णता दर',
    travelSaved: 'वाचलेले अंतर व वेळ',
    howItWorksTitle: 'एकात्मिक आरोग्य सेवा साखळी',
    step1: '१. शोधा',
    step1Desc: 'जवळचे उपकेंद्र, प्राथमिक आरोग्य केंद्र किंवा जिल्हा रुग्णालय थेट बेड व डॉक्टरांच्या माहितीसह शोधा.',
    step2: '२. वेळ व टोकन',
    step2Desc: 'घरी बसून तपासणीची वेळ व डिजिटल टोकन मिळवा, जेणेकरून रांगेत थांबावे लागणार नाही.',
    step3: '३. तपासणी',
    step3Desc: 'वैद्यकीय अधिकाऱ्यांकडून थेट किंवा आशा सेविकेच्या मदतीने टेलिकन्सल्टेशनद्वारे सल्ला घ्या.',
    step4: '४. औषधे व रेफरल',
    step4Desc: 'मोफत औषधांचा साठा, लॅब चाचण्या आणि जिल्हा रुग्णालयासाठी डिजिटल रेफरलची सोय.',
    step5: '५. पाठपुरावा',
    step5Desc: 'माता-बाल संगोपन आणि दीर्घ आजारांसाठी नियमित गृहभेटी व आठवण संदेश.',
    emergencyCall108: '१०८ रुग्णवाहिका बोलवा',
    disclaimerText:
      'आरोग्य निर्णय सहाय्य व ट्रायज मार्गदर्शक प्रणाली. सर्व वैद्यकीय निर्णय पात्र डॉक्टरांच्या मार्गदर्शनाखालीच घेतले जातात.',

    // Supplementary / Shared Aliases
    appTagline: 'आरोग्य सेवा ही आपण कुठे राहता यावर अवलंबून नसावी.',
    selectRole: 'व्यासपीठावर प्रवेश करण्यासाठी तुमची भूमिका निवडा:',
    profileDrawerTitle: 'रुग्ण प्रोफाइल आणि आभा ओळख',
    facilityDirectoryTitle: 'सार्वजनिक आरोग्य सुविधा निर्देशिका',
    facilityDirectorySubtitle:
      'महाराष्ट्रातील शासकीय उपकेंद्रे, प्राथमिक आरोग्य केंद्रे, ग्रामीण आणि जिल्हा रुग्णालये थेट डॉक्टर उपलब्धता व नकाशासह शोधा.',
    searchFacilitiesPlaceholder: 'रुग्णालयाचे नाव, तालुका किंवा पत्ता शोधा...',
    districtFilterLabel: 'जिल्हा',
    typeFilterLabel: 'आरोग्य केंद्र प्रकार',
    allFacilityTypes: 'सर्व प्रकार',
    subCentres: 'उपकेंद्रे',
    primaryHealthCentres: 'प्राथमिक आरोग्य केंद्रे (PHC)',
    communityHealthCentres: 'समुदाय आरोग्य केंद्रे (CHC)',
    ruralHospitals: 'ग्रामीण रुग्णालये (RH)',
    subDistrictHospitals: 'उप-जिल्हा रुग्णालये (SDH)',
    districtHospitals: 'जिल्हा रुग्णालये (DH)',
    facilitiesMap: 'सार्वजनिक आरोग्य केंद्र नकाशा',
    facilitiesShown: 'केंद्रे दर्शविली आहेत',
    loadingDirectory: 'सार्वजनिक आरोग्य निर्देशिका लोड होत आहे...',
    noFacilitiesMatched: 'निवडलेल्या निकषांशी जुळणारे कोणतेही शासकीय केंद्र आढळले नाही.',
    emergency24x7Badge: '२४/७ आपत्कालीन',
    detailsBtn: 'तपशील',
    getDirectionsBtn: 'दिशा मिळवा',
    callFacilityBtn: 'कॉल करा',
    loadingDetails: 'तपशील लोड होत आहेत...',
    emergencyServicesAvailable: '२४x७ आपत्कालीन सेवा उपलब्ध',
    daytimeOpd: 'दिवसाची ओपीडी व बाह्यरुग्ण सेवा',
    helpdeskPhone: 'मदत कक्ष फोन',
    doctorsAvailableToday: 'आज उपलब्ध असलेले डॉक्टर',
    dutyRosterFor: 'आजचे ड्युटी रोस्टर',
    available: 'उपलब्ध',
    noDoctorsScheduledToday: 'आज कर्तव्यावर कोणतेही डॉक्टर नियोजित नाहीत.',
    emergencyStaffActive: 'आपत्कालीन वैद्यकीय अधिकारी आणि नर्सिंग कर्मचारी सक्रिय कर्तव्यावर आहेत.',
    realTimeTokenSystem: 'थेट टोकन प्रणाली',
    liveOpdQueueTracker: 'थेट ओपीडी रांग ट्रॅकर',
    currentQueueUpdatesFor: 'थेट बाह्यरुग्ण विभाग (ओपीडी) रांग अद्यतने, अंदाजे प्रतीक्षा वेळ आणि मार्गदर्शनासाठी',
    liveFacilityNavigation: 'थेट रुग्णालय नेव्हिगेशन',
    tokenId: 'टोकन आयडी',
    counterLabel: 'काउंटर',
    estimatedWait: 'अंदाजे प्रतीक्षा',
    patientsAhead: 'पुढील रुग्ण',
    doctorOnDuty: 'कर्तव्यावर असलेले डॉक्टर',
    tokenApproachingNotice: 'तुमचा टोकन क्रमांक जवळ येत आहे! कृपया ओपीडी तपासणी कक्ष ३ जवळ बसा.',
    todaysOpdQueueRoster: 'आजचे ओपीडी रांग रोस्टर',
    tokenHash: 'टोकन #',
    patientName: 'रुग्णाचे नाव',
    departmentPriority: 'विभाग / प्राधान्य',
    status: 'स्थिती',
    consultingDoctor: 'तपासणी डॉक्टर',
    appointmentsReferralsFollowups: 'अपॉइंटमेंट्स, रेफरल्स आणि पाठपुरावा',
    recentHealthAssessment: 'अलीकडील आरोग्य तपासणी',
    retakeAssessment: 'पुन्हा तपासणी करा',
    upcomingAppointment: 'आगामी भेट',
    trackQueue: 'रांग ट्रॅक करा',
    bookNewSlot: 'नवीन वेळ बुक करा',
    referralsFollowUp: 'रेफरल्स आणि पाठपुरावा',
    viewCareReferrals: 'रेफरल्स पहा',
    longitudinalHealthRecords: 'दीर्घकालीन आरोग्य नोंदी',
    patientHealthTimeline: 'रुग्ण आरोग्य टाइमलाइन',
    completeHistoryDesc:
      'आभा परिसंस्थेअंतर्गत वैद्यकीय सल्लामसलत, निदान, औषधोपचार, लॅब चाचण्या, रेफरल्स आणि ट्रायज मूल्यांकनाचा संपूर्ण कालक्रमानुसार इतिहास.',
    printTimeline: 'टाइमलाइन प्रिंट करा',
    exportHealthSummary: 'आरोग्य सारांश निर्यात करा',
    consultations: 'वैद्यकीय सल्ला',
    clinicalOpdEncounters: 'क्लिनिकल ओपीडी तपासण्या',
    labReports: 'लॅब रिपोर्ट्स',
    diagnosticInvestigations: 'रोगनिदान चाचण्या',
    activePrescriptions: 'सक्रिय औषधोपचार',
    ongoingDispensedMedications: 'सुरू असलेली व दिलेली औषधे',
    interFacilityTransfers: 'आंतर-रुग्णालय बदल्या',
    filterRecords: 'नोंदी फिल्टर करा:',
    allHistory: 'सर्व इतिहास',
    labDiagnostics: 'लॅब व तपासण्या',
    loadingRecords: 'दीर्घकालीन आरोग्य नोंदी लोड होत आहेत...',
    noRecordsFound: 'निवडलेल्या फिल्टरशी जुळणाऱ्या कोणत्याही वैद्यकीय नोंदी आढळल्या नाहीत.',
    active: 'सक्रिय',
    startHealthAssessment: 'आरोग्य तपासणी सुरू करा',
    emergency24x7Btn: 'आपत्कालीन मदत 24x7',
    emergencyResponseBadge: '२४/७ तातडीची आपत्कालीन प्रणाली',
    emergencyAssistanceDesc: 'तातडीची मदत हवी आहे? त्वरित आपत्कालीन सहाय्य व १०८ रुग्णवाहिका मिळवा.',
    findNearestEmergencyFacility: 'जवळचे आपत्कालीन केंद्र शोधा',
    confirmAppointment: 'अपॉइंटमेंटची पुष्टी करा',
    selectDoctor: 'डॉक्टर निवडा',
    selectDate: 'तारीख निवडा',
    availableSlots: 'उपलब्ध वेळ',
    appointmentConfirmed: 'अपॉइंटमेंटची पुष्टी झाली',
    viewAppointment: 'अपॉइंटमेंट पहा',
    trackLiveQueue: 'थेट रांग ट्रॅक करा',
    registeredMobile: 'नोंदणीकृत मोबाईल',
    generalOpdDoctor: 'सामान्य ओपीडी / कर्तव्य वैद्यकीय अधिकारी',
    timeSlot: 'वेळेचा स्लॉट',
    upcomingAppointments: 'आगामी अपॉइंटमेंट्स',
    confirmed: 'पुष्टी झाली',
    tellUsAboutSymptoms: 'तुमच्या लक्षणांबद्दल सांगा',
    symptomsIntro: 'अपॉइंटमेंट बुक करण्यापूर्वी, तुम्हाला काय त्रास होत आहे ते सांगा जेणेकरून आम्ही योग्य उपचारासाठी मार्गदर्शन करू शकू.',
    startSymptomAssessment: 'लक्षण तपासणी सुरू करा',
    describeSymptoms: 'लक्षणांचे वर्णन करा',
    describeSymptomsPrompt: 'तुम्हाला काय लक्षणे जाणवत आहेत?',
    symptomPlaceholder: 'उदा. ताप, खोकला, डोकेदुखी, पोटदुखी, अंगदुखी...',
    durationPrompt: 'तुम्हाला ही लक्षणे किती दिवसांपासून आहेत?',
    severityPrompt: 'लक्षणांची तीव्रता किती आहे?',
    mild: 'सौम्य',
    moderate: 'मध्यम',
    severe: 'तीव्र',
    continueBtn: 'पुढे जा',
    previousBtn: 'मागे',
    emergencyCareRecommended: 'तातडीच्या आपत्कालीन उपचारांची आवश्यकता',
    emergencyWarningText: 'तुमच्या प्रतिसादानुसार तातडीने वैद्यकीय मदतीची गरज भासू शकते. कृपया तात्काळ आपत्कालीन उपचार घ्या.',
    emergencyAssistanceBtn: 'आपत्कालीन सहाय्य',
    symptomSummary: 'लक्षण सारांश',
    reportedSymptoms: 'नोंदवलेली लक्षणे',
    preliminaryCareGuidance: 'प्राथमिक काळजी मार्गदर्शन',
    preliminaryGuidanceDisclaimer: 'हे प्राथमिक मार्गदर्शन असून पात्र डॉक्टरांच्या प्रत्यक्ष तपासणीचा पर्याय नाही.',
    continueBooking: 'बुकिंग सुरू ठेवा',
    appointmentSummary: 'अपॉइंटमेंट सारांश',
    stepIndicator: 'टप्पा',
    specialtyLabel: 'विशेषज्ञता',
    patientDetails: 'रुग्ण तपशील',
    appointmentsTitle: 'अपॉइंटमेंट्स',
    noUpcomingAppointments: 'कोणतेही आगामी अपॉइंटमेंट नाही',
    noAppointmentsBookedYet: 'तुम्ही अद्याप कोणतीही अपॉइंटमेंट बुक केलेली नाही.',
    cancelAppointment: 'अपॉइंटमेंट रद्द करा',
    appointmentCancelled: 'अपॉइंटमेंट यशस्वीपणे रद्द केली',
    findNearbyFacility: 'जवळचे आरोग्य केंद्र शोधा',
    noActiveReferrals: 'कोणतेही सक्रिय रेफरल्स नाहीत',
    noActiveReferralsDesc: 'तुमच्याकडे सध्या कोणतेही सक्रिय केअर रेफरल्स नाहीत.',
    activePathway: 'सक्रिय मार्ग',
    sourceLabel: 'स्रोत',
    referredFrom: 'येथून संदर्भित',
    closedLoopActive: 'क्लोज्ड-लूप रेफरल ट्रॅकिंग सक्रिय',
    upcomingAppointmentCompact: 'आगामी भेट',
    referralId: 'संदर्भ आयडी',
    referralStatus: 'संदर्भ स्थिती',
    referralReason: 'संदर्भाचे कारण'
  },

  hi: {
    appTitle: 'AROHA+',
    appSubtitle: 'एकीकृत ग्रामीण सार्वजनिक स्वास्थ्य समन्वय मंच',
    tagline: 'स्वास्थ्य सेवा इस बात पर निर्भर नहीं होनी चाहिए कि आप कहाँ रहते हैं।',
    governmentOfMaharashtra: 'सेवा स्वास्थ्य मंच',
    deptTitle: 'एकीकृत सार्वजनिक डिजिटल स्वास्थ्य मंच',
    platformHome: 'प्लेटफॉर्म होम',
    hospitalManagement: 'अस्पताल प्रबंधन',
    emergencyHelp: 'आपातकालीन सहायता २४x७',

    findHealthcare: 'नज़दीकी स्वास्थ्य केंद्र खोजें',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    liveQueue: 'लाइव टोकन कतार',
    myRecords: 'संपूर्ण स्वास्थ्य रिकॉर्ड',
    referrals: 'अस्पताल रेफरल ट्रैकिंग',
    medicines: 'इन्वेंट्री (दवा स्टॉक)',
    triageAssistant: 'लक्षणों की जांच करें',
    ashaCommunity: 'आशा कार्यकर्ता पोर्टल',
    doctorOpd: 'डॉक्टर ओपीडी',
    adminDashboard: 'राज्य नियंत्रण केंद्र',
    lowLiteracyMode: 'सरल आवाज / प्रतीक मोड',
    switchRole: 'भूमिका बदलें',

    signOut: 'साइन आउट',
    confirmSignOut: 'साइन आउट की पुष्टि करें',
    signOutPrompt: 'क्या आप वाकई साइन आउट करना चाहते हैं? आपका सत्र सुरक्षित रूप से समाप्त कर दिया जाएगा।',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    refresh: 'रिफ्रेश करें',
    refreshing: 'जानकारी अपडेट हो रही है...',

    welcome: 'स्वागत है',
    abhaActive: 'आभा सक्रिय',
    patientLabel: 'मरीज',
    patientIdLabel: 'सेवा हेल्थ मरीज आईडी',
    abhaIdLabel: 'आभा आईडी',
    bloodGroupLabel: 'रक्त समूह',
    locationLabel: 'स्थान',

    preliminaryTriageBadge: 'प्रारंभिक डिजिटल ट्राइएज सहायता',
    checkYourSymptoms: 'अपने लक्षणों की जांच करें',
    checkSymptomsDesc:
      'अपने लक्षणों के बारे में कुछ सरल प्रश्नों के उत्तर दें। सेवा हेल्थ आपको उचित देखभाल स्तर और नजदीकी सरकारी स्वास्थ्य केंद्र की सिफारिश करेगा।',
    checkYourSymptomsBtn: 'लक्षण जांचें',

    yourHealthcareServices: 'आपकी स्वास्थ्य सेवाएं',
    servicesDesc:
      'नज़दीकी सरकारी स्वास्थ्य केंद्रों, वास्तविक समय ओपीडी टोकन कतार, मुफ्त दवा स्टॉक और संपूर्ण मेडिकल रिकॉर्ड तक सीधी पहुंच।',
    facilityDirectoryCardTitle: 'नज़दीकी स्वास्थ्य केंद्र खोजें',
    facilityDirectoryCardDesc:
      'उप-केंद्र, पीएचसी, ग्रामीण और जिला अस्पतालों की सूची, लाइव डॉक्टर रोस्टर और सीधे इन-ऐप नेविगेशन रूट।',
    exploreFacilities: 'अस्पताल देखें',

    liveQueueCardTitle: 'लाइव ओपीडी टोकन कतार',
    liveQueueCardDesc:
      'अपने ओपीडी टोकन नंबर को लाइव ट्रैक करें, डॉक्टर परामर्श की स्थिति देखें, प्रतीक्षा समय जानें और ऑडियो घोषणा सुनें।',
    openLiveTracker: 'लाइव ट्रैकर खोलें',

    inventoryCardTitle: 'दवा स्टॉक और इन्वेंट्री',
    inventoryCardDesc:
      'जिले के सरकारी अस्पतालों में आवश्यक दवाओं, लैब जांच सामग्री और चिकित्सा उपकरणों की लाइव उपलब्धता।',
    checkStock: 'स्टॉक देखें',

    recordsCardTitle: 'संपूर्ण स्वास्थ्य रिकॉर्ड',
    recordsCardDesc:
      'डॉक्टर परामर्श, डिजिटल नुस्खे, लैब जांच रिपोर्ट और अस्पताल रेफरल का संपूर्ण कालानुक्रमिक इतिहास।',
    viewRecords: 'रिकॉर्ड देखें',

    directoryTitle: 'सार्वजनिक स्वास्थ्य केंद्र निर्देशिका',
    directorySubtitle:
      'महाराष्ट्र भर में प्राथमिक स्वास्थ्य केंद्र, उप-केंद्र, ग्रामीण और जिला अस्पताल लाइव डॉक्टर और आपातकालीन सुविधा के साथ खोजें।',
    searchFacilityPlaceholder: 'अस्पताल का नाम, तालुका या पता खोजें...',
    districtLabel: 'जिला',
    allDistricts: 'सभी जिले',
    facilityTypeLabel: 'स्वास्थ्य केंद्र प्रकार',
    allTypes: 'सभी प्रकार',
    emergencyOnlyFilter: 'केवल 24x7 आपातकालीन',
    listView: 'सूची देखें',
    mapView: 'मानचित्र देखें',
    matchingFacilitiesCount: 'सरकारी स्वास्थ्य केंद्र उपलब्ध',
    doctorAvailableToday: 'आज डॉक्टर उपलब्ध',
    availableToday: 'आज उपलब्ध',
    onDutyNow: 'ड्यूटी पर उपस्थित',
    emergency24x7: '24/7 आपातकालीन',
    queueWaitMin: 'मिनट प्रतीक्षा',
    viewDetails: 'विवरण',
    getDirections: 'दिशा-निर्देश',
    callFacility: 'कॉल करें',
    viewInventory: 'इन्वेंट्री देखें',
    noFacilitiesFound: 'चुने गए फिल्टर के अनुसार कोई सरकारी अस्पताल नहीं मिला।',

    facilityDetailsTitle: 'अस्पताल विवरण एवं डॉक्टर रोस्टर',
    doctorsAvailableHeader: 'आज उपलब्ध डॉक्टर',
    servicesOfferedHeader: 'उपलब्ध स्वास्थ्य सेवाएं एवं विभाग',
    contactEmergencyHeader: 'संपर्क एवं आपातकालीन जानकारी',
    phoneLabel: 'फोन',

    liveQueueTitle: 'लाइव ओपीडी टोकन ट्रैकर',
    liveQueueSubtitle:
      'वास्तविक समय बाह्य रोगी विभाग (OPD) कतार ट्रैकिंग, अनुमानित प्रतीक्षा समय और अस्पताल नेविगेशन।',
    yourReservedToken: 'आपका आरक्षित टोकन',
    waitingInQueue: 'कतार में प्रतीक्षारत',
    nowInRoom: 'वर्तमान में डॉक्टर कक्ष में',
    activeStatus: 'सक्रिय',
    tokenNumberLabel: 'टोकन नंबर',
    tokenIdLabel: 'टोकन आईडी',
    patientsAheadLabel: 'आपसे पहले मरीज',
    estimatedWaitTimeLabel: 'अनुमानित प्रतीक्षा समय',
    audioAnnouncement: 'ऑडियो घोषणा',
    playingAudio: 'घोषणा चल रही है...',
    nowInConsultationRoom: 'वर्तमान में डॉक्टर कक्ष में',
    liveCounter: 'लाइव काउंटर',
    currentlyWithDoctor: 'डॉक्टर से परामर्श जारी',
    noActiveTokenYet: 'वर्तमान में कोई सक्रिय टोकन आरक्षित नहीं है।',
    routeToFacility: 'सीधा इन-ऐप नेविगेशन रूट',
    startNavigation: 'नेविगेशन शुरू करें',
    stopNavigation: 'नेविगेशन रोकें',
    distanceLabel: 'दूरी',
    travelTimeLabel: 'यात्रा समय',
    recentAssessmentCard: 'हालिया स्वास्थ्य जांच',
    upcomingApptCard: 'आगामी अपॉइंटमेंट',
    referralsFollowUpCard: 'रेफरल और फॉलो-अप',
    noRecentAssessment: 'अभी तक कोई स्वास्थ्य जांच रिकॉर्ड नहीं है।',
    noUpcomingAppointment: 'कोई आगामी अपॉइंटमेंट निर्धारित नहीं है।',
    noActiveReferral: 'कोई सक्रिय रेफरल नहीं है।',

    recordsTitle: 'संपूर्ण स्वास्थ्य रिकॉर्ड',
    recordsSubtitle:
      'डॉक्टर परामर्श, निदान, दवा नुस्खे, लैब रिपोर्ट, रेफरल और स्वास्थ्य जांच का संपूर्ण इतिहास।',
    allHistoryTab: 'संपूर्ण इतिहास',
    consultationsTab: 'डॉक्टर परामर्श',
    prescriptionsTab: 'दवा नुस्खे',
    diagnosticsTab: 'लैब और जांच',
    referralsTab: 'रेफरल्स',
    assessmentsTab: 'स्वास्थ्य जांच',
    noRecordsInTab: 'इस श्रेणी में अभी तक कोई मेडिकल रिकॉर्ड नहीं है।',
    dateLabel: 'तारीख',
    doctorLabel: 'डॉक्टर',
    facilityLabel: 'अस्पताल',
    statusLabel: 'स्थिति',
    downloadReport: 'पीडीएफ डाउनलोड करें',

    profileTitle: 'मरीज प्रोफ़ाइल',
    personalInfo: 'व्यक्तिगत जानकारी',
    genderLabel: 'लिंग',
    ageLabel: 'आयु',
    addressLabel: 'पता',
    emergencyContactLabel: 'आपातकालीन संपर्क',
    consentActive: 'आभा सहमति सक्रिय',

    citizenPatientTab: 'नागरिक / मरीज',
    facilityStaffTab: 'अस्पताल स्टाफ',
    medicalDoctorTab: 'चिकित्सक (डॉक्टर)',
    adminRoleTab: 'प्रशासक एवं राज्य',
    patientLoginTitle: 'मरीज लॉगिन',
    patientLoginSubtitle:
      'अपने आभा रिकॉर्ड, ओपीडी अपॉइंटमेंट, लाइव कतार टोकन और डिजिटल स्वास्थ्य जांच के लिए लॉगिन करें।',
    enterPatientIdPlaceholder: 'सेवा हेल्थ मरीज आईडी दर्ज करें (उदा. P-10452)',
    sendOtpBtn: 'OTP भेजें',
    enterOtpPrompt: '6-अंकों का OTP दर्ज करें',
    verifyOtpBtn: 'OTP सत्यापित करें और लॉगिन करें',
    newPatientPrompt: 'नए मरीज हैं?',
    registerNowBtn: 'अभी पंजीकरण करें',
    staffIdPlaceholder: 'स्टाफ आईडी दर्ज करें (उदा. usr-staff-1)',
    passwordPlaceholder: 'पासवर्ड दर्ज करें',
    signInBtn: 'साइन इन करें',
    emergencyAssistance108: '108 आपातकालीन एम्बुलेंस',

    patientsServed: 'नागरिक लाभान्वित',
    waitingTimeReduction: 'औसत प्रतीक्षा समय',
    referralCompletion: 'रेफरल पूर्णता',
    travelSaved: 'बचत की गई यात्रा दूरी',
    howItWorksTitle: 'एक एकीकृत स्वास्थ्य सेवा निरंतरता',
    step1: '1. खोजें',
    step1Desc: 'नज़दीकी उप-केंद्र, पीएचसी, ग्रामीण और जिला अस्पताल लाइव डॉक्टर और बेड उपलब्धता के साथ खोजें।',
    step2: '2. समय और टोकन',
    step2Desc: 'घर से ही अपॉइंटमेंट समय और डिजिटल टोकन प्राप्त करें ताकि कतार में न खड़ा होना पड़े।',
    step3: '3. परामर्श',
    step3Desc: 'डॉक्टरों से सीधे या आशा कार्यकर्ता के सहयोग से टेलीकंसल्टेशन के माध्यम से परामर्श लें।',
    step4: '4. समन्वय',
    step4Desc: 'मुफ्त दवाओं का स्टॉक, लैब जांच और विशेषज्ञ अस्पतालों के लिए डिजिटल रेफरल सुविधा।',
    step5: '5. फॉलो-अप',
    step5Desc: 'मातृ-शिशु देखभाल और पुरानी बीमारियों के लिए नियमित गृह दौरे और स्वचालित अलर्ट।',
    emergencyCall108: '108 एम्बुलेंस बुलाएं',
    disclaimerText:
      'निर्णय समर्थन और देखभाल मार्गदर्शन प्रणाली। नैदानिक निर्णय अधिकृत चिकित्सा अधिकारियों के अधीन हैं।',

    // Supplementary / Shared Aliases
    appTagline: 'स्वास्थ्य सेवा इस बात पर निर्भर नहीं होनी चाहिए कि आप कहाँ रहते हैं।',
    selectRole: 'मंच तक पहुंचने के लिए अपनी भूमिका चुनें:',
    profileDrawerTitle: 'मरीज प्रोफ़ाइल एवं आभा पहचान',
    facilityDirectoryTitle: 'सार्वजनिक स्वास्थ्य केंद्र निर्देशिका',
    facilityDirectorySubtitle:
      'महाराष्ट्र भर में प्राथमिक स्वास्थ्य केंद्र, उप-केंद्र, ग्रामीण और जिला अस्पताल लाइव डॉक्टर और आपातकालीन सुविधा के साथ खोजें।',
    searchFacilitiesPlaceholder: 'अस्पताल का नाम, तालुका या पता खोजें...',
    districtFilterLabel: 'जिला',
    typeFilterLabel: 'स्वास्थ्य केंद्र प्रकार',
    allFacilityTypes: 'सभी प्रकार',
    subCentres: 'उप-केंद्र',
    primaryHealthCentres: 'प्राथमिक स्वास्थ्य केंद्र (PHC)',
    communityHealthCentres: 'सामुदायिक स्वास्थ्य केंद्र (CHC)',
    ruralHospitals: 'ग्रामीण अस्पताल (RH)',
    subDistrictHospitals: 'उप-जिला अस्पताल (SDH)',
    districtHospitals: 'जिला अस्पताल (DH)',
    facilitiesMap: 'सार्वजनिक स्वास्थ्य केंद्र मानचित्र',
    facilitiesShown: 'अस्पताल प्रदर्शित',
    loadingDirectory: 'सार्वजनिक स्वास्थ्य निर्देशिका लोड हो रही है...',
    noFacilitiesMatched: 'चुने गए फिल्टर के अनुसार कोई सरकारी अस्पताल नहीं मिला।',
    emergency24x7Badge: '24/7 आपातकालीन',
    detailsBtn: 'विवरण',
    getDirectionsBtn: 'दिशा-निर्देश',
    callFacilityBtn: 'कॉल करें',
    loadingDetails: 'विवरण लोड हो रहा है...',
    emergencyServicesAvailable: '24x7 आपातकालीन सेवाएं उपलब्ध',
    daytimeOpd: 'दिन की ओपीडी व बाह्य रोगी सेवाएं',
    helpdeskPhone: 'हेल्पडेस्क फोन',
    doctorsAvailableToday: 'आज उपलब्ध डॉक्टर',
    dutyRosterFor: 'आज की ड्यूटी रोस्टर',
    available: 'उपलब्ध',
    noDoctorsScheduledToday: 'आज ड्यूटी पर कोई डॉक्टर निर्धारित नहीं हैं।',
    emergencyStaffActive: 'आपातकालीन चिकित्सा अधिकारी और नर्सिंग स्टाफ सक्रिय ड्यूटी पर हैं।',
    realTimeTokenSystem: 'वास्तविक समय टोकन प्रणाली',
    liveOpdQueueTracker: 'लाइव ओपीडी कतार ट्रैकर',
    currentQueueUpdatesFor: 'लाइव बाह्य रोगी विभाग (ओपीडी) कतार अपडेट, वास्तविक समय प्रतीक्षा अनुमान और मार्ग दर्शन',
    liveFacilityNavigation: 'लाइव अस्पताल नेविगेशन',
    tokenId: 'टोकन आईडी',
    counterLabel: 'काउंटर',
    estimatedWait: 'अनुमानित प्रतीक्षा',
    patientsAhead: 'आगे के मरीज',
    doctorOnDuty: 'ड्यूटी पर डॉक्टर',
    tokenApproachingNotice: 'आपका टोकन नंबर पास आ रहा है! कृपया ओपीडी परामर्श कक्ष 3 के पास बैठें।',
    todaysOpdQueueRoster: 'आज की ओपीडी कतार रोस्टर',
    tokenHash: 'टोकन #',
    patientName: 'मरीज का नाम',
    departmentPriority: 'विभाग / प्राथमिकता',
    status: 'स्थिति',
    consultingDoctor: 'परामर्श डॉक्टर',
    appointmentsReferralsFollowups: 'अपॉइंटमेंट, रेफरल और फॉलो-अप',
    recentHealthAssessment: 'हालिया स्वास्थ्य जांच',
    retakeAssessment: 'पुनः जांच करें',
    upcomingAppointment: 'आगामी अपॉइंटमेंट',
    trackQueue: 'कतार ट्रैक करें',
    bookNewSlot: 'नया स्लॉट बुक करें',
    referralsFollowUp: 'रेफरल और फॉलो-अप',
    viewCareReferrals: 'रेफरल देखें',
    longitudinalHealthRecords: 'संपूर्ण स्वास्थ्य रिकॉर्ड',
    patientHealthTimeline: 'मरीज स्वास्थ्य टाइमलाइन',
    completeHistoryDesc:
      'आभा पारिस्थितिकी तंत्र के तहत डॉक्टर परामर्श, निदान, नुस्खे, लैब परीक्षण, रेफरल और ट्राइएज मूल्यांकन का संपूर्ण कालानुक्रमिक इतिहास।',
    printTimeline: 'टाइमलाइन प्रिंट करें',
    exportHealthSummary: 'स्वास्थ्य सारांश निर्यात करें',
    consultations: 'परामर्श',
    clinicalOpdEncounters: 'क्लिनिकल ओपीडी परामर्श',
    labReports: 'लैब रिपोर्ट्स',
    diagnosticInvestigations: 'नैदानिक जांच',
    activePrescriptions: 'सक्रिय दवा पर्चे',
    ongoingDispensedMedications: 'जारी व वितरित दवाएं',
    interFacilityTransfers: 'अस्पताल स्थानांतरण',
    filterRecords: 'रिकॉर्ड फिल्टर करें:',
    allHistory: 'संपूर्ण इतिहास',
    labDiagnostics: 'लैब व जांच',
    loadingRecords: 'स्वास्थ्य रिकॉर्ड लोड हो रहे हैं...',
    noRecordsFound: 'चुने गए फिल्टर के अनुसार कोई मेडिकल रिकॉर्ड नहीं मिला।',
    active: 'सक्रिय',
    startHealthAssessment: 'स्वास्थ्य जाँच शुरू करें',
    emergency24x7Btn: 'आपातकालीन सहायता 24x7',
    emergencyResponseBadge: '24/7 तत्काल आपातकालीन प्रोटोकॉल',
    emergencyAssistanceDesc: 'तत्काल मदद चाहिए? अभी आपातकालीन सहायता और 108 एम्बुलेंस प्राप्त करें।',
    findNearestEmergencyFacility: 'नज़दीकी आपातकालीन अस्पताल खोजें',
    confirmAppointment: 'अपॉइंटमेंट की पुष्टि करें',
    selectDoctor: 'डॉक्टर चुनें',
    selectDate: 'तारीख चुनें',
    availableSlots: 'उपलब्ध समय',
    appointmentConfirmed: 'अपॉइंटमेंट की पुष्टि हो गई',
    viewAppointment: 'अपॉइंटमेंट देखें',
    trackLiveQueue: 'लाइव कतार ट्रैक करें',
    registeredMobile: 'पंजीकृत मोबाइल',
    generalOpdDoctor: 'सामान्य ओपीडी / ड्यूटी चिकित्सा अधिकारी',
    timeSlot: 'समय स्लॉट',
    upcomingAppointments: 'आगामी अपॉइंटमेंट्स',
    confirmed: 'पुष्टि हो गई',
    tellUsAboutSymptoms: 'अपने लक्षणों के बारे में बताएं',
    symptomsIntro: 'अपॉइंटमेंट बुक करने से पहले, बताएं कि आप क्या महसूस कर रहे हैं ताकि हम आपको उचित देखभाल की ओर निर्देशित कर सकें।',
    startSymptomAssessment: 'लक्षण मूल्यांकन शुरू करें',
    describeSymptoms: 'लक्षणों का वर्णन करें',
    describeSymptomsPrompt: 'आप क्या लक्षण महसूस कर रहे हैं?',
    symptomPlaceholder: 'उदा. बुखार, खांसी, सिरदर्द, पेट दर्द, बदन दर्द...',
    durationPrompt: 'आपको यह लक्षण कितने समय से हैं?',
    severityPrompt: 'लक्षणों की गंभीरता कैसी है?',
    mild: 'हल्के',
    moderate: 'मध्यम',
    severe: 'गंभीर',
    continueBtn: 'आगे बढ़ें',
    previousBtn: 'पीछे',
    emergencyCareRecommended: 'आपातकालीन देखभाल की सिफारिश',
    emergencyWarningText: 'आपकी प्रतिक्रिया किसी ऐसे लक्षण का संकेत दे सकती है जिसके लिए तत्काल चिकित्सा सहायता आवश्यक है। कृपया तुरंत आपातकालीन चिकित्सा देखभाल लें।',
    emergencyAssistanceBtn: 'आपातकालीन सहायता',
    symptomSummary: 'लक्षण सारांश',
    reportedSymptoms: 'दर्ज किए गए लक्षण',
    preliminaryCareGuidance: 'प्रारंभिक देखभाल मार्गदर्शन',
    preliminaryGuidanceDisclaimer: 'यह प्रारंभिक मार्गदर्शन है और किसी योग्य स्वास्थ्य पेशेवर द्वारा जांच का विकल्प नहीं है।',
    continueBooking: 'बुकिंग जारी रखें',
    appointmentSummary: 'अपॉइंटमेंट सारांश',
    stepIndicator: 'चरण',
    specialtyLabel: 'विशेषज्ञता',
    patientDetails: 'रोगी विवरण',
    appointmentsTitle: 'अपॉइंटमेंट्स',
    noUpcomingAppointments: 'कोई आगामी अपॉइंटमेंट नहीं है',
    noAppointmentsBookedYet: 'आपने अभी तक कोई अपॉइंटमेंट बुक नहीं किया है।',
    cancelAppointment: 'अपॉइंटमेंट रद्द करें',
    appointmentCancelled: 'अपॉइंटमेंट सफलतापूर्वक रद्द किया गया',
    findNearbyFacility: 'नज़दीकी स्वास्थ्य केंद्र खोजें',
    noActiveReferrals: 'कोई सक्रिय रेफरल नहीं है',
    noActiveReferralsDesc: 'आपके पास वर्तमान में कोई सक्रिय रेफरल नहीं है।',
    activePathway: 'सक्रिय मार्ग',
    sourceLabel: 'स्रोत',
    referredFrom: 'यहाँ से संदर्भित',
    closedLoopActive: 'क्लोज्ड-लूप रेफरल ट्रैकिंग सक्रिय',
    upcomingAppointmentCompact: 'आगामी अपॉइंटमेंट',
    referralId: 'रेफरल आईडी',
    referralStatus: 'रेफरल स्थिति',
    referralReason: 'रेफरल का कारण'
  }
};
