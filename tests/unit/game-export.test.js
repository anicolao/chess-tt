import { describe, expect, test } from 'vitest';
import { buildExportUrl, exportGameToPgn } from '../../src/lib/game/game-export.js';
import { rebuildGameState } from '../../src/lib/redux/game-slice.js';

describe('game export helpers', () => {
  test('serializes move history into compact PGN movetext with result', () => {
    const state = rebuildGameState([
      { type: 'game.started' },
      { type: 'move.played', from: 'f2', to: 'f3' },
      { type: 'move.played', from: 'e7', to: 'e5' },
      { type: 'move.played', from: 'g2', to: 'g4' },
      { type: 'move.played', from: 'd8', to: 'h4' }
    ]);

    expect(exportGameToPgn(state)).toBe('1. f3 e5 2. g4 Qh4# 0-1');
  });

  test('builds platform-specific export URLs from the current game', () => {
    const state = rebuildGameState([
      { type: 'game.started' },
      { type: 'move.played', from: 'e2', to: 'e4' },
      { type: 'move.played', from: 'e7', to: 'e5' }
    ]);

    expect(buildExportUrl(state, 'chess-com')).toBe(
      'https://www.chess.com/analysis?pgn=1.%20e4%20e5%20*'
    );
    expect(buildExportUrl(state, 'lichess')).toBe(
      'https://lichess.org/paste?pgn=1.%20e4%20e5%20*'
    );
  });
});
