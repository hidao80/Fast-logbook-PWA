import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/config.html', name: 'config' },
];

test.describe('Full-Page Screenshot Tests', () => {
  for (const pageInfo of PAGES) {
    test(`capture ${pageInfo.name}`, async ({ page }, testInfo) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Example filenames: homepage-mobile.png / config-tablet.png / homepage-fhd.png
      await page.screenshot({
        path: `screenshots/${pageInfo.name}-${testInfo.project.name}.png`,
        fullPage: true,
      });

      await expect(page).toHaveTitle(/.+/);
    });
  }
});
