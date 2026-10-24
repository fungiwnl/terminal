const { test, expect } = require('@playwright/test');

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
  small: { width: 320, height: 640 },
};

for (const [name, viewport] of Object.entries(viewports)) {
  test.describe(name, () => {
    test.use({ viewport, timezoneId: 'Australia/Melbourne', locale: 'en-AU' });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.terminal-output')).toContainText("Type 'help'");
    });

    test('intro', async ({ page }) => {
      await expect(page).toHaveScreenshot(`${name}-intro.png`, { animations: 'disabled', caret: 'hide' });
    });

    test('weather', async ({ page }) => {
      await page.route('https://wttr.in/**', route => route.fulfill({
        json: {
          current_condition: [{ weatherDesc: [{ value: 'Light drizzle' }], temp_C: '18', FeelsLikeC: '18', precipMM: '0.4' }],
          nearest_area: [{ areaName: [{ value: 'Melbourne' }], region: [{ value: 'Victoria' }], country: [{ value: 'Australia' }] }],
        },
      }));
      await page.keyboard.press('Control+l');
      await page.keyboard.type('weather');
      await page.keyboard.press('Enter');
      await expect(page.locator('.terminal-output')).toContainText('rain');
      await expect(page).toHaveScreenshot(`${name}-weather.png`, { animations: 'disabled', caret: 'hide' });
    });

    test('date and cal', async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-10-24T20:20:12+11:00'));
      await page.reload();
      await expect(page.locator('.terminal-output')).toContainText("Type 'help'");
      await page.keyboard.press('Control+l');
      await page.keyboard.type('date');
      await page.keyboard.press('Enter');
      await page.keyboard.type('cal');
      await page.keyboard.press('Enter');
      await expect(page.locator('.terminal-output .cal')).toContainText('October 2026');
      await expect(page).toHaveScreenshot(`${name}-date-cal.png`, { animations: 'disabled', caret: 'hide' });
    });

    test('projects', async ({ page }) => {
      await page.keyboard.type('projects');
      await page.keyboard.press('Enter');
      await expect(page.locator('.terminal-output')).toContainText('Verizon Digital Kiosk');
      await expect(page).toHaveScreenshot(`${name}-projects.png`, { animations: 'disabled', caret: 'hide' });
    });
  });
}

test.describe('phone landscape', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

  test('rotate message', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.terminal-output')).toContainText("Type 'help'");
    await expect(page).toHaveScreenshot('phone-landscape-rotate.png', { animations: 'disabled', caret: 'hide' });
  });
});
