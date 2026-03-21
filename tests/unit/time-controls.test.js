import { describe, expect, test } from 'vitest';
import {
  createDefaultTimeSettings,
  formatTimeControl,
  isNoClockTimeSettings,
  TIME_CONTROL_PRESETS
} from '../../src/lib/game/time-controls.js';

describe('time controls', () => {
  test('exposes the requested preset defaults in order', () => {
    expect(TIME_CONTROL_PRESETS.map(({ label }) => label)).toEqual([
      'Blitz · 2 | 12',
      'Blitz · 5 | 3',
      'Rapid · 10 | 10',
      'Rapid · 15 | 10',
      'Classic · 30 | 20',
      'Classic · 60 | 0',
      'No Clock'
    ]);
  });

  test('keeps 15 | 10 as the default configured clock', () => {
    expect(createDefaultTimeSettings()).toMatchObject({
      presetId: 'rapid-15-10',
      seats: {
        top: { initialMinutes: 15, incrementSeconds: 10 },
        bottom: { initialMinutes: 15, incrementSeconds: 10 }
      }
    });
  });

  test('treats the zeroed preset as no clock', () => {
    const noClockPreset = TIME_CONTROL_PRESETS.find(({ id }) => id === 'no-clock');

    expect(isNoClockTimeSettings({ seats: noClockPreset.seats })).toBe(true);
    expect(formatTimeControl(noClockPreset.seats.top)).toBe('No Clock');
  });
});
