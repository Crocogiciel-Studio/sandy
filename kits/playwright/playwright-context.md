## Playwright

`playwright` (CLI and Node library) and headless Chromium are installed. Chromium lives in
`/opt/ms-playwright`: do not unset or override `PLAYWRIGHT_BROWSERS_PATH`.

- Drive a browser from a script: `const { chromium } = require('playwright')` (resolved through `NODE_PATH`;
  a project with its own `node_modules` uses its local copy).
- Headless only: no display server, so `--headed`, `--ui` and `codegen` do not work. Screenshots,
  PDFs, traces and videos do.
- Launch Chromium with `args: ['--no-sandbox']`.
- Test a dev server on `localhost` (same sandbox): no network rule needed. Run `pnpm` for project dependencies.
- External HTTPS sites: the sandbox proxy's certificate authority is not trusted by Chromium, so pages fail with
  `ERR_CERT_AUTHORITY_INVALID`. Create the context with `ignoreHTTPSErrors: true`. The site's domain must also be
  allowed by the sandbox network policy (a 403 raises a banner in sandy).
- If a project pins another Playwright release, fetch its browser once with `playwright install chromium`.
- Only Chromium is installed.
