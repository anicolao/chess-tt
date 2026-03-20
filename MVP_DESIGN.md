# MVP Design: Chess Tabletop

## Objective

Deliver a functional chess game that supports two-player local play on a single touchscreen table.

## Architecture

- **Framework**: SvelteKit (Svelte 5) for component-based UI.
- **State Management**: Redux combined with Event Sourcing for robust game and UI state tracking. Game actions are dispatched as events to update a normalized state store.
- **Game Logic**: Integration with `chess.js` for rule validation and move generation.
- **Rendering**: A responsive, touch-friendly board using HTML/CSS/SVG.
- **Persistence**: Local storage for game state recovery (if the app is closed/reloaded).

## Component Breakdown

1.  **Board**: The main grid container.
2.  **Square**: Individual square on the board, handling drop events.
3.  **Piece**: Visual representation of a chess piece, handling drag events.
4.  **GameInfo**: UI showing current turn and captured pieces, oriented for each player.
5.  **Controls**: Minimal buttons for New Game, Undo, and Resign.

## MVP Features

- Full implementation of FIDE chess rules via `chess.js`.
- Local multiplayer support on a single device.
- Move highlighting (valid moves for a selected piece).
- Checkmate and stalemate detection.
- Simple, high-contrast visual style optimized for large screens.

## Future Considerations

- Clock integration (inspired by `chess-clock`).
- AI opponent for single-player play.
- Match history and analysis.
- Theming and customization.
