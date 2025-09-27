<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Fenestration Overview (Aug 11)

Sources:
- `packages/core/src/fenestration/` (registry, API, security policies)
- `packages/core/src/security/*` (capability checks)
- `packages/core/src/component/*` (component hierarchy and context)

## What is Fenestration?
Fenestration is SwissJS’s pattern for securely "piercing" architectural layers to access capabilities across boundaries without manual prop/context drilling. It provides:
- A registry of capabilities/services with controlled access points.
- Policy hooks for validation and auditing.
- Minimal coupling between caller and callee.

## Core Concepts
- Registry: central index of capability endpoints and providers.
- Piercing: `pierce()`/`pierceAsync()` resolve a target by capability and path.
- Policies: pre/post hooks to enforce security and log usage.
- Scope: calls carry component/context info for permission checks.

## Interop with Context
- Context can provide tenant, theme, permissions; policies can read these for decisions.
- Context is hierarchical (nearest provider). Fenestration is cross-layer and explicit.
- Together: Context for local inheritance; Fenestration for controlled cross-layer access.

## Minimal Lifecycle
1) Providers register into the Fenestration registry at startup.
2) Components invoke `pierce()` with capability path.
3) Policies validate scope (component, user) and permit/deny.
4) Call executes; results returned to caller.

## Security Considerations
- Enforce least privilege via per-capability policies.
- Validate component capabilities (from decorators/metadata).
- Redact/limit data at boundaries.
- Maintain audit trail per call site.

## Roadmap Hooks
- Devtools panel to visualize piercings and policies.
- Policy composition helpers and test harnesses.
- Telemetry integration for performance and denial analytics.
