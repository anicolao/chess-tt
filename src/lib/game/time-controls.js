const MINUTE_MS = 60_000;
const SECOND_MS = 1_000;

export const CUSTOM_TIME_CONTROL_PRESET_ID = 'custom';
export const DEFAULT_SEAT_COLORS = {
  top: 'b',
  bottom: 'w'
};

export const TIME_CONTROL_PRESETS = [
  {
    id: 'classical-15-10',
    label: 'Classical · 15 | 10',
    seats: {
      top: { initialMinutes: 15, incrementSeconds: 10 },
      bottom: { initialMinutes: 15, incrementSeconds: 10 }
    }
  },
  {
    id: 'rapid-5-3',
    label: 'Rapid · 5 | 3',
    seats: {
      top: { initialMinutes: 5, incrementSeconds: 3 },
      bottom: { initialMinutes: 5, incrementSeconds: 3 }
    }
  },
  {
    id: 'speed-2-12',
    label: 'Speed · 2 | 12',
    seats: {
      top: { initialMinutes: 2, incrementSeconds: 12 },
      bottom: { initialMinutes: 2, incrementSeconds: 12 }
    }
  },
  {
    id: 'standard-10-0',
    label: 'Standard · 10 | 0',
    seats: {
      top: { initialMinutes: 10, incrementSeconds: 0 },
      bottom: { initialMinutes: 10, incrementSeconds: 0 }
    }
  }
];

function clampWholeNumber(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function createSeatTimeControl(initialMinutes = 15, incrementSeconds = 10) {
  return {
    initialMinutes: clampWholeNumber(initialMinutes, 15),
    incrementSeconds: clampWholeNumber(incrementSeconds, 10)
  };
}

export function getSeatLabel(seat) {
  return seat === 'top' ? 'Top seat' : 'Bottom seat';
}

export function getColorName(colorCode) {
  return colorCode === 'b' ? 'black' : 'white';
}

export function getSeatForColor(seatColors, colorCode) {
  return Object.entries(seatColors ?? {}).find(([, seatColor]) => seatColor === colorCode)?.[0] ?? null;
}

export function getColorForSeat(seatColors, seat) {
  return seatColors?.[seat] ?? null;
}

export function createDefaultTimeSettings() {
  const preset = TIME_CONTROL_PRESETS[0];
  return {
    presetId: preset.id,
    seatColors: { ...DEFAULT_SEAT_COLORS },
    seats: {
      top: { ...preset.seats.top },
      bottom: { ...preset.seats.bottom }
    }
  };
}

export function resolveTimeControlPresetId(seats) {
  const matchingPreset = TIME_CONTROL_PRESETS.find((preset) => (
    preset.seats.top.initialMinutes === seats?.top?.initialMinutes &&
    preset.seats.top.incrementSeconds === seats?.top?.incrementSeconds &&
    preset.seats.bottom.initialMinutes === seats?.bottom?.initialMinutes &&
    preset.seats.bottom.incrementSeconds === seats?.bottom?.incrementSeconds
  ));

  return matchingPreset?.id ?? CUSTOM_TIME_CONTROL_PRESET_ID;
}

export function normalizeTimeSettings(settings = {}) {
  const defaults = createDefaultTimeSettings();
  const seatColors = {
    top: settings?.seatColors?.top === 'w' ? 'w' : DEFAULT_SEAT_COLORS.top,
    bottom: settings?.seatColors?.bottom === 'b' ? 'b' : DEFAULT_SEAT_COLORS.bottom
  };

  if (seatColors.top === seatColors.bottom) {
    seatColors.top = DEFAULT_SEAT_COLORS.top;
    seatColors.bottom = DEFAULT_SEAT_COLORS.bottom;
  }

  const seats = {
    top: createSeatTimeControl(
      settings?.seats?.top?.initialMinutes ?? defaults.seats.top.initialMinutes,
      settings?.seats?.top?.incrementSeconds ?? defaults.seats.top.incrementSeconds
    ),
    bottom: createSeatTimeControl(
      settings?.seats?.bottom?.initialMinutes ?? defaults.seats.bottom.initialMinutes,
      settings?.seats?.bottom?.incrementSeconds ?? defaults.seats.bottom.incrementSeconds
    )
  };

  return {
    presetId: resolveTimeControlPresetId(seats),
    seatColors,
    seats
  };
}

export function createInitialClockState(timeSettings, turn = 'w', status = 'active', now = null) {
  const normalizedSettings = normalizeTimeSettings(timeSettings);
  const activeSeat = status === 'active' ? getSeatForColor(normalizedSettings.seatColors, turn) : null;

  return {
    activeSeat,
    lastUpdatedAt: activeSeat && typeof now === 'number' ? now : null,
    seats: {
      top: {
        remainingMs: normalizedSettings.seats.top.initialMinutes * MINUTE_MS
      },
      bottom: {
        remainingMs: normalizedSettings.seats.bottom.initialMinutes * MINUTE_MS
      }
    }
  };
}

export function normalizeClockState(clockState, timeSettings, turn = 'w', status = 'active') {
  const defaults = createInitialClockState(timeSettings, turn, status);
  const normalizedSettings = normalizeTimeSettings(timeSettings);
  const derivedActiveSeat = status === 'active' ? getSeatForColor(normalizedSettings.seatColors, turn) : null;

  return {
    activeSeat: status === 'active'
      ? (clockState?.activeSeat === 'top' || clockState?.activeSeat === 'bottom' ? clockState.activeSeat : derivedActiveSeat)
      : null,
    lastUpdatedAt: typeof clockState?.lastUpdatedAt === 'number' ? clockState.lastUpdatedAt : defaults.lastUpdatedAt,
    seats: {
      top: {
        remainingMs: clampWholeNumber(clockState?.seats?.top?.remainingMs, defaults.seats.top.remainingMs)
      },
      bottom: {
        remainingMs: clampWholeNumber(clockState?.seats?.bottom?.remainingMs, defaults.seats.bottom.remainingMs)
      }
    }
  };
}

export function formatClock(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil((remainingMs ?? 0) / SECOND_MS));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatTimeControl(control) {
  return `${control.initialMinutes} | ${control.incrementSeconds}`;
}

export function getIncrementMs(timeSettings, seat) {
  return normalizeTimeSettings(timeSettings).seats[seat].incrementSeconds * SECOND_MS;
}
