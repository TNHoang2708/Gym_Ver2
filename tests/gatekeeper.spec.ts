import { test, expect } from '@playwright/test';

test.describe('Auth and Onboarding Flow (Gatekeeper)', () => {
  
  test('1. Public routes rendering - Landing Page', async ({ page }) => {
    // Navigate to the landing page
    const response = await page.goto('/');
    
    // Ensure the page loads successfully (HTTP 200)
    expect(response?.status()).toBe(200);

    // Verify basic structure is present (body element)
    await expect(page.locator('body')).toBeVisible();

    // Check for common public elements like a header or nav, 
    // even if we don't know the exact class names.
    const title = await page.title();
    expect(title).not.toBe('');
  });

  test('2. Auth redirects - Accessing /dashboard should redirect to /login', async ({ page }) => {
    // Attempt to navigate to a protected route
    await page.goto('/dashboard');
    
    // The application should intercept this and redirect to the login page.
    // We use a regex to match `/login` or `/login?callbackUrl=...`
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('3. Login form presence and validation errors', async ({ page }) => {
    await page.goto('/login');
    
    // Ensure the login page loaded correctly
    await expect(page).toHaveURL(/.*\/login/);

    // Locate standard form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]');

    // Assert their presence on the screen
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Attempt to submit the form without filling in any fields
    await submitButton.click();

    // Validate that the user is not navigated away from the login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // The submit button should remain visible (form didn't transition to a success state)
    await expect(submitButton).toBeVisible();
  });

  test('4. Registration form presence and validation errors', async ({ page }) => {
    // Navigate to the registration route
    // Note: If your app uses `/signup` instead, change this path.
    const response = await page.goto('/register');
    
    // Fallback if the app uses /signup instead of /register
    if (response?.status() === 404) {
      await page.goto('/signup');
    }
    
    // Locate standard form elements for registration
    // There might be additional fields like 'name', but email/password are universally present.
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]');

    // Assert their presence
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Attempt to submit the empty registration form
    await submitButton.click();

    // Validate that the user is not navigated away from the registration page
    await expect(page).toHaveURL(/.*\/register|.*\/signup/);
    
    // Check that the form still exists in the viewport
    await expect(submitButton).toBeVisible();
  });
});
