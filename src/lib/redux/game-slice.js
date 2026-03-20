import { createSlice } from '@reduxjs/toolkit';
import { createChess, getTurnName, pieceSymbol } from '$lib/game/chess-game';

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

export function rebuildGameState(events = []) {
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

  return {
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
    ui: createUiState()
  };
}

function setSelection(state, square) {
  const chess = createChess(state.currentFen);
  const piece = chess.get(square);

  if (!piece || piece.color !== state.turn || state.status !== 'active') {
    state.ui.selectedSquare = null;
    state.ui.highlightedSquares = [];
    return state;
  }

  state.ui.selectedSquare = square;
  state.ui.highlightedSquares = chess.moves({ square, verbose: true }).map((move) => move.to);
  return state;
}

function clearInteractionState(state) {
  state.ui.selectedSquare = null;
  state.ui.highlightedSquares = [];
  state.ui.draggedSquare = null;
  return state;
}

function createMoveState(state, from, to) {
  const moveEvent = createMoveEvent(state.currentFen, from, to);

  if (!moveEvent) {
    return state;
  }

  const next = rebuildGameState([
    ...state.events.map(({ type, from: eventFrom, to: eventTo, color, promotion }) => ({
      type,
      from: eventFrom,
      to: eventTo,
      color,
      promotion
    })),
    moveEvent
  ]);

  return next;
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
      const square = action.payload;

      if (typeof square !== 'string') {
        return state;
      }

      if (state.status !== 'active') {
        return clearInteractionState(state);
      }

      if (state.ui.selectedSquare === square) {
        return clearInteractionState(state);
      }

      if (state.ui.selectedSquare && state.ui.highlightedSquares.includes(square)) {
        return createMoveState(state, state.ui.selectedSquare, square);
      }

      return setSelection(state, square);
    },
    dragStarted(state, action) {
      const square = action.payload;
      state.ui.draggedSquare = square;
      return setSelection(state, square);
    },
    dragEnded(state) {
      state.ui.draggedSquare = null;
    },
    moveDropped(state, action) {
      const { from, to } = action.payload ?? {};

      if (typeof from !== 'string' || typeof to !== 'string' || state.status !== 'active') {
        return state;
      }

      const chess = createChess(state.currentFen);
      const validTargets = chess.moves({ square: from, verbose: true }).map((move) => move.to);

      if (!validTargets.includes(to)) {
        clearInteractionState(state);
        return state;
      }

      return createMoveState(state, from, to);
    },
    newGameRequested() {
      return rebuildGameState([{ type: 'game.started' }]);
    },
    undoRequested(state) {
      const events = exportEvents(state).filter((event, index) => index > 0);

      if (events.length === 0) {
        return state;
      }

      const nextEvents = [{ type: 'game.started' }, ...events.slice(0, -1)];
      return rebuildGameState(nextEvents);
    },
    resignRequested(state) {
      if (state.status !== 'active') {
        return state;
      }

      return rebuildGameState([
        ...exportEvents(state),
        { type: 'game.resigned', color: state.turn }
      ]);
    },
    hydrateRequested(_state, action) {
      const events = action.payload?.events;
      return rebuildGameState(events);
    }
  }
});

export const gameActions = gameSlice.actions;
export const gameReducer = gameSlice.reducer;
export const storageVersion = STORAGE_VERSION;
