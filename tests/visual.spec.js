const { test, expect } = require('@playwright/test');

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
  small: { width: 320, height: 640 },
};

for (const [name, viewport] of Object.entries(viewports)) {
  test.describe(name, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.terminal-output')).toContainText("Type 'help'");
    });

    test('intro', async ({ page }) => {
      await expect(page).toHaveScreenshot(`${name}-intro.png`, { animations: 'disabled', caret: 'hide' });
    });

    test('projects', async ({ page }) => {
      await page.keyboard.type('projects');
      await page.keyboard.press('Enter');
      await expect(page.locator('.terminal-output')).toContainText('Verizon Digital Kiosk');
      await expect(page).toHaveScreenshot(`${name}-projects.png`, { animations: 'disabled', caret: 'hide' });
    });
  });
}
