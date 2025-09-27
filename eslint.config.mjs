/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "eslint-plugin-vitest";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    plugins: { vitest },
    languageOptions: { globals: vitest.environments.env.globals },
  },
  {
    files: ["packages/**/src/**/*.{ts,tsx,js}"],
    rules: {
      // Forbid deep imports into @swissjs/* internal src trees
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ["@swissjs/*/src/**"],
              message: 'Deep imports into @swissjs/*/src/** are forbidden; use the package barrel @swissjs/<pkg>.'
            }
          ]
        }
      ],
    }
  },
]);
