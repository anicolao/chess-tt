export const EXPORT_PLATFORMS = [
  {
    id: 'chess-com',
    label: 'Chess.com',
    buildUrl: (pgn) => `https://www.chess.com/analysis?pgn=${encodeURIComponent(pgn)}`
  },
  {
    id: 'lichess',
    label: 'Lichess',
    buildUrl: (pgn) => `https://lichess.org/paste?pgn=${encodeURIComponent(pgn)}`
  }
];

export function getResultToken({ status, winner } = {}) {
  if (winner === 'white') {
    return '1-0';
  }

  if (winner === 'black') {
    return '0-1';
  }

  if (status === 'stalemate' || status === 'draw') {
    return '1/2-1/2';
  }

  return '*';
}

export function buildMoveText(history = [], resultToken = '*') {
  const moveText = [];

  for (let moveIndex = 0; moveIndex < history.length; moveIndex += 2) {
    const whiteMove = history[moveIndex];
    const blackMove = history[moveIndex + 1];

    moveText.push(`${Math.floor(moveIndex / 2) + 1}. ${whiteMove.san}`);

    if (blackMove) {
      moveText.push(blackMove.san);
    }
  }

  moveText.push(resultToken);

  return moveText.join(' ').trim();
}

export function exportGameToPgn(gameState = {}) {
  return buildMoveText(gameState.history ?? [], getResultToken(gameState));
}

export function getExportPlatform(platformId) {
  return EXPORT_PLATFORMS.find(({ id }) => id === platformId) ?? null;
}

export function buildExportUrl(gameState, platformId) {
  const platform = getExportPlatform(platformId);

  if (!platform) {
    throw new Error(`Unsupported export platform: ${platformId}`);
  }

  return platform.buildUrl(exportGameToPgn(gameState));
}
