import { configureStore } from '@reduxjs/toolkit';
import { browser } from '$app/environment';
import { readable } from 'svelte/store';
import { gameActions, gameReducer, rebuildGameState, storageVersion } from '$lib/redux/game-slice';
import { STORAGE_KEY } from '$lib/redux/persistence';

function loadPersistedGameState() {
  if (!browser) {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw);
    if (parsed?.storageVersion !== storageVersion || !Array.isArray(parsed.events)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }

    return {
      game: rebuildGameState(parsed.events, {
        boardThemeSettings: parsed.boardThemeSettings,
        timerSettings: parsed.timerSettings,
        timerState: parsed.timerState
      })
    };
  } catch {
    return undefined;
  }
}

function persistGameState(gameState) {
  if (!browser) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
        JSON.stringify({
          storageVersion,
          events: gameState.events.map(({ type, from, to, color, promotion }) => ({
            type,
            from,
            to,
            color,
            promotion
          })),
          boardThemeSettings: gameState.boardThemeSettings,
          timerSettings: gameState.timerSettings,
          timerState: gameState.timerState
        })
      );
  } catch {
    // Ignore persistence failures so local play continues even when storage is unavailable.
  }
}

function createAppStore() {
  const store = configureStore({
    reducer: {
      game: gameReducer
    },
    preloadedState: loadPersistedGameState()
  });

  if (browser) {
    store.subscribe(() => {
      persistGameState(store.getState().game);
    });
  }

  return store;
}

export const appStore = createAppStore();
export const gameState = readable(appStore.getState().game, (set) => {
  const readGameState = () => appStore.getState().game;

  set(readGameState());
  return appStore.subscribe(() => {
    set(readGameState());
  });
});

export { gameActions };
