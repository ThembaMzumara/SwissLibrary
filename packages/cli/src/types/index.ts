/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export interface TemplateMetadata {
    name: string;
    type: string;
    version: string;
    description: string;
    author: string;
    tags: string[];
    capabilities: string[];
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    source: 'builtin' | 'community';
    path: string;
    createdAt: string;
    updatedAt: string;
    repository?: string;
  }
  
  export interface TemplateRegistry {
    version: string;
    templates: TemplateRegistryEntry[];
    lastUpdated: string;
  }
  
  export interface TemplateRegistryEntry {
    name: string;
    type: string;
    version: string;
    description: string;
    author: string;
    tags: string[];
    source: 'builtin' | 'community';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface RegistryConfig {
    registryPath: string;
    templatesPath: string;
    defaultRegistry?: string;
  }
  
  export interface PromptConfig {
    name: string;
    type: 'input' | 'select' | 'confirm' | 'multiselect' | 'number';
    message: string;
    default?: unknown;
    choices?: string[] | { name: string; value: unknown }[];
    validate?: ValidatorConfig;
    when?: (answers: Record<string, unknown>) => boolean;
    filter?: FilterConfig;
    transformer?: TransformerConfig;
  }
  
  export interface TemplateVariables {
    [key: string]: unknown;
  }
  
  export interface GenerationOptions {
    outputPath: string;
    templatePath: string;
    variables: TemplateVariables;
    overwrite?: boolean;
    skipInstall?: boolean;
    skipGit?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
  }
  
  export interface FileGenerationResult {
    success: boolean;
    filesCreated: string[];
    filesSkipped: string[];
    errors: string[];
  }
  
  export interface TemplateEngineOptions {
    helpers?: Record<string, (...args: unknown[]) => unknown>;
    partials?: Record<string, string>;
    noEscape?: boolean;
  }
  
  export interface DependencyInstallOptions {
    packageManager: 'npm' | 'yarn' | 'pnpm';
    skipInstall?: boolean;
    dev?: boolean;
  }
  
  export interface TemplateValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
  }
  
  export interface SwissForgeConfig {
    templates: {
      builtin: string[];
      community: string[];
    };
    registry: {
      url: string;
      cacheTimeout: number;
    };
    generation: {
      defaultPackageManager: 'npm' | 'yarn' | 'pnpm';
      gitInit: boolean;
      installDependencies: boolean;
    };
  }

  export interface ValidatorConfig {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  }

  export interface FilterConfig {
    toLowerCase?: boolean;
    trim?: boolean;
    kebabCase?: boolean;
  }

  export interface TransformerConfig {
    preview?: boolean;
  }