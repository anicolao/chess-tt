import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { STORAGE_KEY } from '../../../src/lib/redux/persistence.js';

test('Persisted checkmate state is restored on load', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Persisted Checkmate State',
    'Verify that the event log in local storage restores a completed checkmate position after reload and exposes its controls through the settings panel.'
  );

  await page.addInitScript((payload) => {
    window.localStorage.setItem(payload.key, JSON.stringify(payload.value));
  }, {
    key: STORAGE_KEY,
    value: {
      storageVersion: 1,
      events: [
        { type: 'game.started' },
        { type: 'move.played', from: 'f2', to: 'f3' },
        { type: 'move.played', from: 'e7', to: 'e5' },
        { type: 'move.played', from: 'g2', to: 'g4' },
        { type: 'move.played', from: 'd8', to: 'h4' }
      ]
    }
  });

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: /Open top seat settings/i }).click();

  await tester.step('restored-checkmate', {
    description: 'A Persisted Checkmate Position and Settings View Restore Correctly',
    verifications: [
      {
        spec: 'The restored game shows the checkmate message',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toContainText('Black wins by checkmate');
        }
      },
      {
        spec: 'The black queen occupies h4 in the restored position',
        check: async () => {
          await expect(page.getByRole('button', { name: /h4, Black queen/i })).toBeVisible();
        }
      },
      {
        spec: 'Resign is disabled because the game is complete',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Resign' })).toBeDisabled();
        }
      },
      {
        spec: 'The settings panel faces the top edge when opened from the top-left corner',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toHaveAttribute('data-settings-corner', 'top-left');
        }
      }
    ]
  });

  tester.generateDocs();
});
