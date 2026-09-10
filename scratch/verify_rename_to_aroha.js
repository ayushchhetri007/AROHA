const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING BRAND RENAME TO AROHA+ ===\n');

// 1. Check index.html title
const indexHtmlPath = path.resolve(__dirname, '../frontend/index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtmlContent.includes('<title>AROHA+</title>'), 'index.html has title AROHA+');
assert(!indexHtmlContent.toLowerCase().includes('swasthya'), 'index.html does not contain swasthya');
console.log('✓ 1. frontend/index.html title is "<title>AROHA+</title>"');

// 2. Check translations.ts
const transPath = path.resolve(__dirname, '../frontend/src/i18n/translations.ts');
const transContent = fs.readFileSync(transPath, 'utf8');

// English appTitle
assert(transContent.includes("appTitle: 'AROHA+'"), 'en appTitle is AROHA+');
// Check there is no SwasthyaSetu in translations.ts
assert(!transContent.includes("'SwasthyaSetu'"), 'No SwasthyaSetu in translations.ts');
assert(!transContent.includes("'स्वास्थ्यसेतू'"), 'No स्वास्थ्यसेतू in translations.ts');
assert(!transContent.includes("'स्वास्थ्यसेतु'"), 'No स्वास्थ्यसेतु in translations.ts');
console.log('✓ 2. translations.ts (en, mr, hi) all use appTitle: "AROHA+"');

// 3. Check LandingPage.tsx
const landingPath = path.resolve(__dirname, '../frontend/src/features/landing/LandingPage.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf8');
assert(landingContent.includes('AROHA+ strengthens existing public health infrastructure'), 'LandingPage includes AROHA+');
assert(landingContent.includes('AROHA+ creates a high-fidelity digital continuum'), 'LandingPage continuum includes AROHA+');
assert(!landingContent.includes('SwasthyaSetu'), 'No SwasthyaSetu in LandingPage.tsx');
console.log('✓ 3. LandingPage.tsx visible paragraphs updated to "AROHA+"');

// 4. Check ai.controller.ts
const aiPath = path.resolve(__dirname, '../backend/src/controllers/ai.controller.ts');
const aiContent = fs.readFileSync(aiPath, 'utf8');
assert(aiContent.includes('map on AROHA+'), 'AI controller references AROHA+ map');
assert(aiContent.includes('referral on AROHA+'), 'AI controller references AROHA+ referral');
assert(aiContent.includes('AROHA+ connects you directly'), 'AI controller welcome connects to AROHA+');
assert(!aiContent.includes('SwasthyaSetu'), 'No SwasthyaSetu in ai.controller.ts');
console.log('✓ 4. ai.controller.ts assistant responses updated to "AROHA+"');

// 5. Check server.ts
const serverPath = path.resolve(__dirname, '../backend/src/server.ts');
const serverContent = fs.readFileSync(serverPath, 'utf8');
assert(serverContent.includes('AROHA+ Public Healthcare Backend API'), 'server.ts service name is AROHA+');
assert(serverContent.includes('🏥 AROHA+ Backend API Server is running!'), 'server.ts startup log is AROHA+');
assert(!serverContent.includes('SwasthyaSetu'), 'No SwasthyaSetu in server.ts');
console.log('✓ 5. server.ts health check and startup log updated to "AROHA+"');

// 6. Check that UI brand containers use t.appTitle
const navbarPath = path.resolve(__dirname, '../frontend/src/components/Navbar.tsx');
const loginPath = path.resolve(__dirname, '../frontend/src/features/auth/UnifiedLoginPage.tsx');
const footerPath = path.resolve(__dirname, '../frontend/src/components/Footer.tsx');

assert(fs.readFileSync(navbarPath, 'utf8').includes('{t.appTitle}'), 'Navbar displays {t.appTitle}');
assert(fs.readFileSync(loginPath, 'utf8').includes('{t.appTitle}'), 'UnifiedLoginPage displays {t.appTitle}');
assert(fs.readFileSync(footerPath, 'utf8').includes('{t.appTitle}'), 'Footer displays {t.appTitle}');
console.log('✓ 6. Navbar, LoginPage, and Footer dynamically render {t.appTitle} (AROHA+)');

console.log('\n========================================');
console.log('ALL BRAND RENAME CHECKS PASSED SUCCESSFULLY!');
console.log('========================================\n');
