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
        spec: 'The heading remains visible after selection',
        check: async () => {
          await expect(page.getByRole('heading', { name: /local play, touch-ready/i })).toBeVisible();
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
      }
    ]
  });

  tester.generateDocs();
});
