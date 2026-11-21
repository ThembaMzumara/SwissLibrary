<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Swiss Extension Architecture (MV3)

- **DevTools Panel**: `panel.html` + `src/panel.ts`. Renders the SwissJS panel in Chrome DevTools. Connects via `chrome.runtime.connect` to the background, scoped per inspected tab, and sends typed messages `{ source: 'swiss-devtools', direction: 'to-page' }`.
- **Background Service Worker**: `src/background.ts`. Acts as a router between the DevTools panel and the page/content script. Forwards messages and includes guards for safe routing per tab.
- **Content Script**: `src/content.ts`. Injects the page script and bridges messages between the page (window) and the extension background.
- **Injected Page Script**: `src/injected.ts`. Runs in the page context, talks to Swiss app runtime via `window.__SWISS_DEVTOOLS_BRIDGE__` and posts results back to the extension.

## Message Flow

1. Panel -> Background -> Content -> Page
2. Page -> Content -> Background -> Panel

Each message includes an explicit shape and direction to avoid leaks:

- `source: 'swiss-devtools'`
- `direction: 'to-page' | 'to-panel' | 'to-extension'`
- `type: string`
- Optional payload fields: `result`, `message`, custom keys

## Permissions & Security

- Minimal permissions: `"permissions": ["activeTab"]` and `"host_permissions": ["https://*/*", "http://*/*"]`.
- Content script and web accessible resources restricted to http/https only.
- Type guards on all cross-context messages.
- No direct Node/browser globals are assumed; Chrome APIs are referenced defensively.

## Build Outputs

- Built via Vite multiple entry points to `dist/`:
  - `background.js` (service worker)
  - `content.js` (content script)
  - `injected.js` (page script)
  - `panel.js` and `panel.html`
  - `devtools.html` (declares the panel)

## Packaging

- Zip command: `pnpm -F @swissjs/swiss-extension build && pnpm -F @swissjs/swiss-extension zip`.
- Artifact name: `swiss-extension.zip`.

## Integration with Swiss Apps

- Swiss apps expose an optional page-bridge: `window.__SWISS_DEVTOOLS_BRIDGE__` with minimal methods like `ping()` and `getPlugins()`.
- The injected script checks for this bridge and posts results back with `direction: 'to-panel'`.
