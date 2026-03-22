import { createSlice } from '@reduxjs/toolkit';
import {
  createDefaultBoardThemeSettings,
  normalizeBoardThemeSettings
} from '$lib/game/board-themes';
import { createChess, getTurnName, pieceSymbol } from '$lib/game/chess-game';
import {
  createInitialClockState,
  createDefaultTimeSettings,
  getColorForSeat,
  getColorName,
  getIncrementMs,
  getSeatForColor,
  isNoClockTimeSettings,
  normalizeClockState,
  normalizeTimeSettings
} from '$lib/game/time-controls';

const STORAGE_VERSION = 1;

function createUiState() {
  return {
    selectedSquare: null,
    highlightedSquares: [],
    draggedSquare: null
  };
}

function createMoveEvent(fen, from, to) {
  const chess = createChess(fen);
  const piece = chess.get(from);

  if (!piece) {
    return null;
  }

  const isPromotionMove = piece.type === 'p' && (to.endsWith('8') || to.endsWith('1'));
  return isPromotionMove
    ? { type: 'move.played', from, to, promotion: 'q' }
    : { type: 'move.played', from, to };
}

function deriveCapturedPieces(history) {
  const captured = {
    white: [],
    black: []
  };

  for (const move of history) {
    if (!move.captured) {
      continue;
    }

    const capturedColor = move.color === 'w' ? 'black' : 'white';
    const piece = { color: move.color === 'w' ? 'b' : 'w', type: move.captured };
    captured[capturedColor].push({ ...piece, symbol: pieceSymbol(piece) });
  }

  return captured;
}

function deriveOutcome(chess, currentOutcome) {
  if (currentOutcome.status !== 'active') {
    return currentOutcome;
  }

  if (chess.isCheckmate()) {
    return {
      status: 'checkmate',
      winner: chess.turn() === 'w' ? 'black' : 'white',
      reason: 'checkmate'
    };
  }

  if (chess.isStalemate()) {
    return {
      status: 'stalemate',
      winner: null,
      reason: 'stalemate'
    };
  }

  if (chess.isDraw()) {
    return {
      status: 'draw',
      winner: null,
      reason: 'draw'
    };
  }

  return currentOutcome;
}

function buildMessage(chess, outcome) {
  if (outcome.status === 'checkmate') {
    return `${outcome.winner === 'white' ? 'White' : 'Black'} wins by checkmate`;
  }

  if (outcome.status === 'timeout') {
    return `${outcome.winner === 'white' ? 'White' : 'Black'} wins on time`;
  }

  if (outcome.status === 'resigned') {
    return `${outcome.winner === 'white' ? 'White' : 'Black'} wins by resignation`;
  }

  if (outcome.status === 'stalemate') {
    return 'Draw by stalemate';
  }

  if (outcome.status === 'draw') {
    return 'Drawn position';
  }

  const turnLabel = getTurnName(chess.turn());
  return chess.inCheck() ? `${turnLabel} to move · Check` : `${turnLabel} to move`;
}

function createTimeoutOutcome(timerSettings, expiredSeat) {
  const winnerSeat = expiredSeat === 'top' ? 'bottom' : 'top';
  const winnerColor = getColorForSeat(timerSettings.seatColors, winnerSeat);

  return {
    status: 'timeout',
    winner: getColorName(winnerColor),
    reason: 'time'
  };
}

function synchronizeTimerState(timerState, timerSettings, turn, status, now, clockArmed) {
  const normalizedTimerState = normalizeClockState(timerState, timerSettings, turn, status, clockArmed);

  if (status !== 'active') {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat: null,
        lastUpdatedAt: null
      },
      expiredSeat: null
    };
  }

  if (isNoClockTimeSettings(timerSettings)) {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat: null,
        lastUpdatedAt: null
      },
      expiredSeat: null
    };
  }

  if (!clockArmed) {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat: null,
        lastUpdatedAt: null
      },
      expiredSeat: null
    };
  }

  const activeSeat = normalizedTimerState.activeSeat ?? getSeatForColor(timerSettings.seatColors, turn);
  if (!activeSeat) {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat: null,
        lastUpdatedAt: null
      },
      expiredSeat: null
    };
  }

  const currentRemainingMs = normalizedTimerState.seats[activeSeat].remainingMs;
  if (currentRemainingMs <= 0) {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat: null,
        lastUpdatedAt: null
      },
      expiredSeat: activeSeat
    };
  }

  if (typeof now !== 'number') {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat
      },
      expiredSeat: null
    };
  }

  if (normalizedTimerState.lastUpdatedAt == null) {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat,
        lastUpdatedAt: now
      },
      expiredSeat: null
    };
  }

  if (now < normalizedTimerState.lastUpdatedAt) {
    return {
      timerState: {
        ...normalizedTimerState,
        activeSeat,
        // Preserve the remaining time and restart the running baseline from the new clock value.
        lastUpdatedAt: now
      },
      expiredSeat: null
    };
  }

  const elapsedMs = Math.max(0, now - normalizedTimerState.lastUpdatedAt);
  const nextRemainingMs = Math.max(0, currentRemainingMs - elapsedMs);

  return {
    timerState: {
      ...normalizedTimerState,
      activeSeat: nextRemainingMs > 0 ? activeSeat : null,
      lastUpdatedAt: nextRemainingMs > 0 ? now : null,
      seats: {
        ...normalizedTimerState.seats,
        [activeSeat]: {
          remainingMs: nextRemainingMs
        }
      }
    },
    expiredSeat: nextRemainingMs === 0 ? activeSeat : null
  };
}

function applySynchronizedTimer(state, now) {
  const timerSettings = normalizeTimeSettings(state.timerSettings);
  const clockArmed = state.history.length > 0;
  const { timerState, expiredSeat } = synchronizeTimerState(
    state.timerState,
    timerSettings,
    state.turn,
    state.status,
    now,
    clockArmed
  );

  if (!expiredSeat || state.status !== 'active') {
    return {
      ...state,
      timerSettings,
      timerState
    };
  }

  const chess = createChess(state.currentFen);
  const outcome = createTimeoutOutcome(timerSettings, expiredSeat);

  return {
    ...state,
    timerSettings,
    timerState,
    status: outcome.status,
    winner: outcome.winner,
    reason: outcome.reason,
    message: buildMessage(chess, outcome)
  };
}

function advanceTimerAfterMove(timerState, timerSettings, movingColor, nextTurn, status, now) {
  if (isNoClockTimeSettings(timerSettings)) {
    return {
      ...normalizeClockState(timerState, timerSettings, nextTurn, status, false),
      activeSeat: null,
      lastUpdatedAt: null
    };
  }

  const movingSeat = getSeatForColor(timerSettings.seatColors, movingColor);
  const nextActiveSeat = status === 'active' ? getSeatForColor(timerSettings.seatColors, nextTurn) : null;

  if (!movingSeat) {
    return normalizeClockState(timerState, timerSettings, nextTurn, status, true);
  }

  const nextSeats = {
    ...timerState.seats,
    [movingSeat]: {
      // Only award increment when the moving seat's clock was actually running.
      remainingMs: timerState.seats[movingSeat].remainingMs + (
        timerState.activeSeat === movingSeat ? getIncrementMs(timerSettings, movingSeat) : 0
      )
    }
  };

  return {
    ...normalizeClockState(timerState, timerSettings, nextTurn, status, true),
    activeSeat: nextActiveSeat,
    lastUpdatedAt: nextActiveSeat && typeof now === 'number' ? now : null,
    seats: nextSeats,
    turnStartSeats: {
      top: { ...nextSeats.top },
      bottom: { ...nextSeats.bottom }
    }
  };
}

function clearUiState(state) {
  return {
    ...state,
    ui: createUiState()
  };
}

export function rebuildGameState(events = [], options = {}) {
  const sanitizedEvents = [];
  let chess = createChess();
  let outcome = {
    status: 'active',
    winner: null,
    reason: null
  };
  let lastMove = null;

  const pendingEvents = Array.isArray(events) && events.length > 0 ? events : [{ type: 'game.started' }];

  for (const event of pendingEvents) {
    if (!event || typeof event.type !== 'string') {
      continue;
    }

    if (event.type === 'game.started') {
      chess = createChess();
      outcome = {
        status: 'active',
        winner: null,
        reason: null
      };
      lastMove = null;
      sanitizedEvents.length = 0;
      sanitizedEvents.push({ type: 'game.started' });
      continue;
    }

    if (sanitizedEvents.length === 0) {
      sanitizedEvents.push({ type: 'game.started' });
    }

    if (event.type === 'move.played' && outcome.status === 'active') {
      const move = chess.move({
        from: event.from,
        to: event.to,
        promotion: event.promotion
      });

      if (!move) {
        continue;
      }

      sanitizedEvents.push({
        type: 'move.played',
        from: move.from,
        to: move.to,
        san: move.san,
        ...(move.promotion ? { promotion: move.promotion } : {})
      });
      lastMove = {
        from: move.from,
        to: move.to,
        san: move.san,
        color: move.color,
        piece: move.piece
      };
      continue;
    }

    if (event.type === 'game.resigned' && outcome.status === 'active') {
      sanitizedEvents.push({
        type: 'game.resigned',
        color: event.color
      });
      outcome = {
        status: 'resigned',
        winner: event.color === 'w' ? 'black' : 'white',
        reason: 'resignation'
      };
    }
  }

  if (sanitizedEvents.length === 0) {
    sanitizedEvents.push({ type: 'game.started' });
  }

  outcome = deriveOutcome(chess, outcome);

  const history = chess.history({ verbose: true }).map((move) => ({
    color: move.color,
    from: move.from,
    to: move.to,
    san: move.san,
    piece: move.piece,
    captured: move.captured ?? null,
    promotion: move.promotion ?? null
  }));

  const baseState = {
    storageVersion: STORAGE_VERSION,
    events: sanitizedEvents.map((event, index) => ({ ...event, id: index })),
    currentFen: chess.fen(),
    turn: chess.turn(),
    status: outcome.status,
    winner: outcome.winner,
    reason: outcome.reason,
    message: buildMessage(chess, outcome),
    history,
    lastMove,
    captured: deriveCapturedPieces(history),
    boardThemeSettings: normalizeBoardThemeSettings(
      options.boardThemeSettings ?? createDefaultBoardThemeSettings()
    ),
    ui: createUiState()
  };

  const timerSettings = normalizeTimeSettings(options.timerSettings ?? createDefaultTimeSettings());
  const synchronizedState = applySynchronizedTimer(
    {
      ...baseState,
      timerSettings,
      timerState: options.timerState ?? createInitialClockState(
        timerSettings,
        baseState.turn,
        baseState.status,
        options.now,
        baseState.history.length > 0
      )
    },
    options.now
  );

  return synchronizedState;
}

function setSelection(state, square) {
  const chess = createChess(state.currentFen);
  const piece = chess.get(square);

  if (!piece || piece.color !== state.turn || state.status !== 'active') {
    return {
      ...state,
      ui: {
        ...state.ui,
        selectedSquare: null,
        highlightedSquares: []
      }
    };
  }

  return {
    ...state,
    ui: {
      ...state.ui,
      selectedSquare: square,
      highlightedSquares: chess.moves({ square, verbose: true }).map((move) => move.to)
    }
  };
}

function clearInteractionState(state) {
  return {
    ...state,
    ui: {
      ...state.ui,
      selectedSquare: null,
      highlightedSquares: [],
      draggedSquare: null
    }
  };
}

function createMoveState(state, from, to, now) {
  const timedState = applySynchronizedTimer(state, now);
  if (timedState.status !== 'active') {
    return clearUiState(timedState);
  }

  const moveEvent = createMoveEvent(timedState.currentFen, from, to);

  if (!moveEvent) {
    return timedState;
  }

  const next = rebuildGameState([
    ...timedState.events.map(({ type, from: eventFrom, to: eventTo, color, promotion }) => ({
      type,
      from: eventFrom,
      to: eventTo,
      color,
      promotion
    })),
    moveEvent
  ], {
    boardThemeSettings: timedState.boardThemeSettings,
    timerSettings: timedState.timerSettings
  });

  return {
    ...next,
    timerSettings: timedState.timerSettings,
    timerState: advanceTimerAfterMove(
      timedState.timerState,
      timedState.timerSettings,
      timedState.turn,
      next.turn,
      next.status,
      now
    )
  };
}

function exportEvents(state) {
  return state.events.map(({ type, from, to, color, promotion }) => ({
    type,
    from,
    to,
    color,
    promotion
  }));
}

const initialState = rebuildGameState();

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    squarePressed(state, action) {
      const square = typeof action.payload === 'string' ? action.payload : action.payload?.square;
      const now = typeof action.payload === 'object' ? action.payload?.now : null;

      if (typeof square !== 'string') {
        return state;
      }

      const timedState = applySynchronizedTimer(state, now);

      if (timedState.status !== 'active') {
        return clearUiState(timedState);
      }

      if (timedState.ui.selectedSquare === square) {
        return clearInteractionState(timedState);
      }

      if (timedState.ui.selectedSquare && timedState.ui.highlightedSquares.includes(square)) {
        return createMoveState(timedState, timedState.ui.selectedSquare, square, now);
      }

      return setSelection(timedState, square);
    },
    dragStarted(state, action) {
      const square = typeof action.payload === 'string' ? action.payload : action.payload?.square;
      const now = typeof action.payload === 'object' ? action.payload?.now : null;
      const timedState = applySynchronizedTimer(state, now);

      if (timedState.status !== 'active' || typeof square !== 'string') {
        return clearUiState(timedState);
      }

      return setSelection({
        ...timedState,
        ui: {
          ...timedState.ui,
          draggedSquare: square
        }
      }, square);
    },
    dragEnded(state) {
      return {
        ...state,
        ui: {
          ...state.ui,
          draggedSquare: null
        }
      };
    },
    moveDropped(state, action) {
      const { from, to, now } = action.payload ?? {};

      const timedState = applySynchronizedTimer(state, now);

      if (typeof from !== 'string' || typeof to !== 'string' || timedState.status !== 'active') {
        return timedState;
      }

      const chess = createChess(timedState.currentFen);
      const validTargets = chess.moves({ square: from, verbose: true }).map((move) => move.to);

      if (!validTargets.includes(to)) {
        clearInteractionState(timedState);
        return timedState;
      }

      return createMoveState(timedState, from, to, now);
    },
    newGameRequested(state, action) {
      const now = action.payload?.now;
      return rebuildGameState(
        [{ type: 'game.started' }],
        {
          boardThemeSettings: state.boardThemeSettings,
          timerSettings: state.timerSettings,
          timerState: createInitialClockState(state.timerSettings, 'w', 'active', now),
          now
        }
      );
    },
    undoRequested(state, action) {
      const now = action.payload?.now;
      const events = exportEvents(state).filter((event, index) => index > 0);

      if (events.length === 0) {
        return state;
      }

      const nextEvents = [{ type: 'game.started' }, ...events.slice(0, -1)];
      const nextState = rebuildGameState(nextEvents, {
        timerSettings: state.timerSettings,
        timerState: state.timerState,
        boardThemeSettings: state.boardThemeSettings,
        now
      });
      const clockArmed = nextState.history.length > 0;
      const activeSeat = nextState.status === 'active' && clockArmed && !isNoClockTimeSettings(state.timerSettings)
        ? getSeatForColor(state.timerSettings.seatColors, nextState.turn)
        : null;
      const restoredTurnStartSeats = {
        top: {
          remainingMs: state.timerState.turnStartSeats?.top?.remainingMs ?? state.timerState.seats.top.remainingMs
        },
        bottom: {
          remainingMs: state.timerState.turnStartSeats?.bottom?.remainingMs ?? state.timerState.seats.bottom.remainingMs
        }
      };

      return {
        ...nextState,
        timerState: {
          ...normalizeClockState(state.timerState, state.timerSettings, nextState.turn, nextState.status, clockArmed),
          seats: restoredTurnStartSeats,
          activeSeat,
          lastUpdatedAt: activeSeat && typeof now === 'number' ? now : null,
          turnStartSeats: restoredTurnStartSeats
        }
      };
    },
    resignRequested(state, action) {
      const now = action.payload?.now;
      const timedState = applySynchronizedTimer(state, now);

      if (timedState.status !== 'active') {
        return timedState;
      }

      return rebuildGameState([
        ...exportEvents(timedState),
        { type: 'game.resigned', color: timedState.turn }
      ], {
        boardThemeSettings: timedState.boardThemeSettings,
        timerSettings: timedState.timerSettings,
        timerState: timedState.timerState,
        now
      });
    },
    hydrateRequested(_state, action) {
      const events = action.payload?.events;
      return rebuildGameState(events, {
        boardThemeSettings: action.payload?.boardThemeSettings,
        timerSettings: action.payload?.timerSettings,
        timerState: action.payload?.timerState
      });
    },
    boardThemeConfigured(state, action) {
      return {
        ...state,
        boardThemeSettings: normalizeBoardThemeSettings(action.payload)
      };
    },
    timeControlsConfigured(state, action) {
      const timeSettings = normalizeTimeSettings(action.payload);
      const now = action.payload?.now;

      return {
        ...state,
        timerSettings: timeSettings,
        timerState: createInitialClockState(timeSettings, state.turn, state.status, now)
      };
    },
    clockTicked(state, action) {
      const now = action.payload;

      if (typeof now !== 'number') {
        return state;
      }

      return applySynchronizedTimer(state, now);
    }
  }
});

export const gameActions = gameSlice.actions;
export const gameReducer = gameSlice.reducer;
export const storageVersion = STORAGE_VERSION;
