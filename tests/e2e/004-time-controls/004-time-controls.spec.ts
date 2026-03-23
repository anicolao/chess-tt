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

  await page.getByRole('button', { name: 'Green board colours' }).click();

  await tester.step('board-theme-presets', {
    description: 'Board theme presets and custom colours can be selected from settings',
    verifications: [
      {
        spec: 'The board colour presets sit below the dialog heading and stay visually separated from the time controls',
        check: async () => {
          await expect(page.getByRole('button', { name: 'Current board colours' })).toBeVisible();
          await expect(page.getByRole('button', { name: 'Green board colours' })).toBeVisible();
          await expect(page.getByRole('button', { name: 'Brown board colours' })).toBeVisible();
          await expect(page.getByRole('button', { name: 'Custom board colours' })).toBeVisible();
          const layout = await page.evaluate(() => {
            const header = document.querySelector('.settings-dialog .header');
            const boardTheme = document.querySelector('.settings-dialog [aria-label="Board colours"]');
            const timeControls = document.querySelector('.settings-dialog [aria-label="Time controls"]');

            if (!(header instanceof HTMLElement) || !(boardTheme instanceof HTMLElement) || !(timeControls instanceof HTMLElement)) {
              return null;
            }

            const headerBox = header.getBoundingClientRect();
            const boardThemeBox = boardTheme.getBoundingClientRect();
            const timeControlsBox = timeControls.getBoundingClientRect();

            return {
              headerBeforeBoardTheme: Boolean(header.compareDocumentPosition(boardTheme) & window.Node.DOCUMENT_POSITION_FOLLOWING),
              boardThemeBeforeTimeControls: Boolean(
                boardTheme.compareDocumentPosition(timeControls) & window.Node.DOCUMENT_POSITION_FOLLOWING
              ),
              boardThemeBelowHeader: boardThemeBox.top >= headerBox.bottom,
              boardThemeSeparatedFromTimeControls: (
                boardThemeBox.bottom <= timeControlsBox.top ||
                boardThemeBox.right <= timeControlsBox.left
              )
            };
          });

          expect(layout).toEqual({
            headerBeforeBoardTheme: true,
            boardThemeBeforeTimeControls: true,
            boardThemeBelowHeader: true,
            boardThemeSeparatedFromTimeControls: true
          });
        }
      },
      {
        spec: 'The board colour preset tiles keep compact square previews instead of stretching tall',
        check: async () => {
          await expect.poll(async () => page.evaluate(() => {
            return [...document.querySelectorAll('.board-theme-button')].map((button) => {
              const preview = button.querySelector('.board-theme-preview');
              const buttonBox = button.getBoundingClientRect();
              const previewBox = preview?.getBoundingClientRect();

              return {
                buttonAspectRatio: Number((buttonBox.width / buttonBox.height).toFixed(2)),
                previewIsSquare: previewBox ? Math.abs(previewBox.width - previewBox.height) <= 1 : false
              };
            });
          })).toEqual([
            { buttonAspectRatio: 1.24, previewIsSquare: true },
            { buttonAspectRatio: 1.24, previewIsSquare: true },
            { buttonAspectRatio: 1.24, previewIsSquare: true },
            { buttonAspectRatio: 1.24, previewIsSquare: true }
          ]);
        }
      },
      {
        spec: 'Selecting the green preset updates the live board square colours immediately',
        check: async () => {
          await expect(page.locator('.board-shell')).toHaveAttribute('style', /#f2ecd8/i);
          await expect(page.locator('.board-shell')).toHaveAttribute('style', /#557a46/i);
          await expect.poll(async () => page.evaluate(() => {
            const lightSquare = getComputedStyle(document.querySelector('[data-square="a8"]') as Element).backgroundColor;
            const darkSquare = getComputedStyle(document.querySelector('[data-square="b8"]') as Element).backgroundColor;

            return { lightSquare, darkSquare };
          })).toEqual({
            lightSquare: 'rgb(242, 236, 216)',
            darkSquare: 'rgb(85, 122, 70)'
          });
        }
      }
    ]
  });

  await page.getByRole('button', { name: 'Custom board colours' }).click();
  await expect(page.getByRole('dialog', { name: 'Custom board colours' })).toBeVisible();
  await page.getByLabel('Light squares').fill('#334455');
  await page.getByLabel('Dark squares').fill('#112233');
  await page.getByRole('button', { name: 'Apply board colours' }).click();

  await page.getByRole('group', { name: "Opponent's Clock" }).getByRole('spinbutton', { name: 'Minutes' }).fill('15');
  await page.getByRole('group', { name: 'Your Clock' }).getByRole('spinbutton', { name: 'Minutes' }).fill('3');
  await page.getByRole('button', { name: 'Apply clock settings' }).click();

  await tester.step('custom-seat-times', {
    description: 'Custom seat times are applied independently',
    verifications: [
      {
        spec: 'The top seat clock shows the longer custom time',
        check: async () => {
          await expect(page.getByRole('region', { name: 'top seat clock' })).toContainText('15:00');
        }
      },
      {
        spec: 'The bottom seat clock shows the shorter custom time',
        check: async () => {
          await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('03:00');
        }
      },
      {
        spec: 'The settings dialog exposes player-relative clock labels',
        check: async () => {
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toContainText("Opponent's Clock");
          await expect(page.getByRole('dialog', { name: 'Game settings' })).toContainText('Your Clock');
        }
      },
      {
        spec: 'Applying custom board colours keeps the board on the chosen custom palette',
        check: async () => {
          await expect(page.locator('.board-shell')).toHaveAttribute('style', /#334455/i);
          await expect(page.locator('.board-shell')).toHaveAttribute('style', /#112233/i);
          await expect.poll(async () => page.evaluate(() => {
            const lightSquare = getComputedStyle(document.querySelector('[data-square="a8"]') as Element).backgroundColor;
            const darkSquare = getComputedStyle(document.querySelector('[data-square="b8"]') as Element).backgroundColor;

            return { lightSquare, darkSquare };
          })).toEqual({
            lightSquare: 'rgb(51, 68, 85)',
            darkSquare: 'rgb(17, 34, 51)'
          });
        }
      }
    ]
  });

  await page.getByLabel('Time control preset').selectOption('blitz-5-3');
  await page.getByRole('button', { name: 'Apply clock settings' }).click();
  await page.evaluate(() => window['__setMockNow'](1000));

  await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('05:00');
  await page.getByRole('group', { name: "Opponent's Clock" }).getByRole('spinbutton', { name: 'Minutes' }).fill('14');
  await expect(page.getByRole('group', { name: "Opponent's Clock" }).getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('14');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /e2, White pawn/i }).click();
  await page.locator('[data-square="e4"]').click();
  await page.evaluate(() => window['__setMockNow'](2000));
  await page.getByRole('button', { name: /Open bottom seat settings/i }).click();
  await page.getByRole('group', { name: "Opponent's Clock" }).getByRole('spinbutton', { name: 'Minutes' }).fill('14');
  await tester.step('live-clock-switch', {
    description: 'The live clock handoff and settings editing stay stable after move one',
    verifications: [
      {
        spec: 'The moving bottom seat keeps its full time and waits after the opening move',
        check: async () => {
          await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('05:00');
          await expect(page.getByRole('region', { name: 'bottom seat clock' })).toContainText('Waiting');
        }
      },
      {
        spec: 'The top seat becomes active and begins counting down only after White completes move one',
        check: async () => {
          await expect(page.getByRole('region', { name: 'top seat clock' })).toContainText('04:59');
          await expect(page.getByRole('region', { name: 'top seat clock' })).toContainText('Your move');
        }
      },
      {
        spec: 'The in-progress top seat minute edit is preserved while the live clock is running',
        check: async () => {
          await expect(
            page.getByRole('group', { name: "Opponent's Clock" }).getByRole('spinbutton', { name: 'Minutes' })
          ).toHaveValue('14');
        }
      },
      {
        spec: 'The selected custom board colours persist after a move is played',
        check: async () => {
          await expect(page.locator('.board-shell')).toHaveAttribute('style', /#334455/i);
          await expect(page.locator('.board-shell')).toHaveAttribute('style', /#112233/i);
          await expect.poll(async () => page.evaluate(() => {
            const lightSquare = getComputedStyle(document.querySelector('[data-square="a8"]') as Element).backgroundColor;
            const darkSquare = getComputedStyle(document.querySelector('[data-square="b8"]') as Element).backgroundColor;

            return { lightSquare, darkSquare };
          })).toEqual({
            lightSquare: 'rgb(51, 68, 85)',
            darkSquare: 'rgb(17, 34, 51)'
          });
        }
      }
    ]
  });

  tester.generateDocs();
});
