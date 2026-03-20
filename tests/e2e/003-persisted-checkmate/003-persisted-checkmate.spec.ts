import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { STORAGE_KEY } from '../../../src/lib/redux/persistence.js';

test('Persisted checkmate state is restored on load', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Persisted Checkmate State',
    'Verify that the event log in local storage restores a completed checkmate position after reload.'
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

  await tester.step('restored-checkmate', {
    description: 'A Persisted Checkmate Position Restores Correctly',
    verifications: [
      {
        spec: 'The restored game shows the checkmate message',
        check: async () => {
          await expect(page.getByLabel('white player information')).toContainText('Black wins by checkmate');
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
      }
    ]
  });

  tester.generateDocs();
});
