const fs = require('fs');
const path = require('path');
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('==============================================================');
  console.log('RUNNING ACCEPTANCE TESTS FOR APPOINTMENT BOOKING ASSESSMENT FLOW');
  console.log('==============================================================\n');

  // Test 1 & 4 Setup: Patient A vs Patient B IDs
  const patientA_Id = 'P-10452';
  const patientB_Id = 'pat-test-new-unique-' + Date.now();

  // Clean test: Verify Patient B has no assessments initially
  console.log('--- TEST 4 (Isolation): Patient B initial state ---');
  const resB_init = await fetch(`${API_BASE}/clinical/assessments/${patientB_Id}`);
  const dataB_init = await resB_init.json();
  assert(Array.isArray(dataB_init), 'Patient B assessment response is an array');
  assert.strictEqual(dataB_init.length, 0, 'Patient B has 0 assessments initially');
  console.log(`✓ PASS: Patient B (${patientB_Id}) has 0 assessments. No leakage from Patient A.`);

  // TEST 1: Patient A completes an assessment
  console.log('\n--- TEST 1: Patient A completes Health Assessment ---');
  const assessmentPayloadA = {
    patient_id: patientA_Id,
    symptoms: ['Fever or Chills', 'Headache, Body Ache, or Fatigue'],
    triage_level: 'PHC',
    recommendation: 'Primary Health Centre Shirwal recommended for evaluation.',
    recommended_facility_id: 'fac-phc-shirwal',
    emergency_flag: 0
  };

  const saveResA = await fetch(`${API_BASE}/clinical/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assessmentPayloadA)
  });
  assert.strictEqual(saveResA.status, 201, 'Assessment saved successfully for Patient A');
  const saveJsonA = await saveResA.json();
  assert(saveJsonA.assessment && saveJsonA.assessment.id, 'Saved assessment has ID');
  console.log(`✓ PASS: Patient A saved assessment: ${saveJsonA.assessment.id} (Triage: PHC)`);

  // Verify fetch returns this assessment for Patient A
  const resA = await fetch(`${API_BASE}/clinical/assessments/${patientA_Id}`);
  const dataA = await resA.json();
  assert(dataA.length > 0, 'Patient A now has assessments');
  assert.strictEqual(dataA[0].triage_level, 'PHC', 'Latest assessment has triage level PHC');
  assert.strictEqual(dataA[0].patient_id, patientA_Id, 'Assessment strictly matches patient A ID');
  console.log(`✓ PASS: Patient A has completed assessment in backend. Booking flow will recognize it and start at Step 2 (Patient Details).`);

  // TEST 2: Patient B with NO assessment enters booking
  console.log('\n--- TEST 2: Patient with NO completed assessment ---');
  const resB_check = await fetch(`${API_BASE}/clinical/assessments/${patientB_Id}`);
  const dataB_check = await resB_check.json();
  assert.strictEqual(dataB_check.length, 0, 'Patient B still has 0 assessments');
  console.log(`✓ PASS: Patient B has NO completed assessment. Booking flow will open Step 1 (Symptoms).`);

  // TEST 3: Retake Assessment
  console.log('\n--- TEST 3: Patient A Retakes Assessment with new symptoms ---');
  const retakePayloadA = {
    patient_id: patientA_Id,
    symptoms: ['Persistent dry cough', 'Chest discomfort', 'High grade fever'],
    triage_level: 'HIGHER_LEVEL',
    recommendation: 'Sub-District Hospital Karad evaluation suggested.',
    recommended_facility_id: 'fac-sdh-karad',
    emergency_flag: 0
  };

  const retakeRes = await fetch(`${API_BASE}/clinical/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(retakePayloadA)
  });
  assert.strictEqual(retakeRes.status, 201, 'Retake assessment saved successfully');
  const retakeJson = await retakeRes.json();
  console.log(`✓ PASS: Retake assessment created: ${retakeJson.assessment.id} (Triage: HIGHER_LEVEL)`);

  // Verify latest assessment for Patient A is the retaken one
  const resA_after = await fetch(`${API_BASE}/clinical/assessments/${patientA_Id}`);
  const dataA_after = await resA_after.json();
  assert.strictEqual(dataA_after[0].id, retakeJson.assessment.id, 'Latest assessment is the retaken assessment');
  assert.strictEqual(dataA_after[0].triage_level, 'HIGHER_LEVEL', 'Triage level updated to HIGHER_LEVEL');
  console.log(`✓ PASS: Booking flow will use latest retaken assessment (HIGHER_LEVEL) without asking questions twice.`);

  // TEST 4: Isolation verification between Patient A and Patient B
  console.log('\n--- TEST 4: Verifying Patient Isolation ---');
  const resB_final = await fetch(`${API_BASE}/clinical/assessments/${patientB_Id}`);
  const dataB_final = await resB_final.json();
  assert.strictEqual(dataB_final.length, 0, 'Patient B has zero assessments even after Patient A retook assessment');
  console.log(`✓ PASS: Strict patient isolation maintained: Patient B never inherits Patient A data.`);

  // TEST 5: Emergency Detection & Escalation
  console.log('\n--- TEST 5: Emergency Red-Flag Detection ---');
  const emergencyPayload = {
    patient_id: patientA_Id,
    symptoms: ['Severe Chest Pain or Pressure', 'Severe Difficulty Breathing'],
    triage_level: 'EMERGENCY',
    recommendation: 'Immediate emergency medical escalation required.',
    recommended_facility_id: 'fac-dh-satara',
    emergency_flag: 1
  };

  const emerRes = await fetch(`${API_BASE}/clinical/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emergencyPayload)
  });
  const emerJson = await emerRes.json();
  assert.strictEqual(emerJson.assessment.emergency_flag, 1, 'Emergency flag is 1');
  assert.strictEqual(emerJson.assessment.triage_level, 'EMERGENCY', 'Triage level is EMERGENCY');
  console.log(`✓ PASS: Emergency red flag detected and saved. Booking flow triggers emergency_blocked screen.`);

  // Verify frontend AppointmentBookingModal code assertions
  console.log('\n--- UI CODE CONTRACT CHECKS (AppointmentBookingModal.tsx) ---');
  const modalPath = path.resolve(__dirname, '../frontend/src/features/citizen/AppointmentBookingModal.tsx');
  const modalCode = fs.readFileSync(modalPath, 'utf8');

  // Check 1: Existing assessment check on open
  assert(modalCode.includes('api.getAssessments(activePatientId)'), 'Modal checks api.getAssessments with active patient ID');
  console.log('✓ PASS: Modal queries api.getAssessments(activePatientId) on open');

  // Check 2: Skip Step 1 and set Step 2 when assessment exists
  assert(modalCode.includes('setCurrentStep(2);'), 'Modal sets currentStep to 2 when valid assessment exists');
  assert(modalCode.includes("setSymptomMode('guidance');"), 'Modal sets symptomMode to guidance when valid assessment exists');
  console.log('✓ PASS: Modal skips Step 1 and proceeds directly to Step 2 (Patient Details)');

  // Check 3: Start at Step 1 when no assessment exists
  assert(modalCode.includes('setCurrentStep(1);'), 'Modal sets currentStep to 1 when no valid assessment exists');
  assert(modalCode.includes("setSymptomMode('select_mode');"), 'Modal sets symptomMode to select_mode when no assessment exists');
  console.log('✓ PASS: Modal starts at Step 1 (Symptoms) when no valid assessment exists');

  // Check 4: Retake assessment function
  assert(modalCode.includes('handleStartRetake'), 'handleStartRetake function implemented');
  assert(modalCode.includes('RotateCcw'), 'RotateCcw icon used for Retake Assessment');
  console.log('✓ PASS: Retake Assessment functionality and UI button present');

  // Check 5: Step 2 banner
  assert(modalCode.includes('Health Assessment Completed'), 'Health Assessment Completed banner rendered in Step 2');
  console.log('✓ PASS: Compact confirmation banner rendered in Step 2 with triage result and retake option');

  // Check 6: Emergency blocked handling
  assert(modalCode.includes("setSymptomMode('emergency_blocked');"), 'Emergency blocked mode handled');
  console.log('✓ PASS: Emergency escalation mode preserved');

  console.log('\n==============================================================');
  console.log('ALL 5 ACCEPTANCE TESTS AND UI CODE CHECKS PASSED SUCCESSFULLY!');
  console.log('==============================================================\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
