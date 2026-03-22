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
    expect(state.boardThemeSettings.presetId).toBe('slate-sand');
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

  test('undo restores the current player clock and resumes the previous player clock', () => {
    let state = gameReducer(undefined, gameActions.squarePressed({ square: 'e2', now: 1000 }));
    state = gameReducer(state, gameActions.squarePressed({ square: 'e4', now: 4000 }));
    state = gameReducer(state, gameActions.squarePressed({ square: 'e7', now: 4000 }));
    state = gameReducer(state, gameActions.squarePressed({ square: 'e5', now: 9000 }));

    expect(state.turn).toBe('w');
    expect(state.timerState.activeSeat).toBe('bottom');
    expect(state.timerState.seats.top.remainingMs).toBe(905000);
    expect(state.timerState.seats.bottom.remainingMs).toBe(900000);

    state = gameReducer(state, gameActions.clockTicked(12000));

    expect(state.timerState.activeSeat).toBe('bottom');
    expect(state.timerState.seats.top.remainingMs).toBe(905000);
    expect(state.timerState.seats.bottom.remainingMs).toBe(897000);

    state = gameReducer(state, gameActions.undoRequested({ now: 12000 }));

    expect(state.turn).toBe('b');
    expect(state.currentFen).toContain('4P3');
    expect(state.timerState.activeSeat).toBe('top');
    expect(state.timerState.lastUpdatedAt).toBe(12000);
    expect(state.timerState.seats.top.remainingMs).toBe(905000);
    expect(state.timerState.seats.bottom.remainingMs).toBe(900000);
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

  test('new series names players and randomizes the first white seat from the payload', () => {
    const state = gameReducer(undefined, gameActions.newSeriesRequested({
      players: {
        top: 'Alice',
        bottom: 'Bob'
      },
      startingWhiteSeat: 'top',
      now: 0
    }));

    expect(state.seriesPlayers).toEqual({
      top: 'Alice',
      bottom: 'Bob'
    });
    expect(state.seriesHistory).toEqual([]);
    expect(state.timerSettings.seatColors).toEqual({
      top: 'w',
      bottom: 'b'
    });
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

  test('archives completed series games with result tokens and alternates colours for the next game', () => {
    let state = gameReducer(undefined, gameActions.newSeriesRequested({
      players: {
        top: 'Alice',
        bottom: 'Bob'
      },
      startingWhiteSeat: 'top',
      now: 0
    }));

    state = gameReducer(state, gameActions.squarePressed('f2'));
    state = gameReducer(state, gameActions.squarePressed('f3'));
    state = gameReducer(state, gameActions.squarePressed('e7'));
    state = gameReducer(state, gameActions.squarePressed('e5'));
    state = gameReducer(state, gameActions.squarePressed('g2'));
    state = gameReducer(state, gameActions.squarePressed('g4'));
    state = gameReducer(state, gameActions.squarePressed('d8'));
    state = gameReducer(state, gameActions.squarePressed('h4'));

    expect(state.status).toBe('checkmate');
    expect(state.seriesHistory).toHaveLength(1);
    expect(state.reviewGameNumber).toBe(1);
    expect(state.seriesHistory[0]).toMatchObject({
      gameNumber: 1,
      whiteName: 'Alice',
      blackName: 'Bob',
      result: '0-1'
    });

    state = gameReducer(state, gameActions.newGameRequested({ now: 0 }));

    expect(state.seriesHistory).toHaveLength(1);
    expect(state.reviewGameNumber).toBeNull();
    expect(state.timerSettings.seatColors).toEqual({
      top: 'b',
      bottom: 'w'
    });
  });

  test('selecting a game from history restores it for review and export', () => {
    let state = gameReducer(undefined, gameActions.newSeriesRequested({
      players: {
        top: 'Alice',
        bottom: 'Bob'
      },
      startingWhiteSeat: 'bottom',
      now: 0
    }));

    state = gameReducer(state, gameActions.squarePressed('f2'));
    state = gameReducer(state, gameActions.squarePressed('f3'));
    state = gameReducer(state, gameActions.squarePressed('e7'));
    state = gameReducer(state, gameActions.squarePressed('e5'));
    state = gameReducer(state, gameActions.squarePressed('g2'));
    state = gameReducer(state, gameActions.squarePressed('g4'));
    state = gameReducer(state, gameActions.squarePressed('d8'));
    state = gameReducer(state, gameActions.squarePressed('h4'));
    state = gameReducer(state, gameActions.newGameRequested({ now: 0 }));
    state = gameReducer(state, gameActions.historyGameSelected({ gameNumber: 1 }));

    expect(state.reviewGameNumber).toBe(1);
    expect(state.status).toBe('checkmate');
    expect(state.winner).toBe('black');
    expect(state.timerSettings.seatColors).toEqual({
      top: 'b',
      bottom: 'w'
    });
    expect(state.currentFen).toContain('6Pq');
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

  test('applies custom board colours independently from the clock settings', () => {
    const state = gameReducer(undefined, gameActions.boardThemeConfigured({
      palette: {
        lightSquare: '#334455',
        darkSquare: '#112233'
      }
    }));

    expect(state.boardThemeSettings).toEqual({
      presetId: 'custom',
      palette: {
        lightSquare: '#334455',
        darkSquare: '#112233'
      }
    });
    expect(state.timerSettings.presetId).toBe('rapid-15-10');
  });

  test('keeps board colours after a move is played', () => {
    let state = gameReducer(undefined, gameActions.boardThemeConfigured({
      palette: {
        lightSquare: '#334455',
        darkSquare: '#112233'
      }
    }));

    state = gameReducer(state, gameActions.squarePressed('e2'));
    state = gameReducer(state, gameActions.squarePressed('e4'));

    expect(state.boardThemeSettings).toEqual({
      presetId: 'custom',
      palette: {
        lightSquare: '#334455',
        darkSquare: '#112233'
      }
    });
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

  test('does not start or expire clocks in no-clock mode', () => {
    let state = gameReducer(undefined, gameActions.timeControlsConfigured({
      presetId: 'no-clock',
      seats: {
        top: { initialMinutes: 0, incrementSeconds: 0 },
        bottom: { initialMinutes: 0, incrementSeconds: 0 }
      },
      now: 0
    }));

    state = gameReducer(state, gameActions.clockTicked(1000));
    state = gameReducer(state, gameActions.squarePressed({ square: 'e2', now: 1000 }));
    state = gameReducer(state, gameActions.squarePressed({ square: 'e4', now: 4000 }));
    state = gameReducer(state, gameActions.clockTicked(121000));

    expect(state.status).toBe('active');
    expect(state.timerSettings.presetId).toBe('no-clock');
    expect(state.timerState.activeSeat).toBeNull();
    expect(state.timerState.lastUpdatedAt).toBeNull();
    expect(state.timerState.seats.top.remainingMs).toBe(0);
    expect(state.timerState.seats.bottom.remainingMs).toBe(0);
  });
});
