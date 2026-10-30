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
  await expect(page.locator('.terminal-output')).toContainText('Available commands');
});

for (const [command, text] of [
  ['about', 'Platform / DevOps Engineer'],
  ['projects', 'Kmart Australia'],
  ['cv', 'github.com/fungiwnl/cv'],
  ['email', 'brianf.iwnl@gmail.com'],
  ['github', 'github.com/fungiwnl'],
  ['linkedin', 'linkedin.com/in/fungiwnl'],
  ['ozbargain', 'ozbargain.com.au/deals'],
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
  await expect(output).toContainText('Melbourne, Victoria, Australia');
  await expect(output).toContainText('Sunny');
  await expect(output).toContainText('21°C, feels like 20°C');
  await expect(output).toContainText('0.0mm rain');
  await expect(output).not.toContainText('Fetching weather');
  await expect(output).not.toContainText('<!DOCTYPE');
});

test('weather handles a failed request', async ({ page }) => {
  await page.route('https://wttr.in/**', route => route.fulfill({ status: 503 }));
  await run(page, 'weather');
  await expect(page.locator('.terminal-output')).toContainText('Weather is unavailable right now');
});

test('unknown commands follow the zsh message', async ({ page }) => {
  await run(page, 'fdsfdf');
  const message = page.locator('.terminal-output span', { hasText: 'zsh: command not found: fdsfdf' }).last();
  await expect(message).toHaveCSS('color', 'rgb(243, 139, 168)');
});

test('unknown command message names only the command, as typed', async ({ page }) => {
  await run(page, 'foo bar baz');
  await run(page, '[[;red;]x]');
  const output = page.locator('.terminal-output');
  await expect(output).toContainText('zsh: command not found: foo');
  await expect(output).not.toContainText('zsh: command not found: foo bar');
  await expect(output).toContainText('zsh: command not found: [[;red;]x]');
});

test('blank input prints nothing', async ({ page }) => {
  await run(page, '   ');
  await expect(page.locator('.terminal-output')).not.toContainText('command not found');
});

test('clear empties the output', async ({ page }) => {
  await run(page, 'help');
  await run(page, 'clear');
  await expect(page.locator('.terminal-output')).not.toContainText('Available commands');
});

test('prompt stays inside the pane after clearing', async ({ page }) => {
  for (const command of ['projects', 'help', 'email']) {
    await run(page, command);
  }
  await page.keyboard.press('Control+l');
  await expect.poll(() => page.evaluate(() => document.scrollingElement.scrollTop)).toBe(0);
  const paneTop = await page.locator('.pane').evaluate(el => el.getBoundingClientRect().top);
  const promptTop = await page.locator('.cmd').evaluate(el => el.getBoundingClientRect().top);
  expect(promptTop).toBeGreaterThan(paneTop);
});

test.describe('weather on a small phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('wraps a long place name between words', async ({ page }) => {
    const place = ['Llanfairpwllgwyngyll', 'Isle of Anglesey', 'United Kingdom of Great Britain'];
    await page.route('https://wttr.in/**', route => route.fulfill({
      json: {
        current_condition: [{ weatherDesc: [{ value: 'Patchy light rain with thunder' }], temp_C: '9', FeelsLikeC: '6', precipMM: '1.2' }],
        nearest_area: [{ areaName: [{ value: place[0] }], region: [{ value: place[1] }], country: [{ value: place[2] }] }],
      },
    }));
    await run(page, 'weather');
    await expect(page.locator('.terminal-output')).toContainText('rain');

    const lines = await page.locator('.terminal-output div[data-index]').last().locator(':scope > div').allInnerTexts();
    const words = place.join(' ').split(' ').concat('Patchy light rain with thunder'.split(' '));
    for (const word of words) {
      expect(lines.some(line => line.includes(word)), `"${word}" split across lines`).toBe(true);
    }
  });
});

test.describe('date and cal', () => {
  test.use({ timezoneId: 'Australia/Melbourne', locale: 'en-AU' });

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-24T20:20:12+11:00'));
    await page.reload();
    await expect(page.locator('.terminal-output')).toContainText("Type 'help'");
  });

  test('date prints like zsh', async ({ page }) => {
    await run(page, 'date');
    await expect(page.locator('.terminal-output')).toContainText('Sat 24 Oct 2026 20:20:12 AEDT');
  });

  for (const width of [1280, 320]) {
    test(`cal lines up as a grid at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 640 });
      await run(page, 'cal');
      const cal = page.locator('.terminal-output .cal');
      const rows = await cal.locator(':scope > div').allInnerTexts();
      expect(rows.map(r => r.replace(/ /g, ' ').trimEnd())).toEqual([
        '    October 2026',
        'Su Mo Tu We Th Fr Sa',
        '             1  2  3',
        ' 4  5  6  7  8  9 10',
        '11 12 13 14 15 16 17',
        '18 19 20 21 22 23 24',
        '25 26 27 28 29 30 31',
      ]);
      const today = cal.locator('span[data-text="24"]');
      await expect(today).toHaveCSS('background-color', 'rgb(205, 214, 244)');

      // 24 sits directly under Sa
      const saLeft = await cal.locator(':scope > div').nth(1).evaluate(row => {
        const text = [...row.querySelectorAll('*')].map(el => el.firstChild)
          .find(node => node?.nodeType === Node.TEXT_NODE && node.data.includes('Sa'));
        const range = document.createRange();
        range.setStart(text, text.data.indexOf('Sa'));
        range.setEnd(text, text.data.indexOf('Sa') + 2);
        return range.getBoundingClientRect().left;
      });
      const todayLeft = (await today.boundingBox()).x;
      expect(Math.abs(todayLeft - saLeft)).toBeLessThan(1);
    });
  }

  test('help lists date and cal', async ({ page }) => {
    await run(page, 'help');
    const output = page.locator('.terminal-output');
    await expect(output).toContainText('Current date and time');
    await expect(output).toContainText("This month's calendar");
  });
});
