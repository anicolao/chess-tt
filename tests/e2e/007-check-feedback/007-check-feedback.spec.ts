import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('Checking move plays the check tone and highlights the checked king', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Check Move Feedback',
    'Verify that routine moves play a subtle click, checking moves play a deeper bong, and the checked king glows red.'
  );

  await page.addInitScript(() => {
    class FakeAudioParam {
      events: Array<{ type: string; value: number; time: number }> = [];

      setValueAtTime(value: number, time: number) {
        this.events.push({ type: 'set', value, time });
      }

      exponentialRampToValueAtTime(value: number, time: number) {
        this.events.push({ type: 'ramp', value, time });
      }
    }

    class FakeGainNode {
      gain = new FakeAudioParam();

      connect() {}
    }

    class FakeOscillatorNode {
      type = 'sine';
      frequency = new FakeAudioParam();

      connect() {}

      start(time: number) {
        (window as typeof window & {
          __audioEvents: Array<{ type: string; frequencyEvents: Array<{ type: string; value: number; time: number }> }>;
        }).__audioEvents.push({
          type: this.type,
          frequencyEvents: [...this.frequency.events]
        });
      }

      stop() {}
    }

    class FakeAudioContext {
      currentTime = 0;
      destination = {};
      state: 'running' | 'suspended' = 'running';

      createGain() {
        return new FakeGainNode();
      }

      createOscillator() {
        return new FakeOscillatorNode();
      }

      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
    }

    (window as typeof window & { __audioEvents: Array<unknown> }).__audioEvents = [];
    (window as typeof window & { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext;
    (window as typeof window & { webkitAudioContext: typeof FakeAudioContext }).webkitAudioContext = FakeAudioContext;
  });

  await page.goto('/');
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible();

  await page.getByRole('button', { name: /e2, White pawn/i }).click();
  await page.locator('[data-square="e4"]').click();

  await expect(
    page.evaluate(() => (window as typeof window & {
      __audioEvents: Array<{ type: string; frequencyEvents: Array<{ value: number }> }>;
    }).__audioEvents.map((event) => ({
      type: event.type,
      frequency: event.frequencyEvents[0]?.value ?? null
    })))
  ).resolves.toEqual([{ type: 'triangle', frequency: 880 }]);

  await page.getByRole('button', { name: /f7, Black pawn/i }).click();
  await page.locator('[data-square="f6"]').click();
  await page.getByRole('button', { name: /d1, White queen/i }).click();
  await page.locator('[data-square="h5"]').click();

  await tester.step('checked-king-highlighted', {
    description: 'A Checking Move Uses the Check Tone and Highlights the King',
    verifications: [
      {
        spec: 'The black king square is flagged as the checked king',
        check: async () => {
          await expect(page.locator('[data-square="e8"][data-checked-king="true"]')).toBeVisible();
        }
      },
      {
        spec: 'The checking move updates the status copy to indicate check',
        check: async () => {
          await page.getByRole('button', { name: /Open top seat settings/i }).click();
          await expect(page.getByText('Black to move · Check')).toBeVisible();
        }
      },
      {
        spec: 'Normal moves use the click tone while the checking move uses the deeper bong tone',
        check: async () => {
          await expect(
            page.evaluate(() => (window as typeof window & {
              __audioEvents: Array<{ type: string; frequencyEvents: Array<{ value: number }> }>;
            }).__audioEvents.map((event) => ({
              type: event.type,
              frequency: event.frequencyEvents[0]?.value ?? null
            })))
          ).resolves.toEqual([
            { type: 'triangle', frequency: 880 },
            { type: 'triangle', frequency: 880 },
            { type: 'sine', frequency: 196 }
          ]);
        }
      }
    ]
  });

  tester.generateDocs();
});
