import { configureStore } from '@reduxjs/toolkit';
import { browser } from '$app/environment';
import { readable } from 'svelte/store';
import { gameActions, gameReducer, rebuildGameState, storageVersion } from '$lib/redux/game-slice';

const STORAGE_KEY = 'chess-tt:mvp-state';

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
      return undefined;
    }

    return { game: rebuildGameState(parsed.events) };
  } catch {
    return undefined;
  }
}

function persistGameState(gameState) {
  if (!browser) {
    return;
  }

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
      }))
    })
  );
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
  set(appStore.getState().game);
  return appStore.subscribe(() => {
    set(appStore.getState().game);
  });
});

export { gameActions };
