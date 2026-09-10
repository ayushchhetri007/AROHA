import fs from 'fs';
import path from 'path';

const citizenDashboardPath = path.resolve('frontend/src/features/citizen/CitizenDashboard.tsx');
const liveQueueTrackerPath = path.resolve('frontend/src/features/citizen/LiveQueueTracker.tsx');
const indexCssPath = path.resolve('frontend/src/index.css');

console.log('=== VERIFYING APPOINTMENTS & REFERRALS RELOCATION ===\n');

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

// 1. CitizenDashboard checks
const citizenContent = fs.readFileSync(citizenDashboardPath, 'utf-8');
assert(!citizenContent.includes('Appointments, Referrals & Follow-ups'), 'CitizenDashboard should NOT contain Appointments, Referrals & Follow-ups');
assert(!citizenContent.includes('Recent Health Assessment'), 'CitizenDashboard should NOT contain Recent Health Assessment card');
assert(!citizenContent.includes('Upcoming Appointment'), 'CitizenDashboard should NOT contain Upcoming Appointment card');
assert(!citizenContent.includes('Referrals & Follow-up'), 'CitizenDashboard should NOT contain Referrals & Follow-up card');

// 2. LiveQueueTracker checks
const queueContent = fs.readFileSync(liveQueueTrackerPath, 'utf-8');
assert(queueContent.includes('Appointments, Referrals & Follow-ups'), 'LiveQueueTracker contains Appointments, Referrals & Follow-ups header');
assert(queueContent.includes('Recent Health Assessment'), 'LiveQueueTracker contains Recent Health Assessment');
assert(queueContent.includes('Upcoming Appointment'), 'LiveQueueTracker contains Upcoming Appointment');
assert(queueContent.includes('Referrals & Follow-up'), 'LiveQueueTracker contains Referrals & Follow-up');

// Check order: queue roster table must come BEFORE Appointments, Referrals & Follow-ups
const tableIndex = queueContent.indexOf("Today's OPD Queue Roster");
const appointmentsIndex = queueContent.indexOf('Appointments, Referrals & Follow-ups');
assert(tableIndex !== -1 && appointmentsIndex !== -1 && appointmentsIndex > tableIndex, 'Appointments section is placed BELOW the main queue roster table');

// Check back button: must NOT contain "Back to Patient Dashboard"
assert(!queueContent.includes('Back to Patient Dashboard'), 'Back button does NOT contain "Back to Patient Dashboard" text or title');
assert(queueContent.includes('aria-label="Back"'), 'Back button has aria-label="Back"');

// Check refresh: calls loadAppointmentsAndReferrals
assert(queueContent.includes('loadAppointmentsAndReferrals()'), 'handleRefresh invokes loadAppointmentsAndReferrals');

// Check actions
assert(queueContent.includes('Retake Health Assessment'), 'Contains Retake Health Assessment button');
assert(queueContent.includes('Track Queue'), 'Contains Track Queue button');
assert(queueContent.includes('Book New Slot'), 'Contains Book New Slot button');
assert(queueContent.includes('View Care Referrals'), 'Contains View Care Referrals button');

// Check modals
assert(queueContent.includes('<SymptomAssessmentModal'), 'Renders SymptomAssessmentModal');
assert(queueContent.includes('<AppointmentBookingModal'), 'Renders AppointmentBookingModal');

// 3. CSS Responsive Layout checks
const cssContent = fs.readFileSync(indexCssPath, 'utf-8');
assert(cssContent.includes('.appointments-referrals-grid'), 'index.css defines .appointments-referrals-grid');
assert(cssContent.includes('repeat(3, minmax(0, 1fr))'), '.appointments-referrals-grid uses 3-column layout on desktop');
assert(cssContent.includes('max-width: 1024px') && cssContent.includes('repeat(2, minmax(0, 1fr))'), 'Uses 2-column layout on tablet');
assert(cssContent.includes('max-width: 680px') && cssContent.includes('grid-template-columns: 1fr'), 'Uses 1-column layout on mobile');

if (failed) {
  console.log('\n❌ Verification failed!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL VERIFICATION CRITERIA PASSED!');
}
