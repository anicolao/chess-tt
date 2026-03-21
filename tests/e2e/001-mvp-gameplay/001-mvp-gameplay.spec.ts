import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

const CENTERING_TOLERANCE_PX = 24;
const COORDINATE_ALIGNMENT_TOLERANCE_PX = 2;
const COORDINATE_EDGE_PADDING_MIN_PX = 4;
const LANDSCAPE_VIEWPORT = { width: 1024, height: 768 };
const PORTRAIT_VIEWPORT = { width: 768, height: 1024 };

test('MVP board selection highlights legal moves', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'MVP Board Selection',
    'Verify that selecting a pawn highlights the legal destinations on the tabletop board.'
  );

  await page.setViewportSize(LANDSCAPE_VIEWPORT);
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
        spec: 'Board-edge coordinate labels are rendered around all four sides of the board',
        check: async () => {
          await expect(page.locator('.coordinate')).toHaveCount(32);
          await expect(page.locator('.coordinate[data-edge="top"]').first()).toHaveText('a');
          await expect(page.locator('.coordinate[data-edge="right"]').first()).toHaveText('8');

          const alignment = await page.evaluate(() => {
            const topAElement = document.querySelector('[data-coordinate="top-a"]');
            const bottomHElement = document.querySelector('[data-coordinate="bottom-h"]');
            const left8Element = document.querySelector('[data-coordinate="left-8"]');
            const right1Element = document.querySelector('[data-coordinate="right-1"]');
            const a8Element = document.querySelector('[data-square="a8"]');
            const h1Element = document.querySelector('[data-square="h1"]');

            if (!topAElement || !bottomHElement || !left8Element || !right1Element || !a8Element || !h1Element) {
              return {
                error: 'Missing coordinate or square element for board-edge alignment check',
                present: {
                  topA: Boolean(topAElement),
                  bottomH: Boolean(bottomHElement),
                  left8: Boolean(left8Element),
                  right1: Boolean(right1Element),
                  a8: Boolean(a8Element),
                  h1: Boolean(h1Element)
                }
              };
            }

            const topA = topAElement.getBoundingClientRect();
            const bottomH = bottomHElement.getBoundingClientRect();
            const left8 = left8Element.getBoundingClientRect();
            const right1 = right1Element.getBoundingClientRect();
            const a8 = a8Element.getBoundingClientRect();
            const h1 = h1Element.getBoundingClientRect();

            const centerX = (rect: DOMRect) => rect.left + (rect.width / 2);
            const centerY = (rect: DOMRect) => rect.top + (rect.height / 2);

            return {
              topAOffset: Math.abs(centerX(topA) - centerX(a8)),
              bottomHOffset: Math.abs(centerX(bottomH) - centerX(h1)),
              left8Offset: Math.abs(centerY(left8) - centerY(a8)),
              right1Offset: Math.abs(centerY(right1) - centerY(h1)),
              left8Gap: a8.left - left8.right,
              right1Gap: right1.left - h1.right,
              topInsideBoard: topA.bottom <= a8.top,
              bottomInsideBoard: bottomH.top >= h1.bottom,
              leftInsideBoard: left8.right <= a8.left,
              rightInsideBoard: right1.left >= h1.right
            };
          });

          expect(alignment?.error, JSON.stringify(alignment)).toBeUndefined();
          expect(alignment?.topAOffset).toBeLessThan(COORDINATE_ALIGNMENT_TOLERANCE_PX);
          expect(alignment?.bottomHOffset).toBeLessThan(COORDINATE_ALIGNMENT_TOLERANCE_PX);
          expect(alignment?.left8Offset).toBeLessThan(COORDINATE_ALIGNMENT_TOLERANCE_PX);
          expect(alignment?.right1Offset).toBeLessThan(COORDINATE_ALIGNMENT_TOLERANCE_PX);
          expect(alignment?.left8Gap).toBeGreaterThanOrEqual(COORDINATE_EDGE_PADDING_MIN_PX);
          expect(alignment?.right1Gap).toBeGreaterThanOrEqual(COORDINATE_EDGE_PADDING_MIN_PX);
          expect(alignment?.topInsideBoard).toBe(true);
          expect(alignment?.bottomInsideBoard).toBe(true);
          expect(alignment?.leftInsideBoard).toBe(true);
          expect(alignment?.rightInsideBoard).toBe(true);
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
        spec: 'Pieces use the embedded Wikimedia SVG rendering',
        check: async () => {
          const whitePiece = page.locator('[data-square="e2"] [data-piece-style="wikimedia-svg"]');
          const blackPiece = page.locator('[data-square="d7"] [data-piece-style="wikimedia-svg"]');

          await expect(whitePiece).toBeVisible();
          await expect(blackPiece).toBeVisible();
          await expect(page.locator('[data-piece-style="flat-glyph"]')).toHaveCount(0);
          await expect(page.locator('[data-piece-style="engraved-glyph"]')).toHaveCount(0);
          await expect(whitePiece).toHaveAttribute('data-piece-src', /^data:image\/svg\+xml,/);
          await expect(blackPiece).toHaveAttribute('data-piece-src', /^data:image\/svg\+xml,/);
          await expect(page.locator('[data-piece-fallback]')).toHaveCount(0);
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
        spec: 'The clocks flank the centered board in landscape and stay near each player’s right hand',
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
              boardMidY: board.top + (board.height / 2),
              blackTop: blackClock.top,
              blackRight: blackClock.right,
              whiteBottom: whiteClock.bottom,
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
          expect(layout.blackTop).toBeLessThan(layout.boardMidY);
          expect(layout.whiteBottom).toBeGreaterThan(layout.boardMidY);
          expect(Math.abs(layout.boardCenter - layout.viewportCenter)).toBeLessThan(CENTERING_TOLERANCE_PX);
        }
      }
    ]
  });

  await page.setViewportSize(PORTRAIT_VIEWPORT);
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
        spec: 'The board stays centered and visible while the player clocks move to the long screen edges',
        check: async () => {
          const layout = await page.evaluate(() => {
            const board = document.querySelector('[aria-label="Chess board"]')?.getBoundingClientRect();
            const blackClock = document.querySelector('[aria-label="top seat clock"]')?.getBoundingClientRect();
            const whiteClock = document.querySelector('[aria-label="bottom seat clock"]')?.getBoundingClientRect();

            if (!board || !blackClock || !whiteClock) {
              return null;
            }

            return {
              boardTop: board.top,
              boardBottom: board.bottom,
              boardWidth: board.width,
              boardHeight: board.height,
              boardCenterY: board.top + (board.height / 2),
              blackClockTop: blackClock.top,
              blackClockBottom: blackClock.bottom,
              whiteClockTop: whiteClock.top,
              whiteClockBottom: whiteClock.bottom,
              viewportCenterY: window.innerHeight / 2
            };
          });

          if (!layout) {
            throw new Error('Expected portrait layout metrics for the board, player clocks, and settings anchors.');
          }

          expect(layout.boardWidth).toBeGreaterThan(200);
          expect(layout.boardHeight).toBeGreaterThan(200);
          expect(layout.blackClockBottom).toBeLessThan(layout.boardTop);
          expect(layout.whiteClockTop).toBeGreaterThan(layout.boardBottom);
          expect(Math.abs(layout.boardCenterY - layout.viewportCenterY)).toBeLessThan(CENTERING_TOLERANCE_PX);
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
