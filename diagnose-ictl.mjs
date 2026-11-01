import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Capture all network responses
page.on('response', async res => {
  const status = res.status();
  if (status >= 400) {
    console.log(`[HTTP ${status}] ${res.url()}`);
    if (status === 500) {
      try {
        const text = await res.text();
        console.log(`Body snippet: ${text.substring(0, 500)}`);
      } catch (e) {
        console.log('Could not read body');
      }
    }
  }
});

try {
  await page.goto('http://192.168.1.69:8081', { waitUntil: 'networkidle', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHTML = await page.locator('#root').innerHTML();
  console.log('\n--- Root Content ---');
  console.log(rootHTML ? `Length: ${rootHTML.length}` : 'EMPTY');
  
} catch (e) {
  console.error('Navigation error:', e.message);
} finally {
  await browser.close();
}