<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Metadata Handling (3.1.3)

Sources:
- Runtime: `packages/core/src/component/decorators.ts`
- Transformers: `packages/compiler/src/transformers/*`

Patterns:
- Reflect metadata keys and static class props carry component metadata.
- Class decorators are removed and re-emitted as calls after the class; method/property decorators become calls using `prototype` and descriptors.
- Capabilities are encoded as `static requires/provides` arrays on the class.

Runtime consumption:
- `applyDecoratorMetadata(component: SwissComponent)` wires lifecycle hooks, render method, plugin/service injections based on metadata and static fields.

Notes:
- Metadata is authoritative post-transform; runtime decorators remain for non-transformed/test paths but compiled output prefers emitted calls/static fields.
