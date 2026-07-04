/**
 * NIA Patient Journey Test Runner — v2
 * Executes each profile in patient-journeys.json against the live Vercel deployment.
 */

import puppeteer from '/tmp/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://nia-medtourism-web.vercel.app';
const RESULTS_DIR = join(__dirname, 'results');
mkdirSync(RESULTS_DIR, { recursive: true });

const journeys = JSON.parse(readFileSync(join(__dirname, 'patient-journeys.json'), 'utf-8')).journeys;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Full condition labels as they appear in the TriageWidget
const CONDITION_LABELS = {
  diabetes:       'Diabetes (Type 1 or 2)',
  cancerTreatment:'Cancer or cancer treatment in the last 5 years',
  organTransplant:'Organ transplant history',
  dvt:            'DVT or blood clots',
  pacemaker:      'Pacemaker or cardiac implant',
  hypertension:   'High blood pressure (on medication)',
  heartDisease:   'Heart disease',
  thyroidDisorder:'Thyroid disorder',
  immuneDisorder: 'Immune disorder or autoimmune condition',
  pregnancy:      'Currently pregnant or trying to conceive',
  allergies:      'Severe allergies (e.g. anaesthesia or latex)',
};

async function waitForNiaIdle(page, timeout = 50_000) {
  // Wait for the "Nia is typing" pulse dot to disappear
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const typing = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Nia is typing');
    });
    if (!typing) break;
    await sleep(500);
  }
  await sleep(1500); // let React settle
}

async function isTriageVisible(page) {
  return page.evaluate(() => {
    // Check for the "Medical screening" header and "Submit answers" button
    const text = document.body.innerText;
    return text.includes('Medical screening') && text.includes('Submit answers');
  });
}

async function isGalleryVisible(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Before / After') ||
           text.includes('I understand and want to view') ||
           text.includes('partner clinics') ||
           text.includes('clinic results');
  });
}

async function areClinicsVisible(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('top-rated partner') ||
           text.includes('clinics for your procedure') ||
           text.includes('View Clinic') ||
           text.includes('partner clinic');
  });
}

async function isIntakeComplete(page) {
  return page.evaluate(() => document.body.innerText.includes('Consultation Registered'));
}

async function getLastNiaMessage(page) {
  return page.evaluate(() => {
    // Nia messages have rounded-tl-sm class
    const bubbles = Array.from(document.querySelectorAll('[class*="rounded-tl-sm"]'));
    return bubbles.length > 0 ? bubbles[bubbles.length - 1].textContent.trim() : '';
  });
}

async function sendChatMessage(page, text) {
  // Chat input is hidden while triage is showing — check first
  const inputVisible = await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    return !!input && input.offsetParent !== null;
  });
  if (!inputVisible) throw new Error('Chat input not found (triage widget may be blocking)');

  const input = await page.$('input[type="text"]');
  await input.click({ clickCount: 3 });
  await input.type(text, { delay: 15 });
  await page.keyboard.press('Enter');
}

async function submitTriage(page, triage) {
  // Click Yes for any condition that should be true
  for (const [key, shouldBeYes] of Object.entries(triage)) {
    if (!shouldBeYes) continue;
    const fullLabel = CONDITION_LABELS[key];
    if (!fullLabel) continue;

    const clicked = await page.evaluate((label) => {
      // Find the condition row span with this exact label
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.trim() === label);
      if (!span) return false;
      // The Yes button is the first button in the sibling div
      const row = span.parentElement;
      if (!row) return false;
      const btns = row.querySelectorAll('button');
      if (btns.length >= 1) { btns[0].click(); return true; }
      return false;
    }, fullLabel);

    if (clicked) {
      await sleep(300);
    } else {
      console.log(`  ⚠ Could not click Yes for: ${key}`);
    }
  }

  await sleep(400);

  // Click "Submit answers"
  const submitted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submit = btns.find(b => b.textContent.includes('Submit answers'));
    if (submit) { submit.click(); return true; }
    return false;
  });

  if (!submitted) console.log('  ⚠ Submit button not found');
  await sleep(800);
}

async function runJourney(browser, journey) {
  const { id, label, profile, messages, expectedEvents = [], expectedNotEvents = [] } = journey;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[${id}] ${label}`);
  console.log(`${'─'.repeat(60)}`);

  const events = new Set();
  const niaNotes = [];
  let page;
  let triageSubmitted = false;

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/concierge?name=${encodeURIComponent(profile.name)}`, {
      waitUntil: 'networkidle2',
      timeout: 30_000,
    });
    await sleep(2000);
    await waitForNiaIdle(page, 15_000).catch(() => {});

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      // If triage is showing, submit it before continuing
      if (!triageSubmitted && await isTriageVisible(page)) {
        events.add('triage_shown');
        triageSubmitted = true;
        console.log(`  ✓ Triage widget appeared — submitting with profile flags`);
        await submitTriage(page, profile.triage);
        await waitForNiaIdle(page, 30_000).catch(() => {});
        const lastNia = await getLastNiaMessage(page);
        if (lastNia) {
          console.log(`  ← Nia (post-triage): ${lastNia.substring(0, 120)}…`);
          niaNotes.push(lastNia);
        }
      }

      // Check if intake already completed
      if (await isIntakeComplete(page)) {
        events.add('intake_complete');
        console.log(`  ✓ Intake complete (detected before message ${i + 1})`);
        break;
      }

      // Try to send the message
      try {
        console.log(`  → Patient: ${msg.substring(0, 80)}${msg.length > 80 ? '…' : ''}`);
        await sendChatMessage(page, msg);
      } catch (err) {
        // If input is blocked, check for triage
        if (await isTriageVisible(page)) {
          if (!triageSubmitted) {
            events.add('triage_shown');
            triageSubmitted = true;
            console.log(`  ✓ Triage widget (mid-messages) — submitting`);
            await submitTriage(page, profile.triage);
            await waitForNiaIdle(page, 30_000).catch(() => {});
          }
          // Retry message
          try {
            await sendChatMessage(page, msg);
          } catch { console.log(`  ⚠ Could not send: ${msg.substring(0, 40)}`); continue; }
        } else {
          console.log(`  ⚠ ${err.message}`);
          continue;
        }
      }

      await waitForNiaIdle(page, 50_000).catch(() => sleep(10_000));

      // Auto-reply if Nia is asking about language preference
      const lastMsgCheck = await getLastNiaMessage(page);
      if (lastMsgCheck && (lastMsgCheck.toLowerCase().includes('preferred language') ||
          lastMsgCheck.toLowerCase().includes('your language') ||
          lastMsgCheck.toLowerCase().includes('communicate in'))) {
        console.log(`  ↪ Auto-reply: language preference (English)`);
        try { await sendChatMessage(page, 'English please'); } catch {}
        await waitForNiaIdle(page, 30_000).catch(() => {});
      }

      // Check all events after each message
      if (!triageSubmitted && await isTriageVisible(page)) {
        events.add('triage_shown');
        triageSubmitted = true;
        console.log(`  ✓ Triage widget appeared — submitting with profile flags`);
        await submitTriage(page, profile.triage);
        await waitForNiaIdle(page, 30_000).catch(() => {});
      }

      if (await isGalleryVisible(page))    events.add('gallery_shown');
      if (await areClinicsVisible(page))   events.add('clinics_shown');
      if (await isIntakeComplete(page)) {
        events.add('intake_complete');
        console.log(`  ✓ Intake complete!`);
      }

      const lastNia = await getLastNiaMessage(page);
      if (lastNia) {
        console.log(`  ← Nia: ${lastNia.substring(0, 120)}${lastNia.length > 120 ? '…' : ''}`);
        niaNotes.push(lastNia);
      }

      if (events.has('intake_complete')) break;
    }

    // Final checks
    if (!triageSubmitted && await isTriageVisible(page)) {
      events.add('triage_shown');
      console.log(`  ✓ Triage (end of messages) — submitting`);
      await submitTriage(page, profile.triage);
      await waitForNiaIdle(page, 30_000).catch(() => {});
      if (await isIntakeComplete(page)) {
        events.add('intake_complete');
        console.log(`  ✓ Intake complete (after final triage)!`);
      }
    }

    const screenshotPath = join(RESULTS_DIR, `${id}-final.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  📸 Screenshot: tests/results/${id}-final.png`);

  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
  } finally {
    if (page) await page.close();
  }

  // Evaluate
  const passed = [];
  const failed = [];

  for (const ev of expectedEvents) {
    if (events.has(ev)) passed.push(ev);
    else failed.push(`MISSING: ${ev}`);
  }
  for (const ev of expectedNotEvents) {
    if (events.has(ev)) failed.push(`SHOULD NOT HAVE OCCURRED: ${ev}`);
    else passed.push(`correctly absent: ${ev}`);
  }

  const status = failed.length === 0 ? 'PASS' : 'FAIL';
  return { id, label, status, events: [...events], passed, failed, niaNotes };
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];
  for (const journey of journeys) {
    const result = await runJourney(browser, journey);
    results.push(result);
    await sleep(3000);
  }

  await browser.close();

  writeFileSync(join(RESULTS_DIR, 'report.json'), JSON.stringify(results, null, 2));

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('JOURNEY TEST REPORT');
  console.log('═'.repeat(60));
  let pass = 0, fail = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.id}] ${r.label}`);
    for (const f of r.failed) console.log(`       ↳ ${f}`);
  }
  results.forEach(r => r.status === 'PASS' ? pass++ : fail++);
  console.log('─'.repeat(60));
  console.log(`Total: ${pass} PASS  ${fail} FAIL  (${results.length} journeys)`);
  return results;
}

main().catch(console.error);
