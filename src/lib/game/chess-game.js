import { Chess } from 'chess.js';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const PIECE_NAMES = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king'
};

const PIECE_SYMBOLS = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};

const TURN_NAMES = {
  w: 'White',
  b: 'Black'
};

export function createChess(fen) {
  return fen ? new Chess(fen) : new Chess();
}

export function pieceName(piece) {
  if (!piece) {
    return 'empty square';
  }

  return `${TURN_NAMES[piece.color]} ${PIECE_NAMES[piece.type]}`;
}

export function pieceSymbol(piece) {
  if (!piece) {
    return '';
  }

  return PIECE_SYMBOLS[piece.color][piece.type];
}

/**
 * Returns the square of the side-to-move king when that king is in check, or null otherwise.
 */
export function getCheckedKingSquare(fen) {
  const chess = createChess(fen);
  if (!chess.inCheck()) {
    return null;
  }

  const checkedColor = chess.turn();

  for (const rank of RANKS) {
    for (const file of FILES) {
      const square = `${file}${rank}`;
      const piece = chess.get(square);

      if (piece?.type === 'k' && piece.color === checkedColor) {
        return square;
      }
    }
  }

  return null;
}

export function getBoardRows(fen, ui = {}, lastMove = null, checkedKingSquare = null) {
  const chess = createChess(fen);
  const selectedSquare = ui.selectedSquare;
  const highlightedSquares = ui.highlightedSquares ?? [];
  const resolvedCheckedKingSquare = checkedKingSquare ?? getCheckedKingSquare(fen);

  return RANKS.map((rank) =>
    FILES.map((file, fileIndex) => {
      const square = `${file}${rank}`;
      const piece = chess.get(square);
      const isLight = (fileIndex + rank) % 2 === 1;

      return {
        square,
        file,
        rank,
        piece,
        symbol: pieceSymbol(piece),
        pieceLabel: pieceName(piece),
        ariaLabel: piece ? `${square}, ${pieceName(piece)}` : `${square}, empty square`,
        isLight,
        isSelected: selectedSquare === square,
        isHighlighted: highlightedSquares.includes(square),
        isLastMove: Boolean(lastMove && (lastMove.from === square || lastMove.to === square)),
        isCheckedKing: resolvedCheckedKingSquare === square
      };
    })
  );
}

export function getTurnName(turn) {
  return TURN_NAMES[turn] ?? 'Unknown';
}
