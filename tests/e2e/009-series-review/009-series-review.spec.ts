import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { STORAGE_KEY } from '../../../src/lib/redux/persistence.js';

test('Completed series games stay reviewable and exportable from settings', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Series Review and Export',
    'Verify that completed series games remain listed in settings, that colors alternate for the next game, and that prior games can be reopened for export.'
  );

  await page.addInitScript((payload) => {
    window.localStorage.setItem(payload.key, JSON.stringify(payload.value));
  }, {
    key: STORAGE_KEY,
    value: {
      storageVersion: 1,
      events: [
        { type: 'game.started' }
      ],
      timerSettings: {
        seatColors: {
          top: 'w',
          bottom: 'b'
        }
      },
      seriesPlayers: {
        top: 'Alice',
        bottom: 'Bob'
      },
      seriesHistory: [
        {
          gameNumber: 1,
          result: '0-1',
          status: 'checkmate',
          winner: 'black',
          whiteSeat: 'bottom',
          blackSeat: 'top',
          whiteName: 'Bob',
          blackName: 'Alice',
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
      reviewGameNumber: null
    }
  });

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();

  await tester.step('series-history-table', {
    description: 'Settings lists completed games while the next game flips White to the opposite seat',
    verifications: [
      {
        spec: 'The second game gives White to the top seat and Black to the bottom seat',
        check: async () => {
          await expect(page.getByRole('region', { name: 'top seat clock' })).toContainText('white pieces');
          await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('black pieces');
        }
      },
      {
        spec: 'The prior games table records Bob versus Alice with the 0-1 result token',
        check: async () => {
          await expect(page.locator('.history-table')).toContainText('Bob');
          await expect(page.locator('.history-table')).toContainText('Alice');
          await expect(page.locator('.history-table')).toContainText('0-1');
        }
      }
    ]
  });

  await page.getByRole('button', { name: 'Game 1' }).click();
  await expect(page.getByRole('dialog', { name: 'Game settings' })).toContainText('Reviewing game 1');
  await page.getByRole('button', { name: 'Export to Chess.com' }).click();

  await tester.step('reviewed-export', {
    description: 'A completed game can be reopened for board review and exported again',
    verifications: [
      {
        spec: 'Selecting game 1 restores the archived checkmate position with the queen on h4',
        check: async () => {
          await expect(page.getByRole('button', { name: /h4, Black queen/i })).toBeVisible();
        }
      },
      {
        spec: 'Exporting the reviewed game uses the archived PGN with its 0-1 result',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Export to Chess.com' })).toBeVisible();
          await expect(page.getByRole('link', { name: 'Open on Chess.com' })).toHaveAttribute(
            'href',
            'https://www.chess.com/analysis?pgn=1.%20f3%20e5%202.%20g4%20Qh4%23%200-1'
          );
        }
      }
    ]
  });

  tester.generateDocs();
});
