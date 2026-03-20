import { Page, TestInfo, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface Verification {
  spec: string;
  check: () => Promise<void>;
}

interface StepOptions {
  description: string;
  verifications: Verification[];
}

interface DocStep {
  title: string;
  image: string;
  specs: string[];
}

export async function waitForAnimations(page: Page) {
  await page.evaluate(() => {
    return Promise.all(
      document.getAnimations().map(animation => animation.finished)
    );
  });
}

export class TestStepHelper {
  private stepCount = 0;
  private steps: DocStep[] = [];
  private metadataTitle = '';
  private metadataDescription = '';

  constructor(private page: Page, private testInfo: TestInfo) {}

  setMetadata(title: string, description: string) {
    this.metadataTitle = title;
    this.metadataDescription = description;
  }

  async step(id: string, options: StepOptions) {
    // 1. Run Verification
    for (const v of options.verifications) {
      await v.check();
    }

    // 2. Generate Name
    const paddedIndex = String(this.stepCount++).padStart(3, '0');
    const filename = `${paddedIndex}-${id}.png`;

    // 3. Determine Paths
    const testDir = path.dirname(this.testInfo.file);
    const screenshotDir = path.join(testDir, 'screenshots');
    
    // 4. Ensure directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, filename);

    // 5. Capture
    await waitForAnimations(this.page);
    await this.page.screenshot({ path: screenshotPath });

    // 6. Record for Docs
    this.steps.push({
      title: options.description,
      image: filename,
      specs: options.verifications.map(v => v.spec)
    });
  }

  generateDocs() {
    const testDir = path.dirname(this.testInfo.file);
    const readmePath = path.join(testDir, 'README.md');

    let markdown = `# ${this.metadataTitle}\n\n${this.metadataDescription}\n\n`;
    for (const step of this.steps) {
      markdown += `## ${step.title}\n\n`;
      markdown += `![${step.title}](./screenshots/${step.image})\n\n`;
      markdown += `### Verifications\n`;
      for (const spec of step.specs) {
        markdown += `- [x] ${spec}\n`;
      }
      markdown += `\n`;
    }
    
    fs.writeFileSync(readmePath, markdown);
    console.log(`Test Documentation Generated: ${readmePath}`);
  }
}
