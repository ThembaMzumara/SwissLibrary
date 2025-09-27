<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Monorepo Development Rules

## Table of Contents
- [Branching Rules](#branching-rules)
- [Commit Message Rules](#commit-message-rules)
- [Pull Request Rules](#pull-request-rules)
- [Code Review Rules](#code-review-rules)
- [Testing Rules](#testing-rules)
- [Documentation Rules](#documentation-rules)
- [General Best Practices](#general-best-practices)

---

## Branching Rules
- Use the branch flow described in [Development Workflow](./development_workflow.md).
- Branch names must follow the convention: `[type]/[TICKET_ID]-[short-description]` (see [Ticket & PR Conventions](./Ticket_ID_pattern_n_github_pr_conventions.md)).
- No direct commits to `main` or `staging`.

## Commit Message Rules
- Use the format: `[TICKET_ID] Brief summary`.
- Reference the relevant Jira ticket in every commit.

## Pull Request Rules
- PR titles must follow: `[TICKET_ID] Descriptive title`.
- Link the PR to the corresponding Jira ticket.
- PRs must pass all required status checks before merging.

## Code Review Rules
- At least one approval required for merging to `develop`, two for `main` or `staging`.
- Reviewers must check for adherence to style, tests, and documentation.

## Testing Rules
- All new features and bugfixes must include tests.
- CI must pass before merging.

## Documentation Rules
- All public APIs and major features must be documented in the `docs/` directory.
- Update or create relevant docs for any significant change.

## General Best Practices
- Keep feature branches short-lived (1-3 days).
- Write clear, concise, and descriptive commit messages and PRs.
- Communicate blockers or issues early in the process.

---

For more details, see:
- [Development Workflow](./development_workflow.md)
- [Jira Workflow Stages](./jira_workflow_stages.md)
- [Ticket & PR Conventions](./Ticket_ID_pattern_n_github_pr_conventions.md) 