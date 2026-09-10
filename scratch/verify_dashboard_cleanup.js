import fs from 'fs';
import path from 'path';

const citizenDashboardPath = path.resolve('frontend/src/features/citizen/CitizenDashboard.tsx');
const profileDrawerPath = path.resolve('frontend/src/components/profile/ProfileDrawer.tsx');
const authControllerPath = path.resolve('backend/src/controllers/auth.controller.ts');

console.log('=== VERIFYING PATIENT DASHBOARD CLEANUP & PROFILE INTEGRITY ===\n');

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

// Ensure patient info bar is removed
assert(!citizenContent.includes('Seva Health Patient ID:'), 'CitizenDashboard does NOT display permanent "Seva Health Patient ID"');
assert(!citizenContent.includes('ABHA ID:'), 'CitizenDashboard does NOT display permanent "ABHA ID"');
assert(!citizenContent.includes('Blood Group:'), 'CitizenDashboard does NOT display permanent "Blood Group"');
assert(!citizenContent.includes('Location:'), 'CitizenDashboard does NOT display permanent "Location"');
assert(!citizenContent.includes('patientDisplayName'), 'CitizenDashboard does NOT display permanent patient name in info bar');

// Ensure no search bar on CitizenDashboard
assert(!citizenContent.includes('<input'), 'CitizenDashboard has NO search input element');
assert(!citizenContent.includes('placeholder="Search facility, doctor'), 'CitizenDashboard has no redundant global search bar');

// Ensure clean dashboard header is present
assert(citizenContent.includes('Patient Dashboard'), 'CitizenDashboard has clean "Patient Dashboard" header');
assert(citizenContent.includes('Emergency 24x7'), 'CitizenDashboard preserves Emergency 24x7 button');

// Ensure functional services remain intact
assert(citizenContent.includes('How are you feeling today?'), 'Preserves "How are you feeling today?" Digital Health Assessment');
assert(citizenContent.includes('Find Nearby Facility'), 'Preserves "Find Nearby Facility" service card');
assert(citizenContent.includes('Live Token Queue'), 'Preserves "Live Token Queue" service card');
assert(citizenContent.includes('Inventory'), 'Preserves "Inventory" service card');
assert(citizenContent.includes('Longitudinal Health Records'), 'Preserves "Longitudinal Health Records" service card');
assert(citizenContent.includes('<SymptomAssessmentModal'), 'Preserves SymptomAssessmentModal');

// 2. ProfileDrawer checks
const profileContent = fs.readFileSync(profileDrawerPath, 'utf-8');

assert(profileContent.includes("transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'"), 'ProfileDrawer slides in from the LEFT');
assert(profileContent.includes('attrs.abhaId &&'), 'ABHA ID is shown ONLY IF PROVIDED');
assert(profileContent.includes('logout()'), 'ProfileDrawer footer has working Logout action');
assert(profileContent.includes('Close'), 'ProfileDrawer footer has working Close action');
assert(!profileContent.includes("'14/06/1992 (28 Y)'"), 'ProfileDrawer removed hardcoded DOB fallback');
assert(!profileContent.includes("'Shirwal, Khandala, Satara'"), 'ProfileDrawer removed hardcoded address fallback');

// 3. Backend authController checks
const authContent = fs.readFileSync(authControllerPath, 'utf-8');
assert(!authContent.includes("bloodGroup: p.blood_group || 'O+'"), 'Backend auth controller does not default blood group to hardcoded O+');
assert(!authContent.includes("dob: p.dob || '14/06/1992'"), 'Backend auth controller does not default DOB to hardcoded 14/06/1992');
assert(!authContent.includes("address: `${p.village || ''}, ${p.taluka || ''}, ${p.district || ''}`.replace(/^[,\\s]+|[,\\s]+$/g, '') || 'Shirwal, Khandala, Satara'"), 'Backend auth controller does not default address to hardcoded Shirwal');

if (failed) {
  console.log('\n❌ Verification failed!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL DASHBOARD CLEANUP & PROFILE CHECKS PASSED!');
}
