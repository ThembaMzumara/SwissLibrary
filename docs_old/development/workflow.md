<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Minimal Development Workflow

## Table of Contents
- [Branch Flow](#branch-flow)
- [Core Workflow](#core-workflow)
  - [Daily Development (develop branch)](#1-daily-development-develop-branch)
  - [Staging Verification (staging branch)](#2-staging-verification-staging-branch)
  - [Release Preparation (release branch)](#3-release-preparation-release-branch)
  - [Production Release (main branch)](#4-production-release-main-branch)
  - [Hotfixes (from main)](#5-hotfixes-from-main)
- [Branch Protection Rules](#branch-protection-rules)
- [Workflow Summary](#workflow-summary)
- [Key Principles](#key-principles)
- [Related Docs](#related-docs)

---

[See also: Jira Workflow Stages](./jira_workflow_stages.md) | [Development Rules](./development_rules.md) | [Ticket & PR Conventions](./Ticket_ID_pattern_n_github_pr_conventions.md)

---

Here's the simplest possible workflow for your SwissJS project with the 4 essential branches:

**Branch Flow:**
- main → hotfix/... → main
- main → release → staging → main
- main → develop → staging
- develop → feature branches → develop

## Core Workflow

### 1. **Daily Development (develop branch)**
- Start work:
  - `git checkout develop`
  - `git pull origin develop`
- Create feature branch:
  - `git checkout -b feature/new-component`
- Make changes (e.g., edit `src/Component.1ui`)
- Commit and push:
  - `git commit -am "Add new component"`
  - `git push -u origin feature/new-component`
- Create PR to develop when ready

### 2. **Staging Verification (staging branch)**
- When features are ready for testing:
  - `git checkout staging`
  - `git pull origin staging`
  - `git merge develop`
- Test locally: `npm run dev`
- Push to remote for CI testing: `git push origin staging`

### 3. **Release Preparation (release branch)**
- When ready for release:
  - `git checkout release`
  - `git pull origin release`
  - `git merge staging`
- Update version, changelog:
  - `npm version patch -m "Bump version to %s"`
- Push changes:
  - `git push origin release --tags`

### 4. **Production Release (main branch)**
- Deploy to production:
  - `git checkout main`
  - `git pull origin main`
  - `git merge release`
- Push to production: `git push origin main`
- Optional: Create release in GitHub

### 5. **Hotfixes (from main)**
- For critical production bugs:
  - `git checkout main`
  - `git pull origin main`
  - `git checkout -b hotfix/login-issue`
- Fix the issue (e.g., edit `src/FixLogin.1ui`)
- Commit and merge:
  - `git commit -am "Fix login issue"`
  - `git checkout main`
  - `git merge hotfix/login-issue`
  - `git push origin main`
- Propagate fix to other branches:
  - `git checkout develop`
  - `git merge main`
  - `git push origin develop`
  - `git checkout staging`
  - `git merge main`
  - `git push origin staging`

## Branch Protection Rules

1. **main**
   - Direct commits blocked
   - Requires PR review
   - Status checks must pass
2. **staging**
   - Direct commits blocked
   - Requires PR review
3. **develop**
   - Direct commits allowed for core team
   - Requires status checks

## Workflow Summary

| Branch    | Purpose                  | Lifecycle | Merge Direction         |
|-----------|--------------------------|-----------|------------------------|
| **main**      | Production releases      | Permanent | ← release, ← hotfix    |
| **release**   | Release preparation      | Permanent | ← staging              |
| **staging**   | Pre-production testing   | Permanent | ← develop, ← main      |
| **develop**   | Feature integration      | Permanent | ← feature branches     |

## Key Principles

1. **Feature Branches**
   - Short-lived (1-3 days)
   - Created from `develop`
   - Merged back to `develop`
2. **Staging is King**
   - Always reflects next release candidate
   - All features merge here before release
3. **Hotfixes Minimal**
   - Only for critical production issues
   - Merged directly to `main`
   - Propagated to other branches
4. **Release Cadence**
   - Regular merges from `staging` to `release`
   - `release` → `main` for production deploys

This workflow gives you:
- Stable production (`main`)
- Testable pre-release (`staging`)
- Integration space (`develop`)
- Release control (`release`)

With minimal overhead and maximum clarity.

## Related Docs
- [Jira Workflow Stages](./jira_workflow_stages.md)
- [Development Rules](./development_rules.md)
- [Ticket & PR Conventions](./Ticket_ID_pattern_n_github_pr_conventions.md)