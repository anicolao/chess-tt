import { describe, expect, test } from 'vitest';
import {
  BOARD_THEME_PRESETS,
  createDefaultBoardThemeSettings,
  normalizeBoardThemeSettings,
  resolveBoardThemePresetId
} from '../../src/lib/game/board-themes.js';

describe('board themes', () => {
  test('exposes the supported board theme presets in order', () => {
    expect(BOARD_THEME_PRESETS.map(({ label }) => label)).toEqual([
      'Current',
      'Green',
      'Brown'
    ]);
  });

  test('keeps the current colours as the default board theme', () => {
    expect(createDefaultBoardThemeSettings()).toEqual({
      presetId: 'slate-sand',
      palette: {
        lightSquare: '#e7d7b4',
        darkSquare: '#576272'
      }
    });
  });

  test('marks non-preset colours as custom while normalizing hex values', () => {
    const settings = normalizeBoardThemeSettings({
      palette: {
        lightSquare: '#ABCDEF',
        darkSquare: '#123456'
      }
    });

    expect(settings).toEqual({
      presetId: 'custom',
      palette: {
        lightSquare: '#abcdef',
        darkSquare: '#123456'
      }
    });
    expect(resolveBoardThemePresetId(settings.palette)).toBe('custom');
  });
});
