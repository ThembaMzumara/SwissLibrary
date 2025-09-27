<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS JIRA Ticket ID Pattern & GitHub PR Conventions

## Table of Contents
- [JIRA Ticket ID Pattern](#1-jira-ticket-id-pattern)
- [GitHub PR Title Convention](#2-github-pr-title-convention)
- [Branch Naming Convention](#3-branch-naming-convention)
- [Commit Message Format](#4-commit-message-format)
- [Automatic JIRA-GitHub Integration](#5-automatic-jira-github-integration)
- [Example Workflow](#6-example-workflow)
- [Why This Pattern Works](#7-why-this-pattern-works)
- [Implementation Steps](#8-implementation-steps)
- [Special Cases](#9-special-cases)
- [Related Docs](#related-docs)

---

[See also: Development Workflow](./development_workflow.md) | [Development Rules](./development_rules.md) | [Jira Workflow Stages](./jira_workflow_stages.md)

---

## 1. JIRA Ticket ID Pattern
**Format:** `SWS-[PROJECT_ID]-[TICKET_NUMBER]`  
**Examples:**  
- `SWS-CORE-101` (Core framework task)
- `SWS-CLI-205` (CLI feature)
- `SWS-PLG-312` (Plugin development)
- `SWS-DOC-401` (Documentation)
- `SWS-APP-508` (Application task)

**Project ID Key:**

| ID     | Area                | Example Tickets                 |
|--------|---------------------|---------------------------------|
| CORE   | Framework Core      | Component system, VDOM          |
| CLI    | Command Line Tools  | Create command, build system    |
| PLG    | Plugin Ecosystem    | WebGPU plugin, capability API   |
| COMP   | Compiler            | .1ui transformer, AST parsing   |
| DEV    | DevTools            | Fenestration explorer, debugger |
| APP    | Applications        | SwissApp features, demos        |
| DOC    | Documentation       | API references, guides          |
| INFRA  | Infrastructure      | CI/CD, testing setup            |
| PERF   | Performance         | Optimization tasks              |
| SEC    | Security            | Capability hardening            |

## 2. GitHub PR Title Convention
**Format:** `[TICKET_ID] Brief descriptive title`  
**Examples:**  
- `[SWS-CORE-101] Implement base SwissComponent class`
- `[SWS-CLI-205] Add Tailwind v4 to create command`
- `[SWS-PLG-312] Create filesystem capability plugin`

## 3. Branch Naming Convention
**Format:** `[TYPE]/[TICKET_ID]-[SHORT_DESCRIPTION]`  
**Examples:**  
- `feature/SWS-CORE-101-base-component`
- `fix/SWS-CLI-205-tailwind-config`
- `docs/SWS-DOC-401-capability-guide`

## 4. Commit Message Format

`[TICKET_ID] Brief summary`

Detailed explanation (if needed)

## 5. Automatic JIRA-GitHub Integration

**Workflow:**
- When a GitHub PR is created, JIRA ticket moves to "In Progress"
- When a GitHub PR is merged, JIRA ticket moves to "Done"
- When a commit message references a ticket, a comment is added to JIRA

## 6. Example Workflow

**JIRA Ticket:**  
- ID: `SWS-CORE-102`
- Title: Implement VDOM diffing algorithm
- Description: 
  - **Purpose:** Create efficient virtual DOM diffing for optimal rendering
  - **Acceptance Criteria:**
    - 30% faster than Snabbdom in benchmark tests
    - Full test coverage
    - Integration with renderer system

**GitHub Branch:**  
`git checkout -b feature/SWS-CORE-102-vdom-diffing`

**Commit:**  
`git commit -m "[SWS-CORE-102] Initial diff algorithm implementation"`

**PR Title:**  
`[SWS-CORE-102] Implement VDOM diffing algorithm`

## 7. Why This Pattern Works

1. **Clear Scoping:** Project IDs prevent ticket collisions  
2. **Visual Scanning:** Easily identify task areas (CORE vs CLI vs PLG)  
3. **Automation Friendly:** Regex-friendly pattern `SWS-\w+-\d+`  
4. **Scalable:** Supports 100+ projects without confusion  
5. **Traceability:** Full path from ticket → branch → commit → PR

## 8. Implementation Steps

1. **JIRA Setup**  
   Create projects with the IDs above (CORE, CLI, PLG, etc.)

2. **GitHub Configuration**  
   Add branch protection rule:  
   Regex: `^(feature|fix|docs|perf)/SWS-\w+-\d+(-[a-z0-9]+)*$`

3. **Developer Onboarding**  
   Add to CONTRIBUTING.md:
   - Create JIRA ticket (e.g. `SWS-CORE-101`)
   - Create branch: `feature/SWS-CORE-101-short-desc`
   - Commit: `[SWS-CORE-101] Your message`
   - PR title: `[SWS-CORE-101] Descriptive title`

4. **Automation Script** (Optional)
   Example Bash script:
   ```bash
   #!/bin/bash
   # new-task.sh
   ticket_id=$1
   description=$2
   
   git checkout develop
   git pull origin develop
   git checkout -b "feature/$ticket_id-${description// /-}"
   echo "✅ Created branch: feature/$ticket_id-${description// /-}"
   ```

## 9. Special Cases

1. **Cross-Cutting Tasks**  
   `SWS-INFRA-615` (Update CI pipeline for all packages)

2. **Urgent Hotfixes**  
   `SWS-CORE-HOTFIX-01` (Critical security patch)

3. **Spike Tasks**  
   `SWS-PLG-SPIKE-01` (Research WebAssembly plugin feasibility)

This system provides structure while maintaining flexibility, ensuring every task from core framework development to documentation is properly tracked and traceable throughout its lifecycle.

## Related Docs
- [Development Workflow](./development_workflow.md)
- [Development Rules](./development_rules.md)
- [Jira Workflow Stages](./jira_workflow_stages.md)