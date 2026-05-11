const { expect, test } = require('@playwright/test');
const { loginAs, resetE2eData } = require('./helpers/testHelpers');

test.describe('agent walk-in booking happy path', () => {
  test.beforeEach(async () => {
    await resetE2eData();
  });

  test('agent creates a walk-in booking and sees assignment or queue status', async ({ page }) => {
    await loginAs(page, 'agent');

    await page.goto('/agent');
    await page.getByLabel('Passenger name').fill('E2E Walk In Passenger');
    await page.getByLabel('Passenger phone').fill('+1 (312) 847-2991');
    await page.getByLabel('Pickup address').fill('E2E Agent Pickup Counter');
    await page.getByLabel('Dropoff address').fill('E2E Agent Dropoff Hotel');
    await page.getByRole('button', { name: 'Create booking' }).click();

    await expect(page.getByText(/Booking created:/i)).toBeVisible();
    await expect(page.getByText(/Booking created: (DRIVER ASSIGNED|QUEUED|PENDING ASSIGNMENT)/i)).toBeVisible();
  });
});
