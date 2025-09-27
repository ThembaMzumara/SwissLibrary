<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# Jira Workflow Stages for SwissJS Monorepo

## Table of Contents
- [Backlog](#1-backlog)
- [In Progress](#2-in-progress)
- [In Review](#3-in-review)
- [Staging/Testing](#4-stagingtesting)
- [Done](#5-done)
- [Why These Stages?](#why-these-stages)
- [Related Docs](#related-docs)

---

[See also: Development Workflow](./development_workflow.md) | [Development Rules](./development_rules.md) | [Ticket & PR Conventions](./Ticket_ID_pattern_n_github_pr_conventions.md)

---

## 1. Backlog
- **Description:** Work is captured, described, and prioritized, but not yet ready to be started.
- **Branch Context:** No branch yet; item is in planning.

## 2. In Progress
- **Description:** Actively being developed on a feature branch (branched from `develop`).
- **Branch Context:** Feature branches (e.g., `feature/xyz`) created from `develop`.

## 3. In Review
- **Description:** Code is complete and a pull request (PR) is open for review and integration into `develop` or another target branch.
- **Branch Context:** PRs targeting `develop` (or hotfixes targeting `main`).

## 4. Staging/Testing
- **Description:** Merged into `staging` for pre-production testing and verification (QA, CI, UAT, etc.).
- **Branch Context:** Code is in the `staging` branch, reflecting the next release candidate.

## 5. Done
- **Description:** Successfully released to `main` (production) or hotfix merged and deployed.
- **Branch Context:** Code is in the `main` branch (production) or hotfix completed.

---

### Why These Stages?
- **Backlog:** Captures all ideas and unstarted work.
- **In Progress:** Represents active development on feature branches.
- **In Review:** Ensures code quality and team alignment before merging.
- **Staging/Testing:** Reflects our "staging is king" principle—work is validated before release.
- **Done:** Work is fully complete, merged to `main`, and released.

This workflow keeps our process simple, clear, and tightly aligned with our branch strategy.

## Related Docs
- [Development Workflow](./development_workflow.md)
- [Development Rules](./development_rules.md)
- [Ticket & PR Conventions](./Ticket_ID_pattern_n_github_pr_conventions.md) 