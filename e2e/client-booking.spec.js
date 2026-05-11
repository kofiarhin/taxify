const { expect, test } = require('@playwright/test');
const { loginAs, resetE2eData } = require('./helpers/testHelpers');

test.describe('client booking happy path', () => {
  test.beforeEach(async () => {
    await resetE2eData();
  });

  test('client books a ride and sees assignment or queue status', async ({ page }) => {
    await loginAs(page, 'client');

    await page.goto('/client/book');
    await page.getByLabel('Pickup address').fill('E2E Client Pickup Library');
    await page.getByLabel('Dropoff address').fill('E2E Client Dropoff Studio');
    await page.getByRole('button', { name: 'Request ride' }).click();

    await expect(page.getByText(/Booking created:/i)).toBeVisible();
    await expect(page.getByText(/Booking created: (DRIVER ASSIGNED|QUEUED|PENDING ASSIGNMENT)/i)).toBeVisible();
  });
});
