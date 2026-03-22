import { describe, expect, test } from 'vitest';
import { getBoardRows, getCheckedKingSquare } from '../../src/lib/game/chess-game.js';
import { rebuildGameState } from '../../src/lib/redux/game-slice.js';

describe('chess board row derivation', () => {
  test('marks the checked king square after a checking move', () => {
    const state = rebuildGameState([
      { type: 'game.started' },
      { type: 'move.played', from: 'e2', to: 'e4' },
      { type: 'move.played', from: 'f7', to: 'f6' },
      { type: 'move.played', from: 'd1', to: 'h5' }
    ]);
    const checkedKingSquare = getCheckedKingSquare(state.currentFen);
    const boardSquares = getBoardRows(state.currentFen, state.ui, state.lastMove, checkedKingSquare).flat();

    expect(state.message).toBe('Black to move · Check');
    expect(checkedKingSquare).toBe('e8');
    expect(boardSquares.find((square) => square.square === 'e8')).toMatchObject({
      isCheckedKing: true,
      isLastMove: false
    });
    expect(boardSquares.find((square) => square.square === 'h5')).toMatchObject({
      isCheckedKing: false,
      isLastMove: true
    });
  });
});
