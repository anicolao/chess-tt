# Chess Tabletop

A touch-friendly local multiplayer chess MVP for large touchscreen tables.

## MVP Features

- **Tabletop-first layout** with mirrored player information panels for opposite sides of the table
- **Full chess rules** powered by `chess.js`, including legal move generation and checkmate/stalemate detection
- **Redux event log** for game state, undo, and deterministic replay of completed positions
- **Move highlighting** for selected pieces and clear turn-state messaging
- **Persistent recovery** from `localStorage` after a reload
- **Focused automated coverage** with Vitest reducer tests and Playwright screenshot-driven E2E scenarios

## Tech Stack

- **Framework**: SvelteKit + Svelte 5
- **State Management**: Redux Toolkit with event replay
- **Game Logic**: `chess.js`
- **Testing**: Vitest + Playwright
- **Build Tool**: Vite / `@sveltejs/adapter-static`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Build the static production app:
   ```bash
   npm run build
   ```

## Testing

- Unit tests:
  ```bash
  npm test
  ```
- End-to-end tests:
  ```bash
  npm run test:e2e
  ```

## Development Workflow

This project follows the repository process documented in [WORKFLOW.md](./WORKFLOW.md), with the MVP scope defined in [MVP_DESIGN.md](./MVP_DESIGN.md).
