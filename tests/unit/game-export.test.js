import { describe, expect, test } from 'vitest';
import { buildExportUrl, buildMoveText, exportGameToPgn } from '../../src/lib/game/game-export.js';
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

  test('normalizes long movetext whitespace so export URLs stay on one line', () => {
    const history = [
      { san: 'e4' },
      { san: 'e5' },
      { san: 'Nf3' },
      { san: 'Nc6' },
      { san: 'Bb5' },
      { san: 'a6' },
      { san: 'Ba4' },
      { san: 'Nf6' },
      { san: 'O-O' },
      { san: 'Be7' },
      { san: 'Re1' },
      { san: 'b5' },
      { san: 'Bb3' },
      { san: 'd6' },
      { san: 'c3' },
      { san: 'O-O' },
      { san: 'h3' },
      { san: 'Nb8' },
      { san: 'd4' },
      { san: 'Nbd7\n' },
      { san: '\nc4' },
      { san: 'c6\t' },
      { san: 'cxb5' },
      { san: '\taxb5' }
    ];

    expect(buildMoveText(history, '1/2-1/2')).toBe(
      '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 1/2-1/2'
    );

    const chessComUrl = buildExportUrl({ history, status: 'draw' }, 'chess-com');

    expect(chessComUrl).toBe(
      'https://www.chess.com/analysis?pgn=1.%20e4%20e5%202.%20Nf3%20Nc6%203.%20Bb5%20a6%204.%20Ba4%20Nf6%205.%20O-O%20Be7%206.%20Re1%20b5%207.%20Bb3%20d6%208.%20c3%20O-O%209.%20h3%20Nb8%2010.%20d4%20Nbd7%2011.%20c4%20c6%2012.%20cxb5%20axb5%201%2F2-1%2F2'
    );
    expect(chessComUrl).not.toContain('%0A');
    expect(chessComUrl).not.toContain('%0D');
  });
});
