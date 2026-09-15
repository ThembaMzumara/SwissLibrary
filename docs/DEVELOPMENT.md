<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Development Guidelines

## Core Development Principles

### 🚫 NO BYPASSING POLICY

**We do NOT skip, bypass, or ignore ANY required checks in this codebase.**

- ❌ **NO** `--no-verify` on commits or pushes
- ❌ **NO** skipping tests or linting
- ❌ **NO** disabling pre-commit or pre-push hooks
- ❌ **NO** temporary workarounds that bypass quality gates

### ✅ EVERY CHECK MUST PASS

All development work must ensure:

1. **Pre-commit hooks pass completely**
   - ESLint with zero warnings
   - TypeScript type checking
   - Documentation sync verification
   - Commit message format validation

2. **Pre-push hooks pass completely**
   - All linting passes
   - All type checking passes
   - All barrel file compliance
   - All policy checks pass
   - All UI format checks pass
   - **ALL TESTS PASS** (no exceptions)

3. **CI/CD pipeline passes completely**
   - Policy Checks workflow
   - CI DevTools (Barrels & API) workflow
   - Gitleaks (Secrets Scan) workflow
   - Semgrep security analysis
   - Security Scan (CodeQL) workflow
   - SAST ESLint workflow
   - Changesets Version workflow
   - SwissJS Enhanced CI/CD workflow

## Development Workflow

### Branch Structure & Filtering

- **`develop`**: Active development branch (may contain temp files, docs_old, etc.)
- **`staging`**: Clean, production-ready branch (filtered via CI)
- **`main`**: Production branch (manual approval required)

#### Develop to Staging Filtering

```bash
# Check if develop is ready for staging
./scripts/prepare-staging.sh

# The staging CI automatically blocks:
# - docs_old/ directory
# - jira/ directory
# - .cursor/ directory
# - *.tmp, *.log files
# - temp/, tmp/ directories
```

### Before Every Commit

```bash
# These must ALL pass before committing
pnpm lint                    # Zero warnings allowed
pnpm type-check             # Zero errors allowed
pnpm check:barrels          # All barrels compliant
pnpm check:policy           # All policies enforced
pnpm check:ui-format        # All .ui files properly formatted
pnpm test                   # ALL tests must pass
```

### Before Every Push

```bash
# Pre-push hook automatically runs:
pnpm prepush:checks
# This includes ALL the above checks PLUS CI=1 test run
```

### Branch Protection

- `develop` branch requires ALL CI checks to pass
- `staging` branch requires ALL CI checks to pass + file filtering
- `main` branch requires ALL CI checks to pass + manual approval

## Quality Standards

### Code Quality

- **Zero ESLint warnings** in production code
- **Zero TypeScript errors** across all packages
- **100% test coverage** for critical paths
- **All accessibility tests pass** for UI components

### Security Standards

- **Zero secrets** in codebase (Gitleaks enforced)
- **Zero security vulnerabilities** (Semgrep + CodeQL enforced)
- **All deep imports** follow policy rules
- **All public barrels** use explicit exports only

### Documentation Standards

- **API docs sync** with code changes
- **Changelog entries** for all user-facing changes
- **Commit messages** follow ticket ID format: `[SWS-AREA-ID] Description`

## Troubleshooting Failed Checks

### If Pre-commit Fails

1. Fix the specific issue reported
2. Stage the fixes: `git add .`
3. Commit again (hooks will re-run)

### If Pre-push Fails

1. Identify the failing check from the output
2. Run the specific command locally to reproduce
3. Fix the issue completely
4. Push again (hooks will re-run)

### If CI Fails

1. Check the GitHub Actions logs for specific failures
2. Reproduce the issue locally using CI environment variables
3. Fix the root cause (never mask symptoms)
4. Push the fix and verify CI passes

## Emergency Procedures

### Critical Production Issues

Even for critical production issues:

- **NO bypassing of quality gates**
- Create hotfix branch from `main`
- Apply minimal fix with full test coverage
- Ensure ALL checks pass before merge
- Follow up with comprehensive fix if needed

### Time-Sensitive Releases

- Plan ahead to avoid time pressure
- Use feature flags for incomplete features
- Maintain quality standards regardless of deadlines
- **Quality is never negotiable**

## Enforcement

This policy is enforced through:

- Git hooks (husky)
- GitHub branch protection rules
- CI/CD pipeline requirements
- Code review requirements
- Automated quality gates

**Violation of this policy requires immediate remediation and process review.**

---

## Philosophy

> "Quality is not an act, it is a habit." - Aristotle

**Every line of code reflects our commitment to excellence.**
