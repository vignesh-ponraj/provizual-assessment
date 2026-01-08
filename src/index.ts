import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { Steel } from 'steel-sdk';

dotenv.config();

async function scrapeAbileneSite() {
  const apiKey = process.env.STEEL_API_KEY;

  if (!apiKey) {
    throw new Error('STEEL_API_KEY environment variable is not set');
  }

  const steel = new Steel({ steelAPIKey: apiKey });

  const session = await steel.sessions.create();
  console.log(`Watch live: ${session.sessionViewerUrl}\n`);

  const wsEndpoint = `wss://connect.steel.dev?apiKey=${apiKey}&sessionId=${session.id}`;
  const browser = await chromium.connectOverCDP(wsEndpoint);

  const context = browser.contexts()[0];
  const page = context?.pages()[0] || await context!.newPage();

  try {
    await page.goto('http://public.mygov.us/tx_abilene', { waitUntil: 'networkidle' });

    const addressLookupImage = page.locator('img[src="/assets/img/oac/address-lookup.png?1"]');
    await addressLookupImage.waitFor({ state: 'visible', timeout: 10000 });
    await addressLookupImage.click();
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('100 Main St');

    await page.waitForTimeout(2000);

    await page.waitForSelector('.lookup-container', { timeout: 10000 });

    const firstAccordion = page.locator('a.accordion-toggle').first();
    await firstAccordion.click();
    await page.waitForTimeout(2000);

    const casesToggleButton = page.locator('a.lookup-toggle-button').first();
    await casesToggleButton.waitFor({ state: 'visible', timeout: 10000 });
    await casesToggleButton.click();
    await page.waitForTimeout(2000);

    const junkVehicleCase = page.locator('strong.canceled:has-text("canceled")').first();
    await junkVehicleCase.waitFor({ state: 'visible', timeout: 10000 });

    await junkVehicleCase.click();
    await page.waitForTimeout(2000);

    const tbody = page.locator('tbody').first();
    const rows = await tbody.locator('tr').all();

    console.log('Case Updates:');
    for (const row of rows) {
      const rowText = await row.textContent();
      if (rowText && (rowText.includes('Archived') || rowText.includes('Started'))) {
        const cleanText = rowText.replace(/\s+/g, ' ').trim();
        console.log(cleanText);
      }
    }

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
    await steel.sessions.release(session.id);
  }
}

scrapeAbileneSite().catch(console.error);
