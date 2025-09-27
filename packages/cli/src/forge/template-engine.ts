/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as Handlebars from 'handlebars';

import fs from 'fs-extra';
import type { TemplateContext, TemplateFile } from '../types/template.types.js';

export class TemplateEngine {
  private handlebars: typeof Handlebars;

  // Minimal shape required from Handlebars helper options
  private static HelperOpts = class {
    // Using methods to satisfy runtime calls without importing complex types
    fn: (ctx: unknown) => unknown = () => undefined;
    inverse: (ctx: unknown) => unknown = () => undefined;
  };

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Custom helpers for SwissJS templates
    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str.replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase());
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    this.handlebars.registerHelper('ifEquals', (arg1: unknown, arg2: unknown, options: InstanceType<typeof TemplateEngine.HelperOpts>) => {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifContains', (array: unknown, value: unknown, options: InstanceType<typeof TemplateEngine.HelperOpts>) => {
      if (Array.isArray(array)) {
        return array.includes(value) ? options.fn(this) : options.inverse(this);
      }
      return options.inverse(this);
    });

    this.handlebars.registerHelper('join', (array: unknown, separator: string = ', ') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    this.handlebars.registerHelper('year', () => {
      return new Date().getFullYear().toString();
    });

    this.handlebars.registerHelper('date', () => {
      return new Date().toISOString().split('T')[0];
    });
  }

  async processTemplate(templatePath: string, context: TemplateContext): Promise<string> {
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = this.handlebars.compile(templateContent);
      return template(context);
    } catch (error) {
      throw new Error(`Failed to process template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processTemplateString(templateString: string, context: TemplateContext): Promise<string> {
    try {
      const template = this.handlebars.compile(templateString);
      return template(context);
    } catch (error) {
      throw new Error(`Failed to process template string: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processTemplateFile(templateFile: TemplateFile, context: TemplateContext): Promise<TemplateFile> {
    const processedPath = await this.processTemplateString(templateFile.path, context);
    const processedContent = templateFile.isTemplate 
      ? await this.processTemplateString(templateFile.content, context)
      : templateFile.content;

    return {
      ...templateFile,
      path: processedPath,
      content: processedContent
    };
  }

  async processTemplateFiles(templateFiles: TemplateFile[], context: TemplateContext): Promise<TemplateFile[]> {
    const processedFiles: TemplateFile[] = [];

    for (const templateFile of templateFiles) {
      const processedFile = await this.processTemplateFile(templateFile, context);
      processedFiles.push(processedFile);
    }

    return processedFiles;
  }

  validateTemplate(templatePath: string): boolean {
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      this.handlebars.compile(templateContent);
      return true;
    } catch (error) {
      console.error(`Template validation failed for ${templatePath}:`, error);
      return false;
    }
  }

  getTemplateVariables(templateContent: string): string[] {
    const variables: string[] = [];
    const regex = /\{\{\s*([^}]+)\s*\}\}/g;
    let match;

    while ((match = regex.exec(templateContent)) !== null) {
      const variable = match[1].trim();
      // Skip helpers and conditions
      if (!variable.startsWith('#') && !variable.startsWith('/') && !variable.startsWith('if')) {
        variables.push(variable);
      }
    }

    return [...new Set(variables)];
  }

  async analyzeTemplate(templatePath: string): Promise<{
    variables: string[];
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let variables: string[] = [];
    let isValid = false;

    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      variables = this.getTemplateVariables(templateContent);
      isValid = this.validateTemplate(templatePath);
    } catch (error) {
      errors.push(`Failed to analyze template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { variables, isValid, errors };
  }
}