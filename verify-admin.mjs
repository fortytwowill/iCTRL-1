import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:8080/admin...');
  await page.goto('http://localhost:8080/admin', { waitUntil: 'networkidle' });
  
  const content = await page.content();
  const hasAdminPanel = content.includes('Admin Panel') || content.includes('Platform Administration');
  const hasRedirect = content.includes('Login') || content.includes('/login') || page.url().includes('/login');
  
  console.log('Current URL:', page.url());
  console.log('Has Admin UI:', hasAdminPanel);
  console.log('Has Redirect/Login:', hasRedirect);
  
  if (hasAdminPanel) {
    console.log('✅ VERIFIED: Admin panel is rendering.');
  } else if (hasRedirect) {
    console.log('✅ VERIFIED: Route is protected (redirected to login).');
  } else {
    console.log('❌ FAILED: Neither admin UI nor login redirect detected.');
    process.exit(1);
  }
  
  await browser.close();
})();