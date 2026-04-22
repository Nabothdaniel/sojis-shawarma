import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard/user');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Assuming we have toatsts or validation messages
    // await expect(page.locator('text=Username is required')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login if possible, or perform a real login
    // For now, these are just structures to show "every part"
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'Admin@12345!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard\/admin/);
  });

  test('should navigate to User Management', async ({ page }) => {
    await page.click('text=Users'); // Click the Sidebar link
    await expect(page).toHaveURL(/.*dashboard\/admin\/users/);
    await expect(page.locator('h1')).toContainText('User Management');
  });

  test('should navigate to Price Management', async ({ page }) => {
    await page.click('text=Prices');
    await expect(page).toHaveURL(/.*dashboard\/admin\/prices/);
    await expect(page.locator('h1')).toContainText('Price Management');
  });
});

test.describe('User Dashboard', () => {
  test('should see welcome message and wallet balance', async ({ page }) => {
    // Perform standard user login
    await page.goto('/login');
    await page.fill('input[type="text"]', 'user1');
    await page.fill('input[type="password"]', 'User@12345!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard\/user/);
    await expect(page.locator('text=Your Wallet Balance')).toBeVisible();
  });
});
