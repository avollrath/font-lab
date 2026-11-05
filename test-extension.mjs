/**
 * Browser integration test for Font Lab side panel extension.
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

console.log('\n=== Font Lab Side Panel Integration Tests ===\n');

// Get extension ID
let extensionId = null;
for (const sw of context.serviceWorkers()) {
  const m = sw.url().match(/chrome-extension:\/\/([^/]+)/);
  if (m) { extensionId = m[1]; break; }
}
log(!!extensionId, `Extension loaded (ID: ${extensionId})`);

// Open side panel by navigating to it directly (since we can't click toolbar in automation)
// The side panel is accessible as chrome-extension://ID/sidepanel.html
const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html?origin=https://example.com`;
const spPage = await context.newPage();
await spPage.goto(sidePanelUrl);
await sleep(1500);

await spPage.screenshot({ path: 'test-ss-sp-1.png' });

// --- Test: Side panel renders ---
const appVisible = await spPage.locator('.fl-app').isVisible().catch(() => false);
log(appVisible, 'Side panel app renders');

const headerVisible = await spPage.locator('.fl-header').isVisible().catch(() => false);
log(headerVisible, 'Header is visible');

// --- Test: Navigation tabs ---
const elemTab = spPage.locator('.fl-nav-tab').first();
const tabVisible = await elemTab.isVisible().catch(() => false);
log(tabVisible, 'Nav tabs visible');

// --- Test: Elements list renders ---
await spPage.locator('.fl-nav-tab').first().click();
await sleep(300);
const categories = await spPage.locator('.fl-category').count();
log(categories > 0, `Elements list shows ${categories} categories`);

await spPage.screenshot({ path: 'test-ss-sp-2.png' });

// --- Test: Expand element ---
const firstRow = spPage.locator('.fl-element-header').first();
await firstRow.click();
await sleep(300);
const controlsVisible = await spPage.locator('.fl-element-controls').isVisible().catch(() => false);
log(controlsVisible, 'Element expands to show controls');

// --- Test: Font picker opens ---
if (controlsVisible) {
  await spPage.locator('.fl-font-picker-trigger').first().click();
  await sleep(400);
  const dropdownOpen = await spPage.locator('.fl-font-dropdown').isVisible().catch(() => false);
  log(dropdownOpen, 'Font dropdown opens');

  await spPage.screenshot({ path: 'test-ss-sp-3.png' });

  if (dropdownOpen) {
    // --- Test: Category button doesn't close dropdown ---
    const catBtns = spPage.locator('.fl-font-dropdown .fl-category-btn');
    const catCount = await catBtns.count();
    if (catCount > 1) {
      await catBtns.nth(1).click();
      await sleep(300);
      const stillOpen = await spPage.locator('.fl-font-dropdown').isVisible().catch(() => false);
      log(stillOpen, 'Dropdown stays open after clicking category button');
    }

    // --- Test: Select a font ---
    const fontItems = spPage.locator('.fl-font-list-item');
    const itemCount = await fontItems.count();
    log(itemCount > 0, `Font list has ${itemCount} items`);

    if (itemCount > 0) {
      const fontName = await fontItems.first().locator('.fl-font-preview-name').textContent();
      await fontItems.first().click();
      await sleep(400);

      const dropdownClosed = !(await spPage.locator('.fl-font-dropdown').isVisible().catch(() => true));
      log(dropdownClosed, `Selecting "${fontName}" closes the dropdown`);

      const triggerText = await spPage.locator('.fl-font-picker-trigger span').first().textContent();
      log(triggerText === fontName, `Trigger shows selected font: "${triggerText}"`);
    }

    await spPage.screenshot({ path: 'test-ss-sp-4.png' });
  }
}

// --- Test: Toggle enable/disable ---
const toggleBtn = spPage.locator('.fl-btn-icon').first();
await toggleBtn.click();
await sleep(300);
const statusAfterToggle = await spPage.locator('.fl-status--active').count();
log(statusAfterToggle === 0, 'Disabling styles removes active status');

await toggleBtn.click();
await sleep(300);
const statusAfterReEnable = await spPage.locator('.fl-status--active').count();
log(statusAfterReEnable > 0, 'Re-enabling styles restores active status');

// --- Test: Presets tab ---
await spPage.locator('.fl-nav-tab').nth(1).click();
await sleep(300);
const presetsVisible = await spPage.locator('.fl-presets').isVisible().catch(() => false);
log(presetsVisible, 'Presets tab renders');

// --- Test: Export tab ---
await spPage.locator('.fl-nav-tab').nth(2).click();
await sleep(300);
const exportVisible = await spPage.locator('.fl-export').isVisible().catch(() => false);
log(exportVisible, 'Export tab renders');

await spPage.screenshot({ path: 'test-ss-sp-final.png' });

// --- Test: Main page still works (no overlay on the page) ---
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
