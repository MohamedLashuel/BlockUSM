// Playwright's code generation doesn't support extensions by default.
// For generating tests, run this file instead.

import { chromium } from '@playwright/test';

(async () => {
  const pathToExtension = "~/Coding/BlockUSM";
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    channel: "chromium",
    viewport: {width: 600, height: 500},
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  // Pause the page, and start recording manually.
  const page = await context.newPage();
  await page.pause();
})();