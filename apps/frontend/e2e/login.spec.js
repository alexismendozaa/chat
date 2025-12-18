import { test, expect } from '@playwright/test';

// Helper to intercept auth endpoints
async function stubAuth(page) {
  await page.route('**/api/auth/login', async (route) => {
    const json = { token: 'e2e-token' };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
  });
  await page.route('**/api/auth/register', async (route) => {
    const json = { ok: true };
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(json) });
  });
}

test('login flow shows chat view', async ({ page, baseURL }) => {
  await stubAuth(page);

  await page.goto(baseURL + '/');

  await expect(page.getByRole('heading', { level: 1, name: 'Chat UCE' })).toBeVisible();

  await page.getByPlaceholder('Enter your username').fill('demo');
  await page.getByPlaceholder('Enter your password').fill('password123');

  // Click submit button with text Login (avoid the tab button)
  await page.locator('form button[type="submit"]:has-text("Login")').click();

  // After login, App switches to Chat
  await expect(page.getByRole('heading', { level: 2 })).toContainText('#general');
  await expect(page.getByText('Desconectado')).toBeVisible();

  // token persisted
  const token = await page.evaluate(() => localStorage.getItem('token'));
  await expect(token).toBe('e2e-token');
});
