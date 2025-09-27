<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Monorepo Versioning Strategy

## Table of Contents
- [Overview](#overview)
- [Versioning Model](#versioning-model)
- [Workflow with Changesets](#workflow-with-changesets)
- [Dependency Management](#dependency-management)
- [Publishing and Hosting](#publishing-and-hosting)
- [Best Practices](#best-practices)
- [Related Docs](#related-docs)

---

[See also: Task Generation Framework](./task-framework.md) | [Development Workflow](./workflow.md) | [Development Rules](./rules.md)

---

## Overview

This document describes the versioning strategy for the SwissJS monorepo. It ensures that all packages and applications can be versioned, published, and consumed independently, supporting robust dependency management and multi-version hosting.

## Versioning Model

- **Independent Versioning:**
  - Each package/app in `packages/` and `apps/` is versioned independently using [Semantic Versioning (SemVer)](https://semver.org/): `MAJOR.MINOR.PATCH`.
  - Updates to one package do not affect the versions of others unless explicitly required.
- **Version History:**
  - All published versions are retained in the package registry, allowing consumers to use any version as needed.

## Workflow with Changesets

SwissJS uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

### Steps:
1. **Install Changesets:**
   - Installed as a dev dependency at the workspace root.
2. **Create a Changeset:**
   - Run `pnpm changeset` after making a change.
   - Select affected packages/apps, choose the version bump (major/minor/patch), and write a summary (reference tasks/tickets for traceability).
3. **Version Bump:**
   - Run `pnpm changeset version` to update `package.json` and changelogs for affected packages.
4. **Publish:**
   - Run `pnpm changeset publish` to publish new versions to the registry (npm or private).

### Example:
```
pnpm changeset        # Create a changeset for your change
pnpm changeset version # Apply version bumps and update changelogs
pnpm changeset publish # Publish to registry
```

## Dependency Management

- **Flexible Dependencies:**
  - Packages/apps can depend on any version of another package by specifying the desired version or range in their `package.json`.
  - Example: `"@swissjs/utils": "^1.2.0"` or `"@swissjs/utils": "1.2.3"`.
- **Backward Compatibility:**
  - Older apps/packages can continue using previous versions even after new versions are published.
  - New apps/packages can opt into newer versions as needed.
- **Internal Dependency Updates:**
  - The monorepo is configured to update internal dependencies with a patch bump by default (`updateInternalDependencies: patch`).

## Publishing and Hosting

- **All versions are published and retained** in the registry (npm, GitHub Packages, etc.).
- **Apps can be deployed as versioned artifacts** (e.g., Docker images, static builds), allowing multiple versions to run in parallel.
- **No versions are unpublished** unless absolutely necessary, ensuring stability and rollback capability.
- **Consumers can always install or deploy any published version** for testing, rollback, or multi-tenant scenarios.

## Best Practices

- **Always publish every stable version** to the registry.
- **Reference tasks/tickets in changeset summaries** for traceability.
- **Use semver ranges** in dependencies for flexibility, or strict versions for stability.
- **Automate publishing** in CI/CD to ensure all versions are available.
- **Document breaking changes** clearly in changelogs.
- **Tag releases** (e.g., `latest`, `stable`, `beta`) for easier management.

## Related Docs
- [Task Generation Framework](./task-framework.md)
- [Development Workflow](./workflow.md)
- [Development Rules](./rules.md) 