<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS V2: Official Migration & Task List

**To:** All SwissJS Engineers
**From:** Lead Engineer, Astra Technologies
**Subject:** V2 Migration: Official Tasks & Roadmap

This document outlines the definitive, phased plan for migrating our codebase to the SwissJS V2 architecture. Each task has been defined based on a thorough analysis of the V1-to-V2 architectural gap. This is our source of truth for the migration effort.

---

## Phase 1: Foundation - Core & Runtime Restructuring

*Goal: Establish the new package structure, refactor the runtime for performance, and lay the groundwork for the new security model.*

| Key | Type | Summary | Component | Priority | Story Points | Dependencies | Risk | Architecture Impact |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SWS-MIG-001** | Task | Create `ui-engine` & `security` packages | DevOps | Blocker | 3 | - | Low | Major |
| **SWS-MIG-002** | Task | Create `runtime/adapter-factory.ts` | Core | Critical | 3 | - | Low | Major |
| **SWS-MIG-003** | Task | Refactor `runtime-service.ts` to use lazy-loading & factory | Core | Critical | 5 | SWS-MIG-002 | Medium | Major |
| **SWS-MIG-004** | Task | Create placeholder `security/gateway.ts` in Core | Core | Critical | 2 | - | Low | Major |
| **SWS-MIG-005** | Task | Create `plugins/capability-registry.ts` in Core | Core | Critical | 3 | SWS-MIG-004 | Medium | Major |
| **SWS-MIG-006** | Task | Update `pluginManager.ts` to use placeholder Capability Registry | Core | High | 3 | SWS-MIG-005 | Medium | Major |

## Phase 2: UI Engine Extraction

*Goal: Decouple all rendering, VDOM, and reactivity logic from the `core` package into the new `ui-engine` package.*

| Key | Type | Summary | Component | Priority | Story Points | Dependencies | Risk | Architecture Impact |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SWS-MIG-010** | Story | Move all UI/rendering source code to `ui-engine` package | Core, UI-Engine | Blocker | 8 | SWS-MIG-001 | High | Breaking |
| **SWS-MIG-011** | Task | Update monorepo dependencies for `ui-engine` | DevOps | Blocker | 3 | SWS-MIG-010 | Low | Major |
| **SWS-MIG-012** | Task | Fix all broken imports across the monorepo to point to `ui-engine` | Core, Compiler | Blocker | 13 | SWS-MIG-011 | Medium | Breaking |
| **SWS-MIG-013** | Task | Refactor `core` barrel file to remove all UI-related exports | Core | Critical | 3 | SWS-MIG-012 | Low | Breaking |
| **SWS-MIG-014** | Task | Create `ui-engine` barrel file to expose its public API | UI-Engine | Critical | 2 | SWS-MIG-012 | Low | Major |

## Phase 3: Compiler & Component Model Alignment

*Goal: Refactor the compiler to process `.ui`/`.1ui` files as TSX, transform all custom SwissJS directives into standard TypeScript/JSX, and output valid code for the downstream `tsc` compiler. This is a critical two-stage process.*

| Key | Type | Summary | Component | Priority | Story Points | Dependencies | Risk | Architecture Impact |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SWS-MIG-020** | Story | Refactor compiler to support V2 Component Model (TSX + Directives) | Compiler | Blocker | 13 | SWS-MIG-014 | High | Breaking |
| **SWS-MIG-021** | Task | Implement AST transform for `@if` and `@for` directives within JSX | Compiler | Critical | 8 | SWS-MIG-020 | High | Major |
| **SWS-MIG-022** | Task | Implement AST transform for event directives (`@click`, `@submit`, etc.) | Compiler | Critical | 8 | SWS-MIG-020 | High | Major |
| **SWS-MIG-023** | Task | Implement AST transform for data-binding directives (`@bind`, etc.) | Compiler | Critical | 5 | SWS-MIG-020 | Medium | Major |
| **SWS-MIG-024** | Task | Ensure final compiler output targets `UIEngine.createElement` | Compiler | Critical | 3 | SWS-MIG-020 | Medium | Major |

## Phase 4: Security System Implementation

*Goal: Build out the dedicated `security` package and fully integrate it with the `core` framework's gateway and plugin manager.*

| Key | Type | Summary | Component | Priority | Story Points | Dependencies | Risk | Architecture Impact |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SWS-MIG-030** | Story | Build the core Security Engine in the `security` package | Security | Blocker | 13 | SWS-MIG-001 | High | Major |
| **SWS-MIG-031** | Task | Implement `security/validator.ts` for policy checks | Security | Critical | 8 | SWS-MIG-030 | Medium | Major |
| **SWS-MIG-032** | Task | Connect `core`'s Security Gateway to the real Security Engine | Core, Security | Blocker | 5 | SWS-MIG-030 | Medium | Breaking |
| **SWS-MIG-033** | Task | Integrate `pluginManager.ts` with the Security Gateway for plugin audits | Core, Security | Blocker | 8 | SWS-MIG-032 | High | Breaking |

## Phase 5: Developer Experience & Finalization

*Goal: Scaffold tooling for documentation, finalize the migration, and prepare the codebase for future V2 development.*

| Key | Type | Summary | Component | Priority | Story Points | Dependencies | Risk | Architecture Impact |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SWS-MIG-040** | Task | Create `dev/` directory and scaffold tooling structure | DevOps | High | 2 | - | Low | Minor |
| **SWS-MIG-041** | Task | Plan API documentation generation using TypeDoc | DevTools | High | 3 | SWS-MIG-040 | Low | Minor |
| **SWS-MIG-042** | Task | Implement production preloading for the runtime adapter | CLI, Core | Medium | 3 | SWS-MIG-003 | Medium | Minor |
| **SWS-MIG-043** | Task | Integrate a bundle analysis tool into the build process | DevOps | Medium | 5 | SWS-MIG-040 | Low | Minor |
| **SWS-MIG-044** | Story | Audit entire codebase for remaining V1 patterns and create follow-up tasks | Core, Plugins | High | 8 | All Phases | Medium | Minor | 