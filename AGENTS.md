# Agent Guidelines for Chess Tabletop

This document provides essential guidelines for AI agents working on the Chess Tabletop codebase.

## Core Mandates & Prohibitions

1.  **No Timeouts > 2000ms**: You are strictly prohibited from using timeouts greater than 2000ms in any test, configuration, or application logic.
2.  **No `waitForTimeout`**: You are strictly prohibited from using `page.waitForTimeout()` or `page.waitFor()` in E2E tests. Use deterministic waits (e.g., `locator.waitFor()`, `expect().toBeVisible()`).
3.  **Redux & Event Sourcing**: All game and UI state must be managed via Redux. Game actions must be dispatched as events to a normalized state store.
4.  **Zero-Pixel Tolerance**: We enforce a strict visual regression policy. Any UI change must be verified with visual snapshots.
5.  **Design First**: Always ensure a design document (e.g., `MVP_DESIGN.md`) exists and is committed before starting implementation.
6.  **Continuous Prompt Recording**: You MUST record ALL user prompts and instructions verbatim on the Pull Request. Initial prompts go in the description; subsequent prompts must be added as PR comments for every push.

## Project Structure

*   `src/lib/game/`: Pure chess logic and rule validation (using `chess.js`).
*   `src/lib/redux/`: State management (Redux Toolkit) and Event Sourcing logic.
*   `src/lib/components/`: Svelte 5 components.
*   `tests/unit/`: Vitest unit tests for game logic and reducers.
*   `tests/e2e/`: Playwright E2E tests following the "Unified Step Pattern".
*   `docs/`: Design and architectural documentation.

## Development Environment

We use **Nix** to manage the development environment. The `flake.nix` file defines all necessary dependencies (Node.js, Playwright, etc.). Use `nix develop` to enter the environment.

## Important Documentation

Refer to these files to orient yourself:
*   `VISION.md`: High-level goals and target experience.
*   `WORKFLOW.md`: Detailed development and PR process.
*   `E2E_GUIDE.md`: Definitive guide for writing robust E2E tests.
*   `MVP_DESIGN.md`: Architecture and component breakdown for the MVP.
