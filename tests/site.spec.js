const { test, expect } = require('@playwright/test');

async function run(page, command) {
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.terminal-output')).toContainText("Type 'help'");
});

test('help lists the commands', async ({ page }) => {
  await run(page, 'help');
  await expect(page.locator('.terminal-output')).toContainText('about, projects, cv, email, github, linkedin, weather, help');
});

for (const [command, text] of [
  ['about', 'Platform / DevOps Engineer'],
  ['projects', 'Kmart Australia'],
  ['cv', 'github.com/fungiwnl/cv'],
  ['email', 'brianf.iwnl@gmail.com'],
  ['github', 'github.com/fungiwnl'],
  ['linkedin', 'linkedin.com/in/fungiwnl'],
]) {
  test(`${command} prints its content`, async ({ page }) => {
    await run(page, command);
    await expect(page.locator('.terminal-output')).toContainText(text);
  });
}

test('weather shows the current conditions', async ({ page }) => {
  await page.route('https://wttr.in/**', route => route.fulfill({
    json: {
      current_condition: [{ weatherDesc: [{ value: 'Sunny' }], temp_C: '21', FeelsLikeC: '20', precipMM: '0.0' }],
      nearest_area: [{ areaName: [{ value: 'Melbourne' }], region: [{ value: 'Victoria' }], country: [{ value: 'Australia' }] }],
    },
  }));
  await run(page, 'weather');
  const output = page.locator('.terminal-output');
  await expect(output).toContainText('Melbourne, Victoria, Australia: Sunny, 21°C (feels like 20°C), 0.0mm');
  await expect(output).not.toContainText('Fetching weather');
  await expect(output).not.toContainText('<!DOCTYPE');
});

test('weather handles a failed request', async ({ page }) => {
  await page.route('https://wttr.in/**', route => route.fulfill({ status: 503 }));
  await run(page, 'weather');
  await expect(page.locator('.terminal-output')).toContainText('Weather is unavailable right now');
});

test('clear empties the output', async ({ page }) => {
  await run(page, 'help');
  await run(page, 'clear');
  await expect(page.locator('.terminal-output')).not.toContainText('Available commands');
});
