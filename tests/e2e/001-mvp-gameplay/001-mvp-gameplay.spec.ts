import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('MVP board selection highlights legal moves', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'MVP Board Selection',
    'Verify that selecting a pawn highlights the legal destinations on the tabletop board.'
  );

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: /e2, White pawn/i }).click();

  await tester.step('pawn-selected', {
    description: 'Selecting a Pawn Highlights Legal Moves',
    verifications: [
      {
        spec: 'Four corner settings buttons frame the minimal board',
        check: async () => {
          await expect(page.getByRole('button', { name: /Open top left settings/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /Open top right settings/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /Open bottom left settings/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /Open bottom right settings/i })).toBeVisible();
        }
      },
      {
        spec: 'Square coordinate labels are not rendered on the board',
        check: async () => {
          await expect(page.locator('.coordinate')).toHaveCount(0);
        }
      },
      {
        spec: 'The selected square is marked as selected',
        check: async () => {
          await expect(page.locator('[data-square="e2"]')).toHaveClass(/selected/);
        }
      },
      {
        spec: 'The e3 and e4 targets are highlighted',
        check: async () => {
          await expect(page.locator('[data-square="e3"]')).toHaveClass(/highlighted/);
          await expect(page.locator('[data-square="e4"]')).toHaveClass(/highlighted/);
        }
      },
      {
        spec: 'Black pieces are oriented toward the top player',
        check: async () => {
          await expect(page.locator('[data-square="d8"] [data-facing="top-player"]')).toBeVisible();
        }
      },
      {
        spec: 'The top clock remains visible above the board',
        check: async () => {
          await expect(page.getByLabel('black clock')).toContainText('Waiting');
        }
      }
    ]
  });

  tester.generateDocs();
});
