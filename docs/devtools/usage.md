<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Swiss Extension Usage

- **Prerequisite**: Build the extension once or run dev mode.

## Load Unpacked (Chromium)

1. Build: `pnpm -F @swissjs/swiss-extension build`
2. In Chrome, open `chrome://extensions`.
3. Enable Developer mode.
4. Click "Load unpacked" and select `packages/devtools/swiss_extension/dist/`.
5. Open your Swiss app, open DevTools, select the "SwissJS" panel.

## Zip Package

- Build + Zip:
  - `pnpm -F @swissjs/swiss-extension build`
  - `pnpm -F @swissjs/swiss-extension zip`
- Output: `packages/devtools/swiss_extension/swiss-extension.zip`

## Development Mode

- `pnpm -F @swissjs/swiss-extension dev`
- Reload the extension in `chrome://extensions` after rebuilds.

## Message Bridge Requirements

- Your Swiss app can optionally expose `window.__SWISS_DEVTOOLS_BRIDGE__`:
  - `ping(): Promise<string | boolean>`
  - `getPlugins(): Promise<Array<{ name: string }>>`
- The injected script checks for the bridge and posts results back to the panel.

## Troubleshooting

- If the panel is empty, confirm the content script is allowed on the site and the extension is enabled.
- Check the DevTools console of the "SwissJS" panel for errors.
- Ensure the app is a SwissJS app and exposes the bridge (or expect limited functionality).
