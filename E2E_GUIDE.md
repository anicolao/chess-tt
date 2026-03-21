# E2E Testing Guide: Chess Tabletop

This document is the **definitive guide** for writing End-to-End (E2E) tests for Chess Tabletop. It is designed to ensure robust, deterministic, and self-documenting tests.

## 1. The Philosophy: "Zero-Pixel Tolerance"

In a tabletop game, visual state is the primary feedback mechanism. If a piece is slightly misaligned, it's a bug.

- **Determinism**: Tests must be 100% deterministic. No random seeds allowed in tests.
- **Visual Snapshots**: Every test step must capture a visual snapshot (screenshot) to verify layout and rendering.
- **Unified Step Pattern**: Documentation, verification, and screenshot capturing are handled by a single atomic `step()` call to prevent synchronization errors.

## 2. Prohibitions & Hard Requirements

1. **No Timeouts > 2000ms**: The maximum acceptable timeout for any condition is **2000ms**.
2. **No `waitForTimeout`**: You are strictly prohibited from using `page.waitForTimeout()` or `page.waitFor()`.
3. **No Animations**: Use the `waitForAnimations` utility to ensure all CSS animations/transitions are finished before capturing a snapshot.
4. **Resilient Locators**: Use user-facing attributes (labels, roles, text) rather than fragile CSS classes.

## 3. The "Unified Step Pattern"

We use a helper class `TestStepHelper` to manage atomic test steps. You must **NEVER** manually manage screenshot filenames or counters.

### Directory Convention
Tests are organized by scenario in numbered folders within `tests/e2e/`.

```
tests/e2e/
├── helpers/                   # Shared utilities (TestStepHelper)
├── 001-initial-setup/         # Scenario Directory
│   ├── 001-initial-setup.spec.ts # Main test file
│   ├── README.md              # Auto-generated verification doc
│   └── screenshots/           # Committed baseline images
│       ├── 000-board-empty.png
│       └── 001-piece-moved.png
```

The generated `README.md` and every screenshot under `screenshots/` are part of the committed test artifact set. If you add a new scenario or change an existing scenario's visible behavior, you must regenerate those files and commit them with the test change so reviewers can validate the flow from the repository alone.

### Basic Usage

```typescript
import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('Board renders correctly', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata('Initial Board Rendering', 'As a player, I want to see the starting position.');

  await page.goto('/');

  await tester.step('initial-load', {
    description: 'Starting Chess Position',
    verifications: [
      { spec: 'Board is visible', check: async () => await expect(page.locator('.chess-board')).toBeVisible() },
      { spec: 'White player to move', check: async () => await expect(page.locator('.turn-indicator')).toHaveText('White to move') }
    ]
  });

  tester.generateDocs();
});
```

## 4. TestStepHelper Implementation

The `TestStepHelper` must automatically:
1. **Auto-Name**: Generate names like `000-initial-load.png`.
2. **Wait for Animations**: Call `waitForAnimations(page)` before taking a screenshot.
3. **Run Verifications**: Execute all checks and fail the test if any fail.
4. **Generate README**: Append the step results to the scenario's documentation.

After running the scenario, commit the regenerated `README.md` and screenshot outputs for that scenario instead of reverting them locally.

## 5. Handling Dynamic Content

For tests involving non-deterministic state (e.g., timestamps), you must mock or stabilize the values before taking snapshots to maintain Zero-Pixel Tolerance.
