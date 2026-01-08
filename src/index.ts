import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { Steel } from 'steel-sdk';

// Load environment variables from .env
dotenv.config();

async function scrapeAbileneSite() {
  // Get Steel API key from environment variables
  const apiKey = process.env.STEEL_API_KEY;

  // Validatign if API key is present
  if (!apiKey) {
    throw new Error('STEEL_API_KEY environment variable is not set');
  }

  // Initialize Steel client
  const steel = new Steel({ steelAPIKey: apiKey });

  // Create a new Steel session for browser
  const session = await steel.sessions.create();
  console.log(`\nWatch live: ${session.sessionViewerUrl}\n`);

  // Connect Playwright to the Steel session via CDP
  const wsEndpoint = `wss://connect.steel.dev?apiKey=${apiKey}&sessionId=${session.id}`;
  const browser = await chromium.connectOverCDP(wsEndpoint);

  // Get the browser context and page from the Steel session
  const context = browser.contexts()[0];
  const page = context?.pages()[0] || await context!.newPage();

  try {
    console.log('Navigating to Abilene MyGov homepage...');
    await page.goto('http://public.mygov.us/tx_abilene', { waitUntil: 'networkidle' });

    console.log('Clicking on Address Lookup...');
    const addressLookupImage = page.locator('img[src="/assets/img/oac/address-lookup.png?1"]');
    await addressLookupImage.waitFor({ state: 'visible', timeout: 10000 });
    await addressLookupImage.click();
    await page.waitForLoadState('networkidle');

    // Wait for Vue.js app to initialize
    await page.waitForTimeout(2000);

    console.log('Searching for "100 Main St"...');
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('100 Main St');

    // Wait for auto-search to complete
    await page.waitForTimeout(2000);

    // Wait for search results to appear
    console.log('Waiting for search results...');
    await page.waitForSelector('.lookup-container', { timeout: 10000 });

    console.log('Expanding address accordion...');
    const firstAccordion = page.locator('a.accordion-toggle').first();
    await firstAccordion.click();
    await page.waitForTimeout(2000);

    console.log('Showing cases list...');
    const casesToggleButton = page.locator('a.lookup-toggle-button').first();
    await casesToggleButton.waitFor({ state: 'visible', timeout: 10000 });
    await casesToggleButton.click();
    await page.waitForTimeout(2000);

    console.log('Finding Junk Vehicles case...');
    const junkVehicleCase = page.locator('strong.canceled:has-text("canceled")').first();
    await junkVehicleCase.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Expanding Junk Vehicles case details...');
    await junkVehicleCase.click();
    await page.waitForTimeout(2000);

    console.log('Extracting case updates...\n');
    const tbody = page.locator('tbody').first();
    const rows = await tbody.locator('tr').all();

    console.log('=== Case Updates ===');
    for (const row of rows) {
      const rowText = await row.textContent();
      if (rowText) {
        console.log(rowText);
      }
    }
    console.log('====================\n');

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    // Clean up by closning browser and releasing Steel session
    await browser.close();
    await steel.sessions.release(session.id);
  }
}

scrapeAbileneSite().catch(console.error);
