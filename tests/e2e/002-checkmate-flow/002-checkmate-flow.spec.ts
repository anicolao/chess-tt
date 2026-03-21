import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('MVP move updates board state and controls', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'MVP Move State',
    'Verify that a legal pawn move updates the turn indicator, last move state, and undo control.'
  );

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: /e2, White pawn/i }).click();
  await page.locator('[data-square="e4"]').click();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();

  await tester.step('pawn-moved', {
    description: 'A Legal Move Updates the Game State',
    verifications: [
      {
        spec: 'The white pawn appears on e4',
        check: async () => {
          await expect(page.getByRole('button', { name: /e4, White pawn/i })).toBeVisible();
        }
      },
      {
        spec: 'The bottom seat clock flips to waiting after the move',
        check: async () => {
          await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('Waiting');
        }
      },
      {
        spec: 'Undo becomes enabled inside the settings dialog',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toHaveAttribute('data-settings-corner', 'bottom-right');
          await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
        }
      }
    ]
  });

  tester.generateDocs();
});
