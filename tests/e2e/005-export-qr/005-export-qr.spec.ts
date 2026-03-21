import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('QR export links can be generated for Chess.com and Lichess', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'QR Export Links',
    'Verify that tabletop games can be exported as QR codes for Chess.com and Lichess from the settings dialog.'
  );

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();

  await tester.step('export-disabled-before-moves', {
    description: 'Export stays disabled until the game has a move history',
    verifications: [
      {
        spec: 'Chess.com export is disabled before any moves are played',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Export to Chess.com' })).toBeDisabled();
        }
      },
      {
        spec: 'Lichess export is disabled before any moves are played',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Export to Lichess' })).toBeDisabled();
        }
      }
    ]
  });

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /e2, White pawn/i }).click();
  await page.locator('[data-square="e4"]').click();
  await page.getByRole('button', { name: /e7, Black pawn/i }).click();
  await page.locator('[data-square="e5"]').click();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();
  await page.getByRole('button', { name: 'Export to Chess.com' }).click();

  await tester.step('chess-com-qr-export', {
    description: 'Chess.com export shows a QR code and matching link',
    verifications: [
      {
        spec: 'The Chess.com export dialog renders a scannable QR code',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Export to Chess.com' })).toBeVisible();
          await expect(page.locator('[data-export-platform="chess-com"] [data-qr-ready="true"]')).toBeVisible();
        }
      },
      {
        spec: 'The Chess.com export link encodes the current game PGN',
        check: async () => {
          await expect(page.getByRole('link', { name: 'Open on Chess.com' })).toHaveAttribute(
            'href',
            'https://www.chess.com/analysis?pgn=1.%20e4%20e5%20*'
          );
        }
      }
    ]
  });

  await page.getByRole('button', { name: 'Close export' }).click();
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();
  await page.getByRole('button', { name: 'Export to Lichess' }).click();

  await tester.step('lichess-qr-export', {
    description: 'Lichess export shows a QR code and matching link',
    verifications: [
      {
        spec: 'The Lichess export dialog renders a scannable QR code',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Export to Lichess' })).toBeVisible();
          await expect(page.locator('[data-export-platform="lichess"] [data-qr-ready="true"]')).toBeVisible();
        }
      },
      {
        spec: 'The Lichess export link encodes the current game PGN',
        check: async () => {
          await expect(page.getByRole('link', { name: 'Open on Lichess' })).toHaveAttribute(
            'href',
            'https://lichess.org/paste?pgn=1.%20e4%20e5%20*'
          );
        }
      }
    ]
  });

  tester.generateDocs();
});
