import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('Tabletop time controls can be customized and run automatically', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Tabletop Time Controls',
    'Verify that seat-based presets and custom time controls can be configured from settings and that the live clocks switch automatically during play.'
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

  await page.getByRole('group', { name: 'Top seat' }).getByRole('spinbutton', { name: 'Minutes' }).fill('15');
  await page.getByRole('group', { name: 'Bottom seat' }).getByRole('spinbutton', { name: 'Minutes' }).fill('3');
  await page.getByRole('button', { name: 'Apply clock settings' }).click();

  await tester.step('custom-seat-times', {
    description: 'Custom seat times are applied independently',
    verifications: [
      {
        spec: 'The top seat clock shows the longer custom time',
        check: async () => {
          await expect(page.getByLabel('top seat clock')).toContainText('15:00');
        }
      },
      {
        spec: 'The bottom seat clock shows the shorter custom time',
        check: async () => {
          await expect(page.getByLabel('bottom seat clock')).toContainText('03:00');
        }
      },
      {
        spec: 'The settings dialog exposes the tabletop seat labels',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toContainText('Top seat');
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toContainText('Bottom seat');
        }
      }
    ]
  });

  await page.getByLabel('Time control preset').selectOption('rapid-5-3');
  await page.getByRole('button', { name: 'Apply clock settings' }).click();
  await page.evaluate(() => window['__setMockNow'](1000));

  await expect(page.getByLabel('bottom seat clock')).toContainText('05:00');
  await page.getByRole('group', { name: 'Top seat' }).getByRole('spinbutton', { name: 'Minutes' }).fill('14');
  await expect(page.getByRole('group', { name: 'Top seat' }).getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('14');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /e2, White pawn/i }).click();
  await page.locator('[data-square="e4"]').click();
  await page.evaluate(() => window['__setMockNow'](2000));
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();
  await page.getByRole('group', { name: 'Top seat' }).getByRole('spinbutton', { name: 'Minutes' }).fill('14');
  await tester.step('live-clock-switch', {
    description: 'The live clock handoff and settings editing stay stable after move one',
    verifications: [
      {
        spec: 'The moving bottom seat keeps its full time and waits after the opening move',
        check: async () => {
          await expect(page.getByLabel('bottom seat clock')).toContainText('05:00');
          await expect(page.getByLabel('bottom seat clock')).toContainText('Waiting');
        }
      },
      {
        spec: 'The top seat becomes active and begins counting down only after White completes move one',
        check: async () => {
          await expect(page.getByLabel('top seat clock')).toContainText('04:59');
          await expect(page.getByLabel('top seat clock')).toContainText('Your move');
        }
      },
      {
        spec: 'The in-progress top seat minute edit is preserved while the live clock is running',
        check: async () => {
          await expect(
            page.getByRole('group', { name: 'Top seat' }).getByRole('spinbutton', { name: 'Minutes' })
          ).toHaveValue('14');
        }
      }
    ]
  });

  tester.generateDocs();
});
