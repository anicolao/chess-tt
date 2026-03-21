import { describe, expect, test } from 'vitest';
import { gameActions, gameReducer, rebuildGameState } from '../../src/lib/redux/game-slice.js';

function reduce(actions) {
  return actions.reduce((state, action) => gameReducer(state, action), undefined);
}

describe('game reducer', () => {
  test('starts with white to move and no captures', () => {
    const state = gameReducer(undefined, { type: 'unknown' });

    expect(state.turn).toBe('w');
    expect(state.status).toBe('active');
    expect(state.message).toBe('White to move');
    expect(state.captured.white).toHaveLength(0);
    expect(state.captured.black).toHaveLength(0);
    expect(state.events.map((event) => event.type)).toEqual(['game.started']);
    expect(state.timerSettings.seats.top.initialMinutes).toBe(15);
    expect(state.timerSettings.seats.bottom.initialMinutes).toBe(15);
    expect(state.timerState.activeSeat).toBeNull();
  });

  test('selects a piece and highlights legal moves', () => {
    let state = gameReducer(undefined, gameActions.squarePressed('e2'));

    expect(state.ui.selectedSquare).toBe('e2');
    expect(state.ui.highlightedSquares).toEqual(['e3', 'e4']);

    state = gameReducer(state, gameActions.squarePressed('e4'));

    expect(state.turn).toBe('b');
    expect(state.ui.selectedSquare).toBeNull();
    expect(state.currentFen).toContain('4P3');
    expect(state.events.map((event) => event.type)).toEqual(['game.started', 'move.played']);
  });

  test('undo removes the latest event from the event log', () => {
    const movedState = reduce([
      gameActions.squarePressed('e2'),
      gameActions.squarePressed('e4'),
      gameActions.squarePressed('e7'),
      gameActions.squarePressed('e5')
    ]);

    const undoneState = gameReducer(movedState, gameActions.undoRequested());

    expect(undoneState.turn).toBe('b');
    expect(undoneState.currentFen).toContain('4P3');
    expect(undoneState.events.map((event) => event.type)).toEqual(['game.started', 'move.played']);
  });

  test('records resignation and supports hydration from persisted events', () => {
    const resignedState = reduce([
      gameActions.squarePressed('f2'),
      gameActions.squarePressed('f3'),
      gameActions.resignRequested()
    ]);

    expect(resignedState.status).toBe('resigned');
    expect(resignedState.winner).toBe('white');
    expect(resignedState.message).toBe('White wins by resignation');

    const hydrated = gameReducer(
      undefined,
      gameActions.hydrateRequested({
        events: resignedState.events.map(({ type, from, to, color, promotion }) => ({
          type,
          from,
          to,
          color,
          promotion
        }))
      })
    );

    expect(hydrated.status).toBe('resigned');
    expect(hydrated.winner).toBe('white');
    expect(hydrated.events.map((event) => event.type)).toEqual(['game.started', 'move.played', 'game.resigned']);
  });

  test('detects checkmate from event replay', () => {
    const state = rebuildGameState([
      { type: 'game.started' },
      { type: 'move.played', from: 'f2', to: 'f3' },
      { type: 'move.played', from: 'e7', to: 'e5' },
      { type: 'move.played', from: 'g2', to: 'g4' },
      { type: 'move.played', from: 'd8', to: 'h4' }
    ]);

    expect(state.status).toBe('checkmate');
    expect(state.winner).toBe('black');
    expect(state.message).toBe('Black wins by checkmate');
  });

  test('applies custom seat time controls independently', () => {
    const state = gameReducer(undefined, gameActions.timeControlsConfigured({
      seats: {
        top: { initialMinutes: 15, incrementSeconds: 10 },
        bottom: { initialMinutes: 3, incrementSeconds: 2 }
      },
      now: 0
    }));

    expect(state.timerSettings.presetId).toBe('custom');
    expect(state.timerState.seats.top.remainingMs).toBe(900000);
    expect(state.timerState.seats.bottom.remainingMs).toBe(180000);
    expect(state.timerState.activeSeat).toBeNull();
  });

  test('starts the opposing clock after white completes the first move', () => {
    let state = gameReducer(undefined, gameActions.clockTicked(1000));

    expect(state.timerState.activeSeat).toBeNull();
    expect(state.timerState.seats.bottom.remainingMs).toBe(900000);

    state = gameReducer(state, gameActions.squarePressed({ square: 'e2', now: 1000 }));
    state = gameReducer(state, gameActions.squarePressed({ square: 'e4', now: 4000 }));

    expect(state.turn).toBe('b');
    expect(state.timerState.activeSeat).toBe('top');
    expect(state.timerState.seats.bottom.remainingMs).toBe(900000);
    expect(state.timerState.seats.top.remainingMs).toBe(900000);
  });

  test('flags timeout based on the active table side clock', () => {
    let state = gameReducer(undefined, gameActions.timeControlsConfigured({
      seats: {
        top: { initialMinutes: 2, incrementSeconds: 0 },
        bottom: { initialMinutes: 1, incrementSeconds: 0 }
      },
      now: 0
    }));

    state = gameReducer(state, gameActions.squarePressed({ square: 'e2', now: 0 }));
    state = gameReducer(state, gameActions.squarePressed({ square: 'e4', now: 0 }));
    state = gameReducer(state, gameActions.clockTicked(121000));

    expect(state.status).toBe('timeout');
    expect(state.winner).toBe('white');
    expect(state.message).toBe('White wins on time');
    expect(state.timerState.activeSeat).toBeNull();
    expect(state.timerState.seats.top.remainingMs).toBe(0);
  });
});
