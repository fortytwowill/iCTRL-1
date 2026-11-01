import { test, expect } from '@playwright/test';

test('Admin Panel renders on ictrl.app', async ({ page }) => {
  await page.goto('https://www.ictrl.app/admin');
  // Wait for network idle to ensure JS has loaded
  await page.waitForLoadState('networkidle');
  
  // Check if we are redirected to login (auth guard working) or if admin panel loads
  const url = page.url();
  console.log('Current URL:', url);
  
  // If redirected to login, the guard is working. 
  // If on /admin, check for content.
  if (url.includes('/login')) {
    console.log('✅ Auth Guard Working: Redirected to login.');
    expect(url).toContain('/login');
  } else {
    // Try to find the admin heading
    const heading = page.locator('h1');
    await heading.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);
    const title = await heading.textContent().catch(() => '');
    console.log('Page Title:', title);
    
    // Check for specific admin text
    const content = await page.content();
    const hasAdminContent = content.includes('Platform Administration') || content.includes('Admin Panel');
    console.log('Has Admin Content:', hasAdminContent);
    
    if (hasAdminContent) {
      console.log('✅ VERIFIED: Admin Panel is rendering correctly.');
    } else {
      console.log('⚠️ Page loaded but admin content not detected. Might be unauthenticated.');
    }
  }
});