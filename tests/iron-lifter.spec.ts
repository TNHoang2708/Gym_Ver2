import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  const protectedRoutes = [
    '/workout/history',
    '/bmi',
    '/progress',
    '/workout/active',
  ];

  for (const route of protectedRoutes) {
    test(`should redirect unauthenticated user to /login when accessing ${route}`, async ({ page }) => {
      // Attempt to visit the protected route
      await page.goto(route);

      // Verify that the user is redirected to the login page.
      // We use a regex to match the /login path, which also accommodates
      // any query parameters (like ?callbackUrl=) Next.js might append.
      await expect(page).toHaveURL(/.*\/login.*/);
    });
  }
});
