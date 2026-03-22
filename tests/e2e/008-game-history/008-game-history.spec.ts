import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { STORAGE_KEY } from '../../../src/lib/redux/persistence.js';

test('New Series resets completed history and collects default player names', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'New Series Reset',
    'Verify that the New Series dialog starts from the default player names and clears completed history when a new series begins.'
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
      ],
      timerSettings: {
        seatColors: {
          top: 'b',
          bottom: 'w'
        }
      },
      seriesPlayers: {
        top: 'Player 1',
        bottom: 'Player 2'
      },
      seriesHistory: [
        {
          gameNumber: 1,
          result: '0-1',
          status: 'checkmate',
          winner: 'black',
          whiteSeat: 'bottom',
          blackSeat: 'top',
          whiteName: 'Player 2',
          blackName: 'Player 1',
          events: [
            { type: 'game.started' },
            { type: 'move.played', from: 'f2', to: 'f3' },
            { type: 'move.played', from: 'e7', to: 'e5' },
            { type: 'move.played', from: 'g2', to: 'g4' },
            { type: 'move.played', from: 'd8', to: 'h4' }
          ],
          timerSettings: {
            seatColors: {
              top: 'b',
              bottom: 'w'
            }
          }
        }
      ],
      seriesStartingWhiteSeat: 'bottom',
      reviewGameNumber: 1
    }
  });

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();
  await page.getByRole('button', { name: 'New Series' }).click();

  await tester.step('new-series-dialog', {
    description: 'New Series opens with the default player names ready to edit',
    verifications: [
      {
        spec: 'The New Series dialog explains the random first-colour assignment and alternation',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'New series' })).toContainText('randomly assign White');
          await expect(page.getByRole('dialog', { name: 'New series' })).toContainText('alternate colours each game');
        }
      },
      {
        spec: 'The top and bottom player name fields start from Player 1 and Player 2',
        check: async () => {
          await expect(page.getByLabel('Top player name')).toHaveValue('Player 1');
          await expect(page.getByLabel('Bottom player name')).toHaveValue('Player 2');
        }
      }
    ]
  });

  await page.getByLabel('Top player name').fill('Carol');
  await page.getByLabel('Bottom player name').fill('Dana');
  await page.getByRole('button', { name: 'Start series' }).click();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();

  await tester.step('history-reset', {
    description: 'Starting a new series clears the previous results and returns export to its fresh state',
    verifications: [
      {
        spec: 'The completed series history is cleared for the new matchup',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toContainText('No completed games yet.');
        }
      },
      {
        spec: 'Export is disabled again until the new series has recorded moves',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Export to Chess.com' })).toBeDisabled();
          await expect(page.getByRole('button', { name: 'Export to Lichess' })).toBeDisabled();
        }
      }
    ]
  });

  tester.generateDocs();
});
