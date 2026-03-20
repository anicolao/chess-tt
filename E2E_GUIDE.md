# E2E Testing Guide

This project strictly adheres to rigorous End-to-End (E2E) testing standards. All new features and bug fixes must include corresponding E2E tests written with Playwright.

## Hard Requirements

1. **No Timeouts Greater Than 2000ms**: You are strictly prohibited from using timeouts greater than 2000ms in any test or Playwright configuration.
2. **No `waitForTimeout`**: You are strictly prohibited from using `page.waitForTimeout()` or `page.waitFor()`. Tests must be deterministic and wait for state or UI assertions (e.g., `locator.waitFor()`, `expect(locator).toBeVisible()`).
3. **Structured Tests**: Tests should follow a clean "Arrange, Act, Assert" structure and use Playwright's declarative locators.
4. **Resilience**: Avoid relying on implementation details (like exact CSS classes) when possible. Use user-facing attributes (aria-labels, roles, text).

## Running Tests

- Development: `npm run test:e2e`
- The full test suite runs automatically on `git push` via Husky hooks.
