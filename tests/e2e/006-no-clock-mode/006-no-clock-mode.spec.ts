import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('No-clock mode keeps the tabletop timers frozen', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'No Clock Mode',
    'Verify that selecting the No Clock preset leaves both tabletop timers frozen on the main screen during play.'
  );

  await page.addInitScript(() => {
    window['__mockNow'] = 0;
    window['__setMockNow'] = (value) => {
      window['__mockNow'] = value;
    };

    Date.now = () => window['__mockNow'];
  });

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();
  await page.getByLabel('Time control preset').selectOption('no-clock');
  await page.getByRole('button', { name: 'Apply clock settings' }).click();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.getByRole('button', { name: /e2, White pawn/i }).click();
  await page.locator('[data-square="e4"]').click();
  await page.evaluate(() => window['__setMockNow'](240000));

  await tester.step('no-clock-frozen', {
    description: 'No-clock mode keeps both tabletop timers frozen after play starts',
    verifications: [
      {
        spec: 'The top seat clock shows the no-clock placeholder and label',
        check: async () => {
          await expect(page.getByRole('region', { name: 'top seat clock' })).toContainText('-:-');
          await expect(page.getByRole('region', { name: 'top seat clock' })).toContainText('No Clock');
        }
      },
      {
        spec: 'The bottom seat clock shows the no-clock placeholder and label',
        check: async () => {
          await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('-:-');
          await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('No Clock');
        }
      }
    ]
  });

  tester.generateDocs();
});
