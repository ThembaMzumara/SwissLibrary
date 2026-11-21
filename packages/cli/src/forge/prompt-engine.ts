/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import type { TemplatePrompt, TemplateContext } from '../types/template.types.js';
import type { ValidatorConfig, FilterConfig, TransformerConfig } from '../types/index.js';

export class PromptEngine {
  private inquirer: typeof inquirer;

  constructor() {
    this.inquirer = inquirer;
  }

  async runPrompts(templatePath: string, variables: Record<string, unknown> = {}): Promise<TemplateContext> {
    const context: TemplateContext = {
      projectName: '',
      packageName: '',
      version: '0.1.0',
      author: '',
      description: '',
      capabilities: [],
      plugins: [],
      features: [],
      typescript: true,
      tailwind: true,
      testing: false,
      linting: false,
      git: true,
      ...variables
    };

    try {
      // Read prompts from template
      const promptsPath = path.join(templatePath, 'prompts.json');
      if (await fs.pathExists(promptsPath)) {
        const promptsData = await fs.readJson(promptsPath);
        const prompts = promptsData.prompts || [];

        console.log(chalk.cyan('\n🧀 Welcome to Swiss Forge!'));
        console.log(chalk.gray('Let\'s set up your SwissJS project...\n'));

        // Run prompts in sequence
        for (const prompt of prompts) {
          try {
            const answer = await this.runSinglePrompt(prompt, context);
            context[prompt.name] = answer;
          } catch (error) {
            console.error(chalk.red(`Error in prompt ${prompt.name}:`, error));
            process.exit(1);
          }
        }
      }
    } catch (error) {
      void error;
      console.warn(chalk.yellow('No prompts found, using default values'));
    }

    // Post-process context
    {
      const ctx = context as Record<string, unknown>;
      const pn = ctx.projectName;
      const projectName = typeof pn === 'string' ? pn : '';
      const pkgName = typeof ctx.packageName === 'string' ? ctx.packageName : '';
      (context as Record<string, unknown>).packageName = pkgName || this.sanitizePackageName(projectName);
      (context as Record<string, unknown>).camelCaseProjectName = this.toCamelCase(projectName);
      (context as Record<string, unknown>).pascalCaseProjectName = this.toPascalCase(projectName);
      (context as Record<string, unknown>).kebabCaseProjectName = this.toKebabCase(projectName);
    }

    return context;
  }

  private async runSinglePrompt(prompt: TemplatePrompt, context: TemplateContext): Promise<unknown> {
    // Skip conditional prompts
    if (prompt.when && !this.evaluateCondition(prompt.when, context)) {
      return prompt.default;
    }

    const inquirerPrompt: Record<string, unknown> = {
      type: prompt.type,
      name: prompt.name,
      message: prompt.message,
      default: prompt.default,
      choices: prompt.choices,
      validate: prompt.validate ? this.createValidator(prompt.validate) : undefined,
      filter: prompt.filter ? this.createFilter(prompt.filter) : undefined,
      transformer: prompt.transformer ? this.createTransformer(prompt.transformer) : undefined
    };

    const answer = await this.inquirer.prompt([inquirerPrompt]) as Record<string, unknown>;
    return answer[prompt.name];
  }

  private evaluateCondition(condition: string, context: TemplateContext): boolean {
    try {
      // Simple condition evaluation
      // Support: feature.typescript, !feature.testing, etc.
      if (condition.startsWith('!')) {
        const key = condition.slice(1);
        return !this.getValue(key, context);
      }

      if (condition.includes('===')) {
        const [left, right] = condition.split('===').map(s => s.trim());
        return this.getValue(left, context) === this.getValue(right, context);
      }

      if (condition.includes('!==')) {
        const [left, right] = condition.split('!==').map(s => s.trim());
        return this.getValue(left, context) !== this.getValue(right, context);
      }

      return !!this.getValue(condition, context);
    } catch (error) {
      void error;
      console.warn(`Failed to evaluate condition: ${condition}`);
      return false;
    }
  }

  private getValue(key: string, context: TemplateContext): unknown {
    if (key.startsWith('"') && key.endsWith('"')) {
      return key.slice(1, -1);
    }

    if (key.includes('.')) {
      const parts = key.split('.');
      let value: unknown = context;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
      return value;
    }

    return (context as Record<string, unknown>)[key];
  }

  private createValidator(validatorConfig: ValidatorConfig): (input: unknown) => boolean | string {
    return (input: unknown) => {
      if (validatorConfig.required && (input === undefined || input === null || input === '')) {
        return validatorConfig.message || 'This field is required';
      }

      if (typeof validatorConfig.minLength === 'number' && typeof input === 'string' && input.length < validatorConfig.minLength) {
        return validatorConfig.message || `Minimum length is ${validatorConfig.minLength}`;
      }

      if (typeof validatorConfig.maxLength === 'number' && typeof input === 'string' && input.length > validatorConfig.maxLength) {
        return validatorConfig.message || `Maximum length is ${validatorConfig.maxLength}`;
      }

      if (validatorConfig.pattern) {
        const regex = new RegExp(validatorConfig.pattern);
        if (typeof input !== 'string' || !regex.test(input)) {
          return validatorConfig.message || 'Invalid format';
        }
      }

      return true;
    };
  }

  private createFilter(filterConfig: FilterConfig): (input: unknown) => unknown {
    return (input: unknown) => {
      if (filterConfig.toLowerCase && typeof input === 'string') {
        return input.toLowerCase();
      }

      if (filterConfig.trim && typeof input === 'string') {
        return input.trim();
      }

      if (filterConfig.kebabCase && typeof input === 'string') {
        return this.toKebabCase(input);
      }

      return input;
    };
  }

  private createTransformer(transformerConfig: TransformerConfig): (input: unknown) => string {
    return (input: unknown) => {
      if (transformerConfig.preview) {
        return chalk.gray(`(${String(input)})`);
      }

      return typeof input === 'string' ? input : String(input);
    };
  }

  async selectTemplate(templates: Array<{ name: string; description: string; type: string }>): Promise<string> {
    const choices = templates.map(template => ({
      name: `${chalk.cyan(template.name)} - ${template.description}`,
      value: template.type,
      short: template.name
    }));

    const answer = await this.inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'What type of project would you like to create?',
        choices,
        pageSize: 10
      }
    ]) as Record<string, unknown>;

    const val = answer.template;
    return typeof val === 'string' ? val : String(val ?? '');
  }

  async confirmGeneration(context: TemplateContext): Promise<boolean> {
    console.log(chalk.cyan('\n📋 Project Configuration Summary:'));
    console.log(`${chalk.gray('Project Name:')} ${String((context as Record<string, unknown>).projectName ?? '')}`);
    console.log(`${chalk.gray('Package Name:')} ${String((context as Record<string, unknown>).packageName ?? '')}`);
    console.log(`${chalk.gray('Version:')} ${String((context as Record<string, unknown>).version ?? '')}`);
    console.log(`${chalk.gray('Author:')} ${String((context as Record<string, unknown>).author ?? '')}`);
    console.log(`${chalk.gray('Description:')} ${String((context as Record<string, unknown>).description ?? '')}`);

    const capabilities = Array.isArray((context as Record<string, unknown>).capabilities)
      ? ((context as Record<string, unknown>).capabilities as unknown[]).map(String)
      : [];
    if (capabilities.length > 0) {
      console.log(`${chalk.gray('Capabilities:')} ${capabilities.join(', ')}`);
    }

    const plugins = Array.isArray((context as Record<string, unknown>).plugins)
      ? ((context as Record<string, unknown>).plugins as unknown[]).map(String)
      : [];
    if (plugins.length > 0) {
      console.log(`${chalk.gray('Plugins:')} ${plugins.join(', ')}`);
    }

    const features: string[] = [];
    const ctx = context as Record<string, unknown>;
    if ((ctx.typescript as boolean)) features.push('TypeScript');
    if ((ctx.tailwind as boolean)) features.push('Tailwind CSS');
    if ((ctx.testing as boolean)) features.push('Testing');
    if ((ctx.linting as boolean)) features.push('Linting');
    if ((ctx.git as boolean)) features.push('Git');

    if (features.length > 0) {
      console.log(`${chalk.gray('Features:')} ${features.join(', ')}`);
    }

    const answer = await this.inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Generate project with these settings?',
        default: true
      }
    ]) as Record<string, unknown>;

    return Boolean(answer.confirm);
  }

  private sanitizePackageName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }

  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}