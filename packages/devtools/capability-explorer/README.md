<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Capability Explorer (Devtools)

This package contains the UI for the Capability Explorer, a devtools app that visualizes the component hierarchy and capability bindings at runtime.

## Status

- Scaffold stage. Depends on the Devtools Bridge provided by `packages/core/src/devtools/bridge.ts`.
- Initial transport is in-memory; future work may add WebSocket transport for external panels (e.g., VSCode).

## Getting Started

1. Enable the devtools bridge:
   - Set `SWISS_DEVTOOLS=1` in your environment, or set `globalThis.SWISS_DEVTOOLS = true` before app bootstrap.
2. Run your SwissJS app in dev mode.
3. The Capability Explorer will connect to the Devtools Bridge and render:
   - Component hierarchy (tree)
   - Capability providers/consumers per node
   - Basic conflict detection (consumer without provider)

## Data Model

The explorer consumes `GraphSnapshot` as defined by:

- `packages/devtools/schemas/capability-explorer.json`
- Types mirror the bridge types in `packages/core/src/devtools/bridge.ts`

## Next Steps

- Implement UI components to render the tree and capability badges.
- Add conflict list and basic filters.
- Add zoom/pan and search.
- Consider extracting a shared devtools transport for VSCode integration.
