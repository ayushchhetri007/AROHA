import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(() => localStorage.setItem('seva_authenticated', 'true'));
const page = await context.newPage();

const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// === TEST A: Book OPD opens normal flow, no Emergency Care ===
console.log('=== TEST A: Book OPD ===');
await page.locator('text=Find Nearby Facility').first().click();
await page.waitForTimeout(1000);
await page.locator('button[title^="Book Appointment at"]').first().click();
await page.waitForTimeout(800);
console.log('Emergency Care Recommended shown (should be 0):', await page.locator('text=EMERGENCY CARE RECOMMENDED').count());

// Get to a fresh Step-1 assessment (via Retake if landed on Step 2, or Start if on Step 1)
const retakeBtn = page.locator('button:has-text("Retake Assessment")').first();
if (await retakeBtn.count() > 0) {
  await retakeBtn.click();
} else if (await page.locator('text=Start Symptom Assessment').count() > 0) {
  await page.locator('text=Start Symptom Assessment').first().click();
}
await page.waitForTimeout(600);

// === TEST B: Initial question state ===
console.log('\n=== TEST B: Q1 initial state ===');
const yesBtn = () => page.locator('button[aria-pressed]:has-text("YES")').first();
const noBtn = () => page.locator('button[aria-pressed]:has-text("NO")').first();
console.log('YES aria-pressed initially:', await yesBtn().getAttribute('aria-pressed'));
console.log('NO aria-pressed initially:', await noBtn().getAttribute('aria-pressed'));

const yesStyleBefore = await yesBtn().evaluate(el => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, border: cs.borderColor, color: cs.color }; });
const noStyleBefore = await noBtn().evaluate(el => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, border: cs.borderColor, color: cs.color }; });
console.log('YES neutral style:', JSON.stringify(yesStyleBefore));
console.log('NO neutral style:', JSON.stringify(noStyleBefore));
console.log('YES and NO neutral backgrounds match:', yesStyleBefore.bg === noStyleBefore.bg);
console.log('YES and NO neutral text colors match:', yesStyleBefore.color === noStyleBefore.color);

const nextBtnQ1 = page.locator('button:has-text("Next Question")').first();
console.log('Next Question disabled initially:', await nextBtnQ1.isDisabled());

// === TEST C: Select YES ===
console.log('\n=== TEST C: Select YES ===');
await yesBtn().click();
await page.waitForTimeout(150);
console.log('YES aria-pressed after click:', await yesBtn().getAttribute('aria-pressed'));
console.log('NO aria-pressed after YES click:', await noBtn().getAttribute('aria-pressed'));
console.log('Next Question enabled:', await nextBtnQ1.isEnabled());

// === TEST D: Change to NO ===
console.log('\n=== TEST D: Change to NO ===');
await noBtn().click();
await page.waitForTimeout(150);
console.log('YES aria-pressed after switching to NO:', await yesBtn().getAttribute('aria-pressed'));
console.log('NO aria-pressed after switching to NO:', await noBtn().getAttribute('aria-pressed'));

// Answer YES on Q1 (fever) to test summary later, proceed
await yesBtn().click();
await page.waitForTimeout(150);
await page.locator('button:has-text("Next Question")').first().click();
await page.waitForTimeout(200);

// Q2: answer YES too (cough) for summary test
await yesBtn().click();
await page.waitForTimeout(150);
await page.locator('button:has-text("Next Question")').first().click();
await page.waitForTimeout(200);

// Q3, Q4: NO
for (let i = 3; i <= 4; i++) {
  await noBtn().click();
  await page.waitForTimeout(120);
  await page.locator('button:has-text("Next Question")').first().click();
  await page.waitForTimeout(150);
}

// === TEST E: Previous button ===
console.log('\n=== TEST E: Previous button navigation ===');
console.log('On Question 5:', await page.locator('text=/Question 5 of 10/').count() > 0);
await noBtn().click(); // answer Q5 NO first so we can verify preservation isn't needed here; actually test going back without answering first
await page.waitForTimeout(120);
const prevBtn = page.locator('button:has-text("Previous")').first();
await prevBtn.click();
await page.waitForTimeout(200);
console.log('Back on Question 4:', await page.locator('text=/Question 4 of 10/').count() > 0);
console.log('Q4 answer (NO) still selected:', await noBtn().getAttribute('aria-pressed'));
// go forward again
await page.locator('button:has-text("Next Question")').first().click();
await page.waitForTimeout(200);
console.log('Q5 answer preserved after going forward again:', await noBtn().getAttribute('aria-pressed'));

// === TEST F: Complete all remaining questions (6-10), no red flags ===
console.log('\n=== TEST F: Complete assessment (Q5-Q10) ===');
for (let i = 5; i <= 10; i++) {
  const btn = i === 8 ? yesBtn() : noBtn(); // answer YES on Q8 (breathing_distress, red flag) to test deferred non-blocking behavior
  await btn.click();
  await page.waitForTimeout(120);
  const nextOrComplete = page.locator('button:has-text("Next Question"), button:has-text("Complete Assessment")').first();
  await nextOrComplete.click();
  await page.waitForTimeout(200);
}
await page.waitForTimeout(500);

console.log('Emergency Care Recommended shown after completion (should be 0):', await page.locator('text=EMERGENCY CARE RECOMMENDED').count());
console.log('"Summary of Your Reported Symptoms" section shown:', await page.locator('text=Summary of Your Reported Symptoms').count() > 0);
const summaryText = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('p'));
  const el = els.find(p => /Based on your responses/i.test(p.textContent || ''));
  return el ? el.textContent : null;
});
console.log('Summary sentence:', JSON.stringify(summaryText));
console.log('Summary mentions fever:', /fever/i.test(summaryText || ''));
console.log('Summary mentions cough:', /cough/i.test(summaryText || ''));
console.log('Summary mentions breathing (Q8 YES):', /breathing/i.test(summaryText || ''));
console.log('Summary does NOT say "you have" a disease:', !/you have (dengue|malaria|pneumonia|diabetes)/i.test(summaryText || ''));
await page.screenshot({ path: 'verify_summary_screen.png' });

// === TEST G: Continue Booking through remaining steps ===
console.log('\n=== TEST G: Continue Booking flow ===');
await page.locator('button:has-text("Continue Booking")').first().click();
await page.waitForTimeout(300);
console.log('Patient Details step:', await page.locator('text=PATIENT DETAILS').count() > 0);
await page.locator('button:has-text("Continue to Doctor Selection")').first().click();
await page.waitForTimeout(300);
console.log('Doctor step reached:', await page.locator('text=AVAILABLE DOCTORS').count() > 0 || await page.locator('button:has-text("Continue to Date")').count() > 0);
await page.locator('button:has-text("Continue to Date")').first().click();
await page.waitForTimeout(300);
console.log('Date step:', await page.locator('text=SELECT DATE').count() > 0);
await page.locator('button:has-text("Continue to Time Slot")').first().click();
await page.waitForTimeout(300);
console.log('Slot step:', await page.locator('text=AVAILABLE SLOTS').count() > 0);
await page.locator('button:has-text("Review Appointment Summary")').first().click();
await page.waitForTimeout(300);
console.log('Confirm step reached:', await page.locator('button:has-text("Confirm Appointment")').count() > 0);

console.log('\nCONSOLE_ERRORS:', JSON.stringify(errors));
await browser.close();
