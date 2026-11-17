import { test, expect } from '@playwright/test';

async function openReview(page) {
  await page.goto('/');
  await page.getByRole('button', { name: '02Work Queue' }).click();
  await page.getByRole('button', { name: 'Pick up SYN-001', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pick up SYN-001', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Review SYN-001', exact: true }).click();
}

for (const width of [1280, 390]) {
  test(`review, disclosures, keyboard and reset at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await openReview(page);
    await expect(page.getByRole('note')).toHaveText('Demonstration - synthetic data and simulated services');
    await expect(page.getByTestId('field-name')).toHaveClass(/low-confidence/);
    await expect(page.getByTestId('field-reference')).not.toHaveClass(/low-confidence/);
    await expect(page.getByTestId('field-amount')).not.toHaveClass(/low-confidence/);
    await page.getByRole('button', { name: 'Confirm review', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Applicant: enter a value.');
    await expect(page.getByRole('alert')).toContainText('Document type:');
    await page.getByLabel('Applicant 0.84', { exact: true }).focus();
    const source = page.getByRole('button', { name: 'Use source Sample Trading Company', exact: true });
    await source.focus();
    await expect(source).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Applicant 0.84', { exact: true })).toHaveValue('Sample Trading Company');
    await page.getByLabel('Validate Applicant', { exact: true }).check();
    await page.getByLabel('Applicant 0.84', { exact: true }).fill('Edited synthetic applicant');
    await expect(page.getByLabel('Validate Applicant', { exact: true })).not.toBeChecked();
    await page.getByLabel('Validate Applicant', { exact: true }).check();
    await page.getByLabel('Document type', { exact: true }).selectOption('Invoice');
    await page.getByRole('button', { name: 'Confirm review', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Review confirmed locally for SYN-001');
    await expect(page.getByRole('button', { name: 'Confirm review', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'View activity' }).click();
    await expect(page.getByText('Review confirmed locally', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Picked up locally', { exact: true })).toHaveCount(1);
    await expect(page.locator('time')).toHaveCount(2);
    await expect(page.getByRole('note')).toBeVisible();
    const overview = page.getByRole('button', { name: '01Overview', exact: true });
    await overview.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('count-Reviewed')).toHaveText('2');
    await page.getByRole('button', { name: 'Reset demonstration', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm reset', exact: true }).click();
    await expect(page.getByTestId('count-Reviewed')).toHaveText('1');
    await page.getByRole('button', { name: '04Activity', exact: true }).click();
    await expect(page.getByText('No local events for this case.')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(runtimeErrors).toEqual([]);
  });
}

test('queue filters, metrics, simulated refresh and keyboard navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('count-Queued')).toHaveText('2');
  await expect(page.getByTestId('count-In Review')).toHaveText('0');
  await page.getByRole('button', { name: 'Simulated refresh', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('no external service');
  const queue = page.getByRole('button', { name: '02Work Queue', exact: true });
  await queue.focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Team', { exact: true }).selectOption('Finance');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('SYN-002');
  await page.getByLabel('Role filter').selectOption('Validator');
  await expect(page.getByText('No cases match these filters.')).toBeVisible();
  await page.getByLabel('Team', { exact: true }).selectOption('Operations');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('High');
  await page.getByRole('button', { name: 'Review SYN-001', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm review', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Pick up a queued case');
});
