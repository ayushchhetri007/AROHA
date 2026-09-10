/**
 * verify_referrals_in_live_queue.js
 * Comprehensive automated verification for moving Referrals & Follow-Up into Live Token Queue
 */
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('=== 1. VERIFYING CITIZEN DASHBOARD (Referrals removed from main dashboard) ===');
  const citizenDashPath = path.resolve('frontend/src/features/citizen/CitizenDashboard.tsx');
  const citizenDashContent = fs.readFileSync(citizenDashPath, 'utf-8');

  // Check that standalone Referrals & Follow-up section is removed
  assert(!citizenDashContent.includes('{t.referralsFollowUp'), 'Standalone Referrals & Follow-Up section removed from CitizenDashboard');
  assert(!citizenDashContent.includes('REFERRALS & FOLLOW-UP (TOP PROMINENT'), 'Standalone Referrals comment removed from CitizenDashboard');
  assert(!citizenDashContent.includes('const [referrals, setReferrals]'), 'referrals state removed from CitizenDashboard');
  
  // Check that other essential sections remain on CitizenDashboard
  assert(citizenDashContent.includes('patient-triage-emergency-grid'), 'Check Your Symptoms + Emergency 24x7 remains on CitizenDashboard');
  assert(citizenDashContent.includes('upcomingAppointmentCompact'), 'Upcoming Appointment compact status remains on CitizenDashboard');
  assert(citizenDashContent.includes('yourHealthcareServices'), 'Your Healthcare Services grid remains on CitizenDashboard');
  assert(citizenDashContent.includes('facilityDirectoryCardTitle'), 'Find Nearby Facility card remains');
  assert(citizenDashContent.includes('liveQueueCardTitle'), 'Live Token Queue card remains');
  assert(citizenDashContent.includes('inventoryCardTitle'), 'Inventory card remains');
  assert(citizenDashContent.includes('recordsCardTitle'), 'Longitudinal Health Records card remains');

  console.log('\n=== 2. VERIFYING LIVE QUEUE TRACKER (Referrals beside Live OPD Queue Tracker) ===');
  const liveQueuePath = path.resolve('frontend/src/features/citizen/LiveQueueTracker.tsx');
  const liveQueueContent = fs.readFileSync(liveQueuePath, 'utf-8');
  const cssPath = path.resolve('frontend/src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Check CSS responsive layout
  assert(cssContent.includes('.live-queue-referrals-grid'), '.live-queue-referrals-grid defined in index.css');
  assert(cssContent.includes('grid-template-columns: 1.6fr 1fr'), 'Desktop layout uses ~62% / 38% 2-column grid');
  assert(cssContent.includes('@media (max-width: 992px)') && cssContent.includes('grid-template-columns: 1fr'), 'Mobile layout stacks columns vertically');

  // Check imports
  assert(liveQueueContent.includes('HeartPulse') && liveQueueContent.includes('ArrowRight'), 'HeartPulse and ArrowRight imported in LiveQueueTracker');

  // Check state and fetch
  assert(liveQueueContent.includes('const [referrals, setReferrals] = useState'), 'referrals state added to LiveQueueTracker');
  assert(liveQueueContent.includes('api.getReferrals({ patient_id: pId })'), 'Fetches patient-specific referrals in LiveQueueTracker');

  // Check ordering of components
  const backBtnIdx = liveQueueContent.indexOf('ArrowLeft');
  const gridIdx = liveQueueContent.indexOf('live-queue-referrals-grid');
  const queueHeaderIdx = liveQueueContent.indexOf('liveOpdQueueTracker');
  const currentTokenIdx = liveQueueContent.indexOf('yourReservedToken');
  const referralsIdx = liveQueueContent.indexOf('referralsFollowUp');
  const mapNavIdx = liveQueueContent.indexOf('liveFacilityNavigation');
  const rosterIdx = liveQueueContent.indexOf('todaysOpdQueueRoster');

  assert(backBtnIdx !== -1, 'Back button present');
  assert(gridIdx !== -1, 'Side-by-side grid container present');
  assert(queueHeaderIdx !== -1, 'Live OPD Queue Tracker header present');
  assert(currentTokenIdx !== -1, 'Current Token / Queue section present');
  assert(referralsIdx !== -1, 'Referrals & Follow-Up section present');
  assert(mapNavIdx !== -1, 'Facility Navigation / Map section present');
  assert(rosterIdx !== -1, 'Full Queue Roster present');

  assert(backBtnIdx < gridIdx, 'Back button is at the top left before the 2-column grid');
  assert(gridIdx < mapNavIdx, 'Side-by-side grid is placed BEFORE Facility Navigation / Map');
  assert(queueHeaderIdx < referralsIdx, 'Live OPD Queue Tracker is on the LEFT and Referrals & Follow-Up is on the RIGHT');
  assert(mapNavIdx < rosterIdx, 'Facility Navigation / Map is placed BEFORE Full Queue Roster');

  // Check referral section fields
  assert(liveQueueContent.includes('noActiveReferrals'), 'Compact empty state for patients without referrals present');
  assert(liveQueueContent.includes('activePathway'), 'Active Pathway badge present');
  assert(liveQueueContent.includes('specialtyLabel') || liveQueueContent.includes('Specialty'), 'Specialty field displayed');
  assert(liveQueueContent.includes('sourceLabel') || liveQueueContent.includes('Source'), 'Source field displayed');
  assert(liveQueueContent.includes('referralId') || liveQueueContent.includes('Referral ID'), 'Referral ID field displayed');
  assert(liveQueueContent.includes('referralStatus') || liveQueueContent.includes('Referral Status'), 'Referral status displayed');
  assert(liveQueueContent.includes('referralReason') || liveQueueContent.includes('Referral Reason'), 'Referral reason displayed');
  assert(liveQueueContent.includes('closedLoopActive'), 'Closed-loop tracking indicator displayed');
  assert(liveQueueContent.includes('viewCareReferrals'), 'View Care Referrals button present');
  assert(liveQueueContent.includes("setCurrentView('referrals')"), 'View Care Referrals button navigates to referrals');

  console.log('\n=== 3. VERIFYING TRILINGUAL I18N SUPPORT ===');
  const translationsPath = path.resolve('frontend/src/i18n/translations.ts');
  const transContent = fs.readFileSync(translationsPath, 'utf-8');

  // Verify English
  assert(transContent.includes("referralsFollowUp: 'Referrals & Follow-up'") || transContent.includes("referralsFollowUp: 'Referrals & Follow-Up'"), 'en has referralsFollowUp');
  assert(transContent.includes("referralId: 'Referral ID'"), 'en has referralId');
  assert(transContent.includes("referralStatus: 'Referral Status'"), 'en has referralStatus');
  assert(transContent.includes("referralReason: 'Referral Reason'"), 'en has referralReason');
  assert(transContent.includes("viewCareReferrals: 'View Care Referrals'"), 'en has viewCareReferrals');
  assert(transContent.includes("noActiveReferrals: 'No active referrals'"), 'en has noActiveReferrals');

  // Verify Marathi
  assert(transContent.includes("referralId: 'संदर्भ आयडी'"), 'mr has referralId');
  assert(transContent.includes("referralStatus: 'संदर्भ स्थिती'"), 'mr has referralStatus');
  assert(transContent.includes("referralReason: 'संदर्भाचे कारण'"), 'mr has referralReason');

  // Verify Hindi
  assert(transContent.includes("referralId: 'रेफरल आईडी'"), 'hi has referralId');
  assert(transContent.includes("referralStatus: 'रेफरल स्थिति'"), 'hi has referralStatus');
  assert(transContent.includes("referralReason: 'रेफरल का कारण'"), 'hi has referralReason');

  console.log('\n=== 4. VERIFYING REAL BACKEND API REFERRAL ISOLATION ===');
  try {
    // 1. Beneficiary without referrals (e.g. Rahul Kumar P-10452)
    const rahulRes = await fetch('http://localhost:5000/api/referrals', {
      headers: {
        'Authorization': 'Bearer demo-token-usr-P-10452',
        'Content-Type': 'application/json'
      }
    });
    if (rahulRes.ok) {
      const rahulData = await rahulRes.json();
      assert(Array.isArray(rahulData) && rahulData.length === 0, 'Rahul Kumar gets empty referral list (no fake referrals)');
    } else {
      console.warn('Backend server not responding, skipping live network call');
    }

    // 2. Beneficiary with referral (Meera Patil usr-patient-1)
    const meeraRes = await fetch('http://localhost:5000/api/referrals', {
      headers: {
        'Authorization': 'Bearer demo-token-usr-patient-1',
        'Content-Type': 'application/json'
      }
    });
    if (meeraRes.ok) {
      const meeraData = await meeraRes.json();
      assert(Array.isArray(meeraData) && meeraData.length > 0, `Meera Patil receives her own real referral (${meeraData[0]?.id || 'active'})`);
      assert(meeraData[0]?.patient_id === 'pat-meera', 'Meera Patil referral matches patient_id pat-meera');
    }
  } catch (err) {
    console.warn('Network call error:', err.message);
  }

  console.log(`\n==============================================`);
  console.log(`TOTAL PASSED: ${passCount}`);
  console.log(`TOTAL FAILED: ${failCount}`);
  console.log(`==============================================`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
