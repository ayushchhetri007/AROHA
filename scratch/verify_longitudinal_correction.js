import fs from 'fs';
import path from 'path';

const citizenDashboardPath = path.resolve('frontend/src/features/citizen/CitizenDashboard.tsx');
const longitudinalEHRPath = path.resolve('frontend/src/features/citizen/LongitudinalEHR.tsx');
const profileDrawerPath = path.resolve('frontend/src/components/profile/ProfileDrawer.tsx');

console.log('=== VERIFYING LONGITUDINAL HEALTH RECORDS CORRECTION ===\n');

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    failed = true;
  } else {
    console.log(`✅ PASS: ${msg}`);
  }
}

// 1. CitizenDashboard: Patient information bar must be KEPT on the main dashboard
const citizenContent = fs.readFileSync(citizenDashboardPath, 'utf-8');
assert(citizenContent.includes('Welcome, {patientDisplayName}'), 'CitizenDashboard displays Welcome, {patientDisplayName}');
assert(citizenContent.includes('Seva Health Patient ID:'), 'CitizenDashboard displays Seva Health Patient ID');
assert(citizenContent.includes('Patient: <strong style={{ color: \'#0f172a\' }}>{patientDisplayName}</strong>'), 'CitizenDashboard displays Patient Name in info bar');
assert(citizenContent.includes('ABHA ID: <strong>{patientProfile.abha_id}</strong>'), 'CitizenDashboard displays ABHA ID when available');
assert(citizenContent.includes('Blood Group: <strong>{patientProfile.blood_group}</strong>'), 'CitizenDashboard displays Blood Group when available');
assert(citizenContent.includes('Location:'), 'CitizenDashboard displays Location when available');
assert(citizenContent.includes('Emergency 24x7'), 'CitizenDashboard preserves Emergency 24x7 button');
assert(citizenContent.includes('How are you feeling today?'), 'CitizenDashboard preserves Digital Health Assessment hero');
assert(citizenContent.includes('Find Nearby Facility'), 'CitizenDashboard preserves Find Nearby Facility');
assert(citizenContent.includes('Live Token Queue'), 'CitizenDashboard preserves Live Token Queue');
assert(citizenContent.includes('Inventory'), 'CitizenDashboard preserves Inventory');
assert(citizenContent.includes('Longitudinal Health Records'), 'CitizenDashboard preserves Longitudinal Health Records');

// 2. LongitudinalEHR: Patient information bar and search bar must be REMOVED ONLY here
const ehrContent = fs.readFileSync(longitudinalEHRPath, 'utf-8');
assert(!ehrContent.includes('Patient Credentials Ribbon'), 'LongitudinalEHR does NOT contain Patient Credentials Ribbon');
assert(!ehrContent.includes('placeholder="Search facility, doctor'), 'LongitudinalEHR does NOT contain redundant search input');
assert(!ehrContent.includes('searchQuery'), 'LongitudinalEHR does not track searchQuery state');
assert(ehrContent.includes('Complete history of your healthcare journey'), 'LongitudinalEHR includes clean subtitle "Complete history of your healthcare journey"');
assert(ehrContent.includes('Consultations'), 'LongitudinalEHR retains Consultations filter and summary');
assert(ehrContent.includes('Prescriptions'), 'LongitudinalEHR retains Prescriptions filter and summary');
assert(ehrContent.includes('Lab Reports'), 'LongitudinalEHR retains Lab Reports filter and summary');
assert(ehrContent.includes('Referrals'), 'LongitudinalEHR retains Referrals filter and summary');
assert(ehrContent.includes('handleBack'), 'LongitudinalEHR retains Back button navigation');

// 3. Profile Drawer integrity
const profileContent = fs.readFileSync(profileDrawerPath, 'utf-8');
assert(profileContent.includes("transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'"), 'ProfileDrawer slides in from the LEFT');
assert(profileContent.includes('logout()'), 'ProfileDrawer footer includes working Logout action');
assert(profileContent.includes('Close'), 'ProfileDrawer footer includes working Close action');

if (failed) {
  console.log('\n❌ Verification failed!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL CORRECTION CRITERIA VERIFIED SUCCESSFULLY!');
}
