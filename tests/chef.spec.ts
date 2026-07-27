import { test, expect } from '@playwright/test';

test.describe('Nutrition and Diary Modules (Unauthenticated)', () => {

  test('should redirect to /login when accessing /nutrition unauthenticated', async ({ page }) => {
    await page.goto('/nutrition');
    
    // Check if it redirects to login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Verify Login page title
    // Some login pages might have just the app title or a specific login title, adjusting to a regex that generally matches Login
    // but assuming standard behaviour, we can check for "Login" or similar in a heading or title.
    // Let's check for "Login" or "Sign in" in the page content or title.
    const loginHeading = page.locator('h1, h2').filter({ hasText: /Login|Sign in/i }).first();
    // It's safer to check for typical login inputs as requested
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('should redirect to /login when accessing /diary unauthenticated', async ({ page }) => {
    await page.goto('/diary');
    
    // Check if it redirects to login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Verify typical login inputs are present to catch the redirected user
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

});
