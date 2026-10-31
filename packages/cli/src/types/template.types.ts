/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Re-export types from the main types file
export * from './index.js';
import type { ValidatorConfig, FilterConfig, TransformerConfig } from './index.js';

// Additional types that might be needed
export interface TemplateContext {
  [key: string]: unknown;
}

export interface TemplateFile {
  path: string;
  content: string;
  template?: boolean;
  isTemplate?: boolean;
  isBinary?: boolean;
  sourcePath?: string;
  permissions?: number;
}

export interface TemplatePrompt {
  name: string;
  type: 'input' | 'select' | 'confirm' | 'multiselect' | 'number';
  message: string;
  default?: unknown;
  choices?: string[] | { name: string; value: unknown }[];
  validate?: ValidatorConfig;
  when?: string;
  filter?: FilterConfig;
  transformer?: TransformerConfig;
}

export interface FileGenerationResult {
  success: boolean;
  filesCreated: string[];
  filesSkipped: string[];
  errors: string[];
}

export interface DependencyInstallOptions {
  packageManager: 'npm' | 'yarn' | 'pnpm';
  dev?: boolean;
  skipInstall?: boolean;
}