# terminal

My portfolio site, as an interactive terminal in the browser. Built with [jQuery Terminal](https://terminal.jcubic.pl/).

Live: https://fungiwnl.github.io/terminal/

## Commands

| Command     | What it does                |
| ----------- | --------------------------- |
| `help`      | List the commands           |
| `about`     | Who I am                    |
| `projects`  | Things I've worked on       |
| `cv`        | My CV/resume                |
| `email`     | Get in touch                |
| `github`    | My GitHub profile           |
| `linkedin`  | My LinkedIn profile         |
| `ozbargain` | Latest OzBargain deals      |
| `weather`   | Weather where you are       |
| `date`      | Current date and time       |
| `cal`       | This month's calendar       |
| `clear`     | Clear the terminal          |

Shortcuts: `ctrl+l` clears the terminal, `ctrl+c` cancels the command.

## Structure

```
src/      index.html and style.css
assets/   images (favicon)
tests/    Playwright functional and visual tests
```

## Run locally

```sh
npm start
```

Builds the site into `_site/` and serves it on http://localhost:8080. Needs Python 3.

## Tests

```sh
npm install
npx playwright install chromium
npm test
```

`npm run test:update` refreshes the visual snapshots. They're rendered on macOS, so run it there. The pre-push hook runs `npm test`.

## Deploy

Pushing to `main` runs the GitHub Actions workflow, which builds `_site/` and publishes it to GitHub Pages.

## License

MIT
