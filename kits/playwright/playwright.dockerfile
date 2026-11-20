# syntax=docker/dockerfile:1
# Overlay recipe for the playwright mixin: the Playwright package, its
# Chromium build and the library list, under /opt and /etc/profile.d (never the agent's home, which
# may be a mounted volume).
ARG BASE_IMAGE=docker/sandbox-templates:claude-code-docker
FROM ${BASE_IMAGE} AS build
ARG PLAYWRIGHT_VERSION
USER root
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright

# Chromium's system libraries: one list, shared with the install hook in playwright.yaml.
# Not `playwright install-deps`: on this Ubuntu it asks apt for distro chromium packages that do not exist.
COPY system-libs.txt /opt/playwright/system-libs.txt
RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive xargs -a /opt/playwright/system-libs.txt apt-get install -y --no-install-recommends; \
    rm -rf /var/lib/apt/lists/*

# Built in place, at the paths the sandbox will use, then copied out below.
RUN set -eux; \
    command -v pnpm >/dev/null || npm install -g pnpm; \
    mkdir -p /opt/playwright /out/usr/local/bin /out/etc/profile.d; \
    cd /opt/playwright; \
    pnpm init >/dev/null; \
    pnpm add "playwright@${PLAYWRIGHT_VERSION}"; \
    ./node_modules/.bin/playwright install chromium; \
    # World-writable: a project that pins another release downloads its browser here at runtime.
    chmod -R a+rwX /opt/ms-playwright; \
    ln -s /opt/playwright/node_modules/.bin/playwright /out/usr/local/bin/playwright; \
    printf 'export PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright\nexport NODE_PATH=/opt/playwright/node_modules${NODE_PATH:+:$NODE_PATH}\n' > /out/etc/profile.d/playwright-env.sh

# Fails the build, not a user's session, if Chromium cannot launch with that list
# of libraries: the build base is the image the kit lands on.
RUN cd /opt/playwright && node -e "\
const { chromium } = require('playwright');\
(async () => {\
  const browser = await chromium.launch({ args: ['--no-sandbox'] });\
  const page = await browser.newPage();\
  await page.setContent('<h1>ok</h1>');\
  if ((await page.textContent('h1')) !== 'ok') process.exit(1);\
  await browser.close();\
})().catch((error) => { console.error(error); process.exit(1); });"

FROM scratch
COPY --from=build /opt/playwright /opt/playwright
COPY --from=build /opt/ms-playwright /opt/ms-playwright
COPY --from=build /out /
