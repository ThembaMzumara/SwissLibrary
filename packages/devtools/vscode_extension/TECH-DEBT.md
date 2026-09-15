<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# VSCode Extension Technical Debt

This document tracks known issues and follow-ups for the `vscode-swiss` extension.

## Activation and Language Associations
- The extension contributes a custom language `swissjs` and also associates `.ui` with `typescriptreact`.
- Action: unify activation to prevent duplicate registration and race conditions.
- Files: `package.json` (`activationEvents`, `contributes.languages`), `src/client/extension.ts` documentSelector.

## Client startup stability
- Intermittent “Client is not running … startFailed” observed in Runtime Status.
- Likely causes:
  - Incorrect server path (fixed to `server/dist/server.js`).
  - Document selector races when both TS/React and custom language attach.
  - Missing/incorrect environment when running in debug.
- Actions:
  - Add verbose lifecycle logging (activation, client start/stop, errors).
  - Retry-once policy on failed start.
  - Output channel for diagnostics.

## Server diagnostics and error surfacing
- Improve logging in `onInitialize`, `onInitialized`, and request handlers.
- Forward critical server errors to client output with actionable hints.

## Feature gating
- Ensure LSP features only attach for `**/*.ui` where intended.
- Avoid duplication with built-in TS/React providers.

## Testing
- Add client-side tests for activation and error handling.
- Add server unit tests for diagnostics/completions/formatting entrypoints.

## Packaging and maps
- Validate minimal file whitelist.
- Decide on source maps strategy for better diagnostics without bloating VSIX.

## Engines and debug
- Engines require Node 20.x; align local debug/run configurations.

## TypeDoc
- Ensure reflection builds consistently with package `tsconfig.json`.

## Observed Runtime Status Errors (from VS Code)
- Activation: "Activated by onLanguage:swissjs event: 18–20ms"
- Uncaught Errors (repeated):
  - "Client is not running and can't be stopped. It's current state is: starting"
  - "Client is not running and can't be stopped. It's current state is: startFailed"
  - "Pending response rejected since connection got disposed"

### Hypotheses
- Startup race or failure in language client initialization when both `swissjs` and `typescriptreact` are present.
- Server module resolution previously incorrect (addressed: now `server/dist/server.js`).
- Client attempts stop() on a client that failed to start → repeated error logs.

### Actions
- Add guarded stop() usage and a retry-once policy with backoff for client start.
- Log full startup lifecycle to an Output Channel (activation, path resolution, client start, server messages).
- Consider consolidating activation to a single language event to remove races.

## Tracking
- Mirror these items into the EPIC C issue checklist and reference this document.
