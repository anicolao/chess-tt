import { Page, TestInfo, expect } from '@playwright/test';

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
    for (const v of options.verifications) {
      await v.check();
    }

    const paddedIndex = String(this.stepCount++).padStart(3, '0');
    const filename = `${paddedIndex}-${id}.png`;

    await waitForAnimations(this.page);
    await this.page.screenshot({ path: this.testInfo.outputPath(filename) });

    this.steps.push({
      title: options.description,
      image: filename,
      specs: options.verifications.map(v => v.spec)
    });
  }

  generateDocs() {
    let markdown = `# ${this.metadataTitle}\n\n${this.metadataDescription}\n\n`;
    for (const step of this.steps) {
      markdown += `## ${step.title}\n\n`;
      markdown += `![${step.title}](${step.image})\n\n`;
      markdown += `### Verifications\n`;
      for (const spec of step.specs) {
        markdown += `- [x] ${spec}\n`;
      }
      markdown += `\n`;
    }
    console.log('Test Documentation Generated');
  }
}
