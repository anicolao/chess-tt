import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

const CENTERING_TOLERANCE_PX = 24;

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
        spec: 'Two player-relative settings buttons frame the board from each seated perspective',
        check: async () => {
          await expect(page.getByRole('button', { name: /Open top seat settings/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /Open bottom seat settings/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /Open .* settings/i })).toHaveCount(2);
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
        spec: 'Pieces use the flat direct-on-board rendering style',
        check: async () => {
          await expect(page.locator('[data-square="e2"] [data-piece-style="flat-glyph"]')).toBeVisible();
          await expect(page.locator('[data-square="d7"] [data-piece-style="flat-glyph"]')).toBeVisible();
          await expect(page.locator('[data-piece-style="engraved-glyph"]')).toHaveCount(0);
        }
      },
      {
        spec: 'The landscape layout fits the viewport without page scrolling',
        check: async () => {
          const fitsViewport = await page.evaluate(() => (
            document.documentElement.scrollHeight <= document.documentElement.clientHeight &&
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
          ));

          expect(fitsViewport).toBe(true);
        }
      },
      {
        spec: 'The clocks flank the centered board in landscape',
        check: async () => {
          const layout = await page.evaluate(() => {
            const board = document.querySelector('[aria-label="Chess board"]')?.getBoundingClientRect();
            const blackClock = document.querySelector('[aria-label="top seat clock"]')?.getBoundingClientRect();
            const whiteClock = document.querySelector('[aria-label="bottom seat clock"]')?.getBoundingClientRect();

            if (!board || !blackClock || !whiteClock) {
              return null;
            }

            return {
              blackLeft: blackClock.left,
              boardLeft: board.left,
              boardRight: board.right,
              boardCenter: board.left + (board.width / 2),
              blackRight: blackClock.right,
              whiteRight: whiteClock.right,
              whiteLeft: whiteClock.left,
              viewportCenter: window.innerWidth / 2,
              viewportWidth: window.innerWidth
            };
          });

          if (!layout) {
            throw new Error('Expected landscape layout metrics for both clocks and the board.');
          }

          expect(layout.blackLeft).toBeGreaterThanOrEqual(0);
          expect(layout.blackRight).toBeLessThan(layout.boardLeft);
          expect(layout.whiteLeft).toBeGreaterThan(layout.boardRight);
          expect(layout.whiteRight).toBeLessThanOrEqual(layout.viewportWidth);
          expect(Math.abs(layout.boardCenter - layout.viewportCenter)).toBeLessThan(CENTERING_TOLERANCE_PX);
        }
      }
    ]
  });

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();

  await tester.step('portrait-rotated-tabletop', {
    description: 'Portrait view rotates into a landscape tabletop arrangement',
    verifications: [
      {
        spec: 'The rotated portrait layout still fits the viewport without scrolling',
        check: async () => {
          const fitsViewport = await page.evaluate(() => (
            document.documentElement.scrollHeight <= document.documentElement.clientHeight &&
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
          ));

          expect(fitsViewport).toBe(true);
        }
      },
      {
        spec: 'The board stays centered while the player clocks move above and below it on-screen',
        check: async () => {
          const layout = await page.evaluate(() => {
            const board = document.querySelector('[aria-label="Chess board"]')?.getBoundingClientRect();
            const blackClock = document.querySelector('[aria-label="top seat clock"]')?.getBoundingClientRect();
            const whiteClock = document.querySelector('[aria-label="bottom seat clock"]')?.getBoundingClientRect();
            const topSettings = document.querySelector('[aria-label="Open top seat settings"]')?.getBoundingClientRect();
            const bottomSettings = document.querySelector('[aria-label="Open bottom seat settings"]')?.getBoundingClientRect();

            if (!board || !blackClock || !whiteClock || !topSettings || !bottomSettings) {
              return null;
            }

            return {
              boardTop: board.top,
              boardBottom: board.bottom,
              boardCenterX: board.left + (board.width / 2),
              blackClockBottom: blackClock.bottom,
              whiteClockTop: whiteClock.top,
              topSettingsBottom: topSettings.bottom,
              bottomSettingsTop: bottomSettings.top,
              viewportCenterX: window.innerWidth / 2
            };
          });

          if (!layout) {
            throw new Error('Expected portrait layout metrics for the board, player clocks, and settings anchors.');
          }

          expect(layout.blackClockBottom).toBeLessThan(layout.boardTop);
          expect(layout.whiteClockTop).toBeGreaterThan(layout.boardBottom);
          expect(layout.topSettingsBottom).toBeLessThan(layout.boardTop);
          expect(layout.bottomSettingsTop).toBeGreaterThan(layout.boardBottom);
          expect(Math.abs(layout.boardCenterX - layout.viewportCenterX)).toBeLessThan(CENTERING_TOLERANCE_PX);
        }
      },
      {
        spec: 'Both player settings buttons stay visible after the portrait rotation',
        check: async () => {
          await expect(page.getByRole('button', { name: /Open top seat settings/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /Open bottom seat settings/i })).toBeVisible();
        }
      }
    ]
  });

  tester.generateDocs();
});
