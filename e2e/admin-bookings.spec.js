const { expect, test } = require('@playwright/test');
const { loginAs, resetE2eData } = require('./helpers/testHelpers');

test.describe('admin booking controls happy path', () => {
  test.beforeEach(async () => {
    await resetE2eData();
  });

  test('admin reassigns a pre-trip booking and completes an eligible booking', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/bookings');

    await expect(page.getByText(/E2E Admin Reassign Pickup to E2E Admin Reassign Dropoff/i)).toBeVisible();
    await expect(page.getByText(/E2E Admin Complete Pickup to E2E Admin Complete Dropoff/i)).toBeVisible();

    const reassignRow = page.getByRole('region', {
      name: /Booking E2E Admin Reassign Pickup to E2E Admin Reassign Dropoff/i
    });

    await expect(reassignRow.getByText(/E2E Driver Priya/i)).toBeVisible();
    await reassignRow.getByRole('button', { name: 'Reassign' }).click();
    await expect(page.getByText(/E2E Driver Mateo/i)).toBeVisible();

    const completeRow = page.getByRole('region', {
      name: /Booking E2E Admin Complete Pickup to E2E Admin Complete Dropoff/i
    });

    await expect(completeRow.getByText(/AWAITING DRIVER PAYMENT CONFIRMATION/i)).toBeVisible();
    await expect(completeRow.getByText('$48.00')).toBeVisible();
    await completeRow.getByRole('button', { name: 'Complete' }).click();
    await expect(page.getByText(/COMPLETED/i)).toBeVisible();
  });
});
