<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
"@swissjs/components": patch
"@swissjs/security": patch
"@swissjs/utils": patch
---

# Fix CI stability and security pipeline

- Stabilize components a11y tests under JSDOM with canvas mocking and increased timeout
- Fix gitleaks config regex patterns for path exclusions
- Add basic semgrep security rules
- Update pnpm lockfile for new ESLint security plugins
- Curate barrel exports to remove duplicates and enforce public barrel policy
