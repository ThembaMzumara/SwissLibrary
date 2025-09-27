<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# SwissJS Cursor Rules (Merged & Directive)

1. **Consult Documentation First**
   - **Rule**: Before making any code changes, Cursor must read the `README.md` and relevant docs in the target package/app/library.
   - **Purpose**: Ensures context, conventions, and intended functionality are understood. If docs are missing or outdated, prompt to create or update them before proceeding.

2. **No Destructive Actions Without Explicit Confirmation**
   - **Rule**: Never delete, overwrite, or move files/code/commits without explicit user confirmation. Avoid force pushes or destructive rebases.
   - **Purpose**: Protects the codebase from accidental loss.

3. **Minimal Core, Plugin-First Architecture**
   - **Rule**: Implement all new features as plugins unless essential to the minimal core. Always check for existing plugins/solutions before starting new work.
   - **Purpose**: Keeps the core lightweight and modular.

4. **Use Relative Imports for Internal Modules**
   - **Rule**: Always use relative imports (e.g., `../module`) for internal modules. Do not use path aliases unless explicitly configured.
   - **Purpose**: Ensures clarity and prevents resolution issues.

5. **Standardized Commit Messages**
   - **Rule**: All commit messages must follow `[TICKET_ID] Brief summary` (e.g., `[SWS-CORE-101] Implement base SwissComponent class`). Reference the relevant JIRA ticket in every commit.
   - **Purpose**: Maintains traceability and project organization.

6. **Branch Naming and PR Conventions**
   - **Branch Names**: `[type]/[TICKET_ID]-[short-description]` (e.g., `feature/SWS-CORE-101-base-component`).
   - **PR Titles**: `[TICKET_ID] Descriptive title` (e.g., `[SWS-CORE-101] Implement base SwissComponent class`).
   - **Purpose**: Ensures clear, automated tracking from ticket → branch → commit → PR.

7. **Linter and TypeScript Compliance**
   - **Rule**: Fix linter/TypeScript errors by addressing the root cause, not by commenting out or suppressing code. If a rule must be disabled, add a clear, documented reason.
   - **Purpose**: Maintains high code quality.

8. **Protect Sensitive and Historical Directories**
   - **Rule**: Never modify files in `/legacy` or `/docs` unless explicitly instructed. For documentation changes, update only the relevant docs in the current package/library.
   - **Purpose**: Preserves historical code and documentation.

9. **Document All Public API and Behavioral Changes**
   - **Rule**: Update or create documentation (e.g., `README.md`, inline comments) whenever public APIs or behaviors change. If a change is not documented, prompt the user to add or approve documentation before proceeding.
   - **Purpose**: Ensures documentation is always in sync with the codebase.

10. **Test and Validate Before Committing**
    - **Rule**: Run all applicable unit, integration, and validation tests before committing. If tests are missing, prompt to create them.
    - **Purpose**: Ensures stability and prevents regressions.

11. **Branching and Collaboration**
    - **Rule**: Use feature/bugfix branches for all changes. Merge into `main` only after review and successful CI. Direct commits to `main` are allowed only for urgent hotfixes with explicit user approval.
    - **Purpose**: Promotes safe collaboration and a clean commit history.

12. **Concise, Actionable, and Non-Repetitive Prompts**
    - **Rule**: Interact with the user using concise, actionable prompts. Avoid repetition and always suggest clear next steps.
    - **Purpose**: Streamlines communication and maximizes productivity.

13. **Automated Enforcement and CI/CD Integration**
    - **Rule**: Leverage CI/CD pipelines to enforce linting, testing, and documentation checks. Block merges that violate these rules.
    - **Purpose**: Ensures consistent enforcement and reduces manual oversight.

14. **Avoid Redundancy and Duplication**
    - **Rule**: Before adding new code, check for existing implementations/utilities. Refactor or reuse code where possible. Avoid duplicating logic, types, or files.
    - **Purpose**: Keeps the codebase DRY and maintainable.

15. **Respect Project Structure and Conventions**
    - **Rule**: Organize new files/code according to the documented structure and conventions of each package/library.
    - **Purpose**: Maintains consistency and discoverability.

16. **Handle Ambiguity and Errors Transparently**
    - **Rule**: If a linter, TypeScript, or runtime error is ambiguous, ask the user for clarification before proceeding. Never suppress errors without a clear, documented reason and user approval.
    - **Purpose**: Prevents hidden issues and ensures transparent error handling.

---

### **Commit Message Format (from docs and .cursor/rules.json):**
- `[TICKET_ID] Brief summary`
- Example: `[SWS-CORE-101] Implement base SwissComponent class`
- Always reference the relevant JIRA ticket.

### **Branch Naming:**
- `[type]/[TICKET_ID]-[short-description]`
- Example: `feature/SWS-CORE-101-base-component`

### **PR Title:**
- `[TICKET_ID] Descriptive title`

---

**Cursor must follow these rules strictly to support SwissJS's direction, quality, and traceability.**
If you want to further automate, clarify, or enforce any rule, just let me know! 