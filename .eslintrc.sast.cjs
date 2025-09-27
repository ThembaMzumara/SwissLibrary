// ESLint config for SAST runs (security-centric). Narrow and strict.
module.exports = {
  env: { es2022: true, node: true, browser: false },
  parser: '@typescript-eslint/parser',
  parserOptions: { project: false, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'security', 'sonarjs'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:sonarjs/recommended'
  ],
  rules: {
    // Turn potentially risky patterns into hard errors
    'security/detect-unsafe-regex': 'error',
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-child-process': 'error',

    // Sonar suggestions
    'sonarjs/no-all-duplicated-branches': 'warn',

    // TS strictness for SAST
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'error'
  },
  ignorePatterns: [
    '**/dist/**',
    '**/node_modules/**',
    'docs/api/**',
    'docs/.vitepress/dist/**'
  ],
};
