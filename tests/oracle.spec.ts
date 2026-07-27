import { test, expect } from '@playwright/test';

test.describe('Module Security & Access Tests', () => {
  test('Unauthenticated users are redirected to /login when accessing /ai-coach', async ({ page }) => {
    await page.goto('/ai-coach');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Unauthenticated users are redirected to /login when accessing /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Access to /admin is restricted by proxy anti-bot rules (403 or redirect)', async ({ page }) => {
    const response = await page.goto('/admin');
    
    // page.goto follows redirects, so if it redirected to /login or elsewhere, check URL
    const currentUrl = page.url();
    
    if (currentUrl.endsWith('/admin')) {
      // If it didn't redirect, the proxy must have returned 403 Forbidden
      expect(response?.status()).toBe(403);
    } else {
      // If it did redirect, ensure it's no longer on the admin page
      expect(currentUrl).not.toMatch(/\/admin\/?$/);
    }
  });

  test('Access to /api/admin/hidden-login is restricted by proxy anti-bot rules (403 or redirect)', async ({ request }) => {
    // For API endpoints, using the API request context to catch the exact status code
    const response = await request.get('/api/admin/hidden-login', {
      maxRedirects: 0, // Prevent following redirects automatically to inspect the first response
      failOnStatusCode: false
    });
    
    const status = response.status();
    
    // It should either be a redirect (3xx) or forbidden (403). 
    // We also accept 404 just in case it's completely hidden.
    const isRedirect = status >= 300 && status < 400;
    const isForbiddenOrNotFound = status === 403 || status === 404;
    
    expect(isRedirect || isForbiddenOrNotFound).toBeTruthy();
  });
});
