/**
 * Browser integration test for FontPickle side panel extension.
 * Run: node test-extension.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.join(__dirname, '.output', 'chrome-mv3');
const CHROMIUM_PATH = 'C:/Users/zeeph/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';

let passed = 0;
let failed = 0;

function log(ok, msg) {
  const mark = ok ? '✓' : '✗';
  console.log(`  ${mark} ${msg}`);
  if (ok) passed++; else failed++;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const context = await chromium.launchPersistentContext('', {
  executablePath: CHROMIUM_PATH,
  headless: false,
  args: [
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`,
    '--no-sandbox',
  ],
  viewport: { width: 1280, height: 800 },
});

await sleep(1500);

const page = await context.newPage();
await page.goto('https://example.com');
await sleep(1000);

console.log('\n=== FontPickle Side Panel Integration Tests ===\n');

// Get extension ID
let extensionId = null;
for (const sw of context.serviceWorkers()) {
  const m = sw.url().match(/chrome-extension:\/\/([^/]+)/);
  if (m) { extensionId = m[1]; break; }
}
log(!!extensionId, `Extension loaded (ID: ${extensionId})`);

// Open side panel
const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html?origin=https://example.com`;
const spPage = await context.newPage();
await spPage.goto(sidePanelUrl);
await sleep(2000);

await spPage.screenshot({ path: 'test-ss-sp-1.png' });

// --- Test: Side panel renders ---
const appVisible = await spPage.locator('.fp-app').isVisible().catch(() => false);
log(appVisible, 'Side panel app renders');

const headerVisible = await spPage.locator('.fp-header').isVisible().catch(() => false);
log(headerVisible, 'Header is visible');

// --- Test: Navigation tabs ---
const elemTab = spPage.locator('.fp-nav-tab').first();
const tabVisible = await elemTab.isVisible().catch(() => false);
log(tabVisible, 'Nav tabs visible');

// --- Test: Elements list renders ---
await spPage.locator('.fp-nav-tab').first().click();
await sleep(300);
const elementRows = await spPage.locator('.fp-element-row').count();
log(elementRows > 0, `Elements list shows ${elementRows} rows`);

await spPage.screenshot({ path: 'test-ss-sp-2.png' });

// --- Test: Selecting a row updates inspector ---
const firstRow = spPage.locator('.fp-element-row').first();
await firstRow.click();
await sleep(300);
const inspectorVisible = await spPage.locator('.fp-inspector').isVisible().catch(() => false);
log(inspectorVisible, 'Inspector is visible after selecting a row');

// --- Test: Font picker opens ---
if (inspectorVisible) {
  await spPage.locator('.fp-font-btn').first().click();
  await sleep(500);
  const popoverOpen = await spPage.locator('.fp-popover').isVisible().catch(() => false);
  log(popoverOpen, 'Font picker popover opens');

  await spPage.screenshot({ path: 'test-ss-sp-3.png' });

  if (popoverOpen) {
    // --- Test: Category button doesn't close popover ---
    const catBtns = spPage.locator('.fp-popover .fp-cat-btn');
    const catCount = await catBtns.count();
    if (catCount > 1) {
      await catBtns.nth(1).click();
      await sleep(300);
      const stillOpen = await spPage.locator('.fp-popover').isVisible().catch(() => false);
      log(stillOpen, 'Popover stays open after clicking category button');
    }

    // --- Test: Font list has items ---
    const fontItems = spPage.locator('.fp-font-item');
    const itemCount = await fontItems.count();
    log(itemCount > 0, `Font list has ${itemCount} items`);

    if (itemCount > 0) {
      const fontName = await fontItems.first().locator('.fp-font-name').textContent();
      await fontItems.first().click();
      await sleep(400);

      const popoverClosed = !(await spPage.locator('.fp-popover').isVisible().catch(() => true));
      log(popoverClosed, `Selecting "${fontName}" closes the popover`);

      const btnText = await spPage.locator('.fp-font-btn .fp-font-btn-text').first().textContent();
      log(btnText === fontName, `Font button shows selected font: "${btnText}"`);
    }

    await spPage.screenshot({ path: 'test-ss-sp-4.png' });
  }
}

// --- Test: Toggle enable/disable global ---
const toggleBtn = spPage.locator('.fp-icon-btn').first();
await toggleBtn.click();
await sleep(300);
const statusAfterToggle = await spPage.locator('.fp-status--active').count();
log(statusAfterToggle === 0, 'Disabling styles removes active status');

await toggleBtn.click();
await sleep(300);
const statusAfterReEnable = await spPage.locator('.fp-status--active').count();
log(statusAfterReEnable > 0, 'Re-enabling styles restores active status');

// --- Test: Presets tab ---
await spPage.locator('.fp-nav-tab').nth(1).click();
await sleep(300);
const presetsVisible = await spPage.locator('.fp-presets').isVisible().catch(() => false);
log(presetsVisible, 'Presets tab renders');

// --- Test: Export tab ---
await spPage.locator('.fp-nav-tab').nth(2).click();
await sleep(300);
const exportVisible = await spPage.locator('.fp-export').isVisible().catch(() => false);
log(exportVisible, 'Export tab renders');

await spPage.screenshot({ path: 'test-ss-sp-final.png' });

// --- Test: Main page still works ---
const pageTitle = await page.title();
log(pageTitle.length > 0, `Main page still functional (title: "${pageTitle}")`);
const noOverlay = await page.evaluate(() => !document.getElementById('font-lab-root') || !document.getElementById('font-lab-root')?.shadowRoot?.querySelector('.fl-panel'));
log(noOverlay, 'No floating overlay injected into the page');

await context.close();

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}
