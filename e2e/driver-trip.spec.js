const { expect, test } = require('@playwright/test');
const { postAsRole } = require('./helpers/apiHelpers');
const { loginAs, resetE2eData } = require('./helpers/testHelpers');

test.describe('driver trip and cash confirmation happy path', () => {
  test.beforeEach(async () => {
    await resetE2eData();
  });

  test('driver accepts, starts, ends, and confirms cash after client confirmation', async ({ page, request }) => {
    const state = await resetE2eData();

    await loginAs(page, 'driver');
    await page.goto('/driver');

    await expect(page.getByText(/E2E Driver Pickup Depot to E2E Driver Dropoff Terminal/i)).toBeVisible();
    await expect(page.getByText(/DRIVER ASSIGNED/i)).toBeVisible();

    await page.getByRole('button', { name: 'Accept' }).click();
    await expect(page.getByText(/DRIVER ACCEPTED/i)).toBeVisible();

    await page.getByRole('button', { name: 'Start trip' }).click();
    await expect(page.getByText(/TRIP IN PROGRESS/i)).toBeVisible();

    await page.getByPlaceholder('Distance km').fill('7');
    await page.getByPlaceholder('Duration minutes').fill('12');
    await page.getByRole('button', { name: 'End trip' }).click();
    await expect(page.getByText(/AWAITING CLIENT CONFIRMATION/i)).toBeVisible();
    await expect(page.getByText('$43')).toBeVisible();

    await postAsRole(request, 'client', `/trips/${state.bookingIds.driver}/client-confirm`);
    await page.reload();

    await expect(page.getByText(/AWAITING DRIVER PAYMENT CONFIRMATION/i)).toBeVisible();
    await page.getByRole('button', { name: 'Confirm cash received' }).click();
    await expect(page.getByText(/No active booking assigned/i)).toBeVisible();
  });
});
