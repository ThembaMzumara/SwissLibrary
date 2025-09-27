<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Transformation Patterns (3.1.4)

- Class decorators → append call: `decorator(args)(ClassName)`; remove decorator nodes.
- Method decorators → call with descriptor: `decorator(args)(ClassName.prototype, 'name', descriptor)`.
- Property decorators → call without descriptor: `decorator(args)(ClassName.prototype, 'prop')`.
- Getter (`@computed`) → method-like with descriptor validation.
- Capabilities → `static requires/provides = [ ... ]` placed after class.

Validation & diagnostics (examples):
- Lifecycle transformer validates placement (methods/properties/getters) and names; emits clear diagnostics when invalid.
- Identifier resolution for capabilities resolves string literals and local identifiers via `utils.resolveIdentifierValue()`.

Emitted imports & helpers:
- Compiler injects `createElement`/`Fragment` import when needed to support template/codegen flows.
