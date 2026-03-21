export const CUSTOM_BOARD_THEME_PRESET_ID = 'custom';

export const BOARD_THEME_PRESETS = [
  {
    id: 'slate-sand',
    label: 'Current',
    lightSquare: '#e7d7b4',
    darkSquare: '#576272'
  },
  {
    id: 'green-ivory',
    label: 'Green',
    lightSquare: '#f2ecd8',
    darkSquare: '#557a46'
  },
  {
    id: 'brown-ivory',
    label: 'Brown',
    lightSquare: '#efe4d2',
    darkSquare: '#8b5e3c'
  }
];

const DEFAULT_BOARD_THEME_PRESET_ID = 'slate-sand';
const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

function normalizeHexColor(value, fallback) {
  return HEX_COLOR_PATTERN.test(value ?? '') ? value.toLowerCase() : fallback;
}

function getPresetById(presetId) {
  return BOARD_THEME_PRESETS.find(({ id }) => id === presetId) ?? BOARD_THEME_PRESETS[0];
}

export function createDefaultBoardThemeSettings() {
  const preset = getPresetById(DEFAULT_BOARD_THEME_PRESET_ID);

  return {
    presetId: preset.id,
    palette: {
      lightSquare: preset.lightSquare,
      darkSquare: preset.darkSquare
    }
  };
}

export function resolveBoardThemePresetId(palette) {
  const matchingPreset = BOARD_THEME_PRESETS.find((preset) => (
    preset.lightSquare === palette?.lightSquare &&
    preset.darkSquare === palette?.darkSquare
  ));

  return matchingPreset?.id ?? CUSTOM_BOARD_THEME_PRESET_ID;
}

export function normalizeBoardThemeSettings(settings = {}) {
  const fallbackPreset = getPresetById(settings?.presetId ?? DEFAULT_BOARD_THEME_PRESET_ID);
  const defaults = createDefaultBoardThemeSettings();
  const palette = {
    lightSquare: normalizeHexColor(
      settings?.palette?.lightSquare ?? settings?.lightSquare,
      fallbackPreset.lightSquare ?? defaults.palette.lightSquare
    ),
    darkSquare: normalizeHexColor(
      settings?.palette?.darkSquare ?? settings?.darkSquare,
      fallbackPreset.darkSquare ?? defaults.palette.darkSquare
    )
  };

  return {
    presetId: resolveBoardThemePresetId(palette),
    palette
  };
}
