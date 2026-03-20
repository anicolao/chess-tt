import { test, expect } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('Scaffold Verification', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata(
    'Scaffold Verification',
    'Verify that the project scaffold is correctly serving a title page and is ready for development.'
  );

  await page.goto('/');

  await tester.step('initial-load', {
    description: 'Initial Scaffold Page',
    verifications: [
      {
        spec: 'Page contains scaffold text',
        check: async () => {
          await expect(page.locator('body')).toContainText('Chess Tabletop MVP Scaffold');
        }
      }
    ]
  });

  tester.generateDocs();
});
