# Chess Tabletop

A simple, touch-optimized chess game for large touchscreen tables. Built with SvelteKit and designed to be run as a PWA.

## Features

- **Tabletop Optimized**: Designed for two players physically opposite each other.
- **Touch-Friendly**: Large pieces and smooth drag-and-drop interactions.
- **PWA Ready**: Can be installed and played offline.

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- **Styling**: Vanilla CSS
- **Testing**: [Playwright](https://playwright.dev/) for E2E
- **Build Tool**: [Vite](https://vitejs.dev/)

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone ...
    cd chess-tt
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run in development mode**:
    ```bash
    npm run dev
    ```
4.  **Build for production**:
    ```bash
    npm run build
    ```

## Development Workflow

This project follows a strict development workflow as outlined in [WORKFLOW.md](./WORKFLOW.md).

## Testing

Run E2E tests with Playwright:
```bash
npm run test:e2e
```
