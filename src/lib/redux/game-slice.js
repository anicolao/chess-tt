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
import { getResultToken } from '$lib/game/game-export';

const STORAGE_VERSION = 1;
const DEFAULT_SERIES_PLAYERS = {
  top: 'Player 1',
  bottom: 'Player 2'
};

function createUiState() {
  return {
    selectedSquare: null,
    highlightedSquares: [],
    draggedSquare: null
  };
}

function getOppositeSeat(seat) {
  return seat === 'top' ? 'bottom' : 'top';
}

function normalizePlayerName(name, fallback) {
  const trimmed = String(name ?? '').trim();
  return trimmed || fallback;
}

function normalizeSeriesPlayers(players = {}) {
  return {
    top: normalizePlayerName(players.top, DEFAULT_SERIES_PLAYERS.top),
    bottom: normalizePlayerName(players.bottom, DEFAULT_SERIES_PLAYERS.bottom)
  };
}

function createSeatColorsForSeriesGame(startingWhiteSeat = 'bottom', completedGames = 0) {
  const normalizedStartingSeat = startingWhiteSeat === 'top' ? 'top' : 'bottom';
  const whiteSeat = completedGames % 2 === 0
    ? normalizedStartingSeat
    : getOppositeSeat(normalizedStartingSeat);

  return whiteSeat === 'top'
    ? { top: 'w', bottom: 'b' }
    : { top: 'b', bottom: 'w' };
}

function createSeriesTimeSettings(baseTimeSettings, startingWhiteSeat, completedGames = 0) {
  return normalizeTimeSettings({
    ...baseTimeSettings,
    seatColors: createSeatColorsForSeriesGame(startingWhiteSeat, completedGames)
  });
}

function sanitizeStoredEvents(events = []) {
  return events
    .filter((event) => event && typeof event.type === 'string')
    .map(({ type, from, to, color, promotion }) => ({
      type,
      from,
      to,
      color,
      promotion
    }));
}

function normalizeSeriesHistory(historyEntries = []) {
  return historyEntries
    .map((entry, index) => {
      if (!entry || !Array.isArray(entry.events) || entry.events.length === 0) {
        return null;
      }

      const whiteSeat = entry.whiteSeat === 'top' ? 'top' : 'bottom';
      const blackSeat = getOppositeSeat(whiteSeat);

      return {
        gameNumber: Number.isInteger(entry.gameNumber) && entry.gameNumber > 0 ? entry.gameNumber : index + 1,
        result: typeof entry.result === 'string' ? entry.result : getResultToken(entry),
        status: typeof entry.status === 'string' ? entry.status : 'active',
        winner: entry.winner === 'white' || entry.winner === 'black' ? entry.winner : null,
        whiteSeat,
        blackSeat,
        whiteName: normalizePlayerName(entry.whiteName, DEFAULT_SERIES_PLAYERS[whiteSeat]),
        blackName: normalizePlayerName(entry.blackName, DEFAULT_SERIES_PLAYERS[blackSeat]),
        events: sanitizeStoredEvents(entry.events),
        boardThemeSettings: normalizeBoardThemeSettings(entry.boardThemeSettings ?? createDefaultBoardThemeSettings()),
        timerSettings: normalizeTimeSettings({
          ...entry.timerSettings,
          seatColors: whiteSeat === 'top'
            ? { top: 'w', bottom: 'b' }
            : { top: 'b', bottom: 'w' }
        })
      };
    })
    .filter(Boolean);
}

function createSeriesOptions(state, overrides = {}) {
  return {
    seriesPlayers: 'seriesPlayers' in overrides ? overrides.seriesPlayers : state.seriesPlayers,
    seriesHistory: 'seriesHistory' in overrides ? overrides.seriesHistory : state.seriesHistory,
    seriesStartingWhiteSeat: 'seriesStartingWhiteSeat' in overrides
      ? overrides.seriesStartingWhiteSeat
      : state.seriesStartingWhiteSeat,
    reviewGameNumber: 'reviewGameNumber' in overrides ? overrides.reviewGameNumber : state.reviewGameNumber
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

  const seriesPlayers = normalizeSeriesPlayers(options.seriesPlayers);
  const seriesHistory = normalizeSeriesHistory(options.seriesHistory);
  const seriesStartingWhiteSeat = options.seriesStartingWhiteSeat === 'top' ? 'top' : 'bottom';
  const reviewGameNumber = Number.isInteger(options.reviewGameNumber) && options.reviewGameNumber > 0
    ? options.reviewGameNumber
    : null;

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
    ui: createUiState(),
    seriesPlayers,
    seriesHistory,
    seriesStartingWhiteSeat,
    reviewGameNumber
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
    timerSettings: timedState.timerSettings,
    ...createSeriesOptions(timedState, { reviewGameNumber: null })
  });

  return archiveCompletedGameIfNeeded({
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
  });
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

function eventsMatch(left = [], right = []) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((event, index) => {
    const other = right[index];
    return (
      event?.type === other?.type &&
      event?.from === other?.from &&
      event?.to === other?.to &&
      event?.color === other?.color &&
      event?.promotion === other?.promotion
    );
  });
}

function createSeriesHistoryEntry(state, gameNumber = state.seriesHistory.length + 1) {
  const whiteSeat = getSeatForColor(state.timerSettings.seatColors, 'w') ?? 'bottom';
  const blackSeat = getOppositeSeat(whiteSeat);

  return {
    gameNumber,
    result: getResultToken(state),
    status: state.status,
    winner: state.winner,
    whiteSeat,
    blackSeat,
    whiteName: state.seriesPlayers[whiteSeat],
    blackName: state.seriesPlayers[blackSeat],
    events: exportEvents(state),
    boardThemeSettings: state.boardThemeSettings,
    timerSettings: state.timerSettings
  };
}

function archiveCompletedGameIfNeeded(state) {
  if (state.status === 'active') {
    return state;
  }

  const currentEvents = exportEvents(state);
  const existingEntry = state.seriesHistory.find((entry) => eventsMatch(entry.events, currentEvents));

  if (existingEntry) {
    return {
      ...state,
      reviewGameNumber: existingEntry.gameNumber
    };
  }

  const nextGameNumber = state.seriesHistory.length + 1;

  return {
    ...state,
    reviewGameNumber: nextGameNumber,
    seriesHistory: [
      ...state.seriesHistory,
      createSeriesHistoryEntry(state, nextGameNumber)
    ]
  };
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
      const timerSettings = createSeriesTimeSettings(
        state.timerSettings,
        state.seriesStartingWhiteSeat,
        state.seriesHistory.length
      );

      return rebuildGameState(
        [{ type: 'game.started' }],
        {
          boardThemeSettings: state.boardThemeSettings,
          timerSettings,
          timerState: createInitialClockState(timerSettings, 'w', 'active', now),
          now,
          ...createSeriesOptions(state, { reviewGameNumber: null })
        }
      );
    },
    newSeriesRequested(state, action) {
      const now = action.payload?.now;
      const seriesPlayers = normalizeSeriesPlayers(action.payload?.players);
      const seriesStartingWhiteSeat = action.payload?.startingWhiteSeat === 'top' ? 'top' : 'bottom';
      const timerSettings = createSeriesTimeSettings(state.timerSettings, seriesStartingWhiteSeat, 0);

      return rebuildGameState(
        [{ type: 'game.started' }],
        {
          boardThemeSettings: state.boardThemeSettings,
          timerSettings,
          timerState: createInitialClockState(timerSettings, 'w', 'active', now),
          now,
          seriesPlayers,
          seriesHistory: [],
          seriesStartingWhiteSeat,
          reviewGameNumber: null
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
        now,
        ...createSeriesOptions(state, { reviewGameNumber: null })
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

      return archiveCompletedGameIfNeeded(rebuildGameState([
        ...exportEvents(timedState),
        { type: 'game.resigned', color: timedState.turn }
      ], {
        boardThemeSettings: timedState.boardThemeSettings,
        timerSettings: timedState.timerSettings,
        timerState: timedState.timerState,
        now,
        ...createSeriesOptions(timedState, { reviewGameNumber: null })
      }));
    },
    hydrateRequested(_state, action) {
      const events = action.payload?.events;
      return archiveCompletedGameIfNeeded(rebuildGameState(events, {
        boardThemeSettings: action.payload?.boardThemeSettings,
        timerSettings: action.payload?.timerSettings,
        timerState: action.payload?.timerState,
        seriesPlayers: action.payload?.seriesPlayers,
        seriesHistory: action.payload?.seriesHistory,
        seriesStartingWhiteSeat: action.payload?.seriesStartingWhiteSeat,
        reviewGameNumber: action.payload?.reviewGameNumber
      }));
    },
    historyGameSelected(state, action) {
      const gameNumber = typeof action.payload === 'number' ? action.payload : action.payload?.gameNumber;
      const selectedGame = state.seriesHistory.find((entry) => entry.gameNumber === gameNumber);

      if (!selectedGame) {
        return state;
      }

      return rebuildGameState(selectedGame.events, {
        boardThemeSettings: selectedGame.boardThemeSettings,
        timerSettings: selectedGame.timerSettings,
        ...createSeriesOptions(state, { reviewGameNumber: selectedGame.gameNumber })
      });
    },
    boardThemeConfigured(state, action) {
      return {
        ...state,
        boardThemeSettings: normalizeBoardThemeSettings(action.payload)
      };
    },
    timeControlsConfigured(state, action) {
      const timeSettings = normalizeTimeSettings({
        ...action.payload,
        seatColors: state.timerSettings.seatColors
      });
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

      return archiveCompletedGameIfNeeded(applySynchronizedTimer(state, now));
    }
  }
});

export const gameActions = gameSlice.actions;
export const gameReducer = gameSlice.reducer;
export const storageVersion = STORAGE_VERSION;
