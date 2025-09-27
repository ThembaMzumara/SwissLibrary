/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import type { TemplateContext, TemplateFile, GenerationOptions, FileGenerationResult } from '../types/template.types.js';
import { TemplateEngine } from './template-engine.js';

interface ProjectGenerationOptions {
  dryRun?: boolean;
  verbose?: boolean;
  overwrite?: boolean;
}

export class FileGenerator {
  private generatedFiles: string[] = [];
  private generatedDirs: string[] = [];
  private templateEngine: TemplateEngine;

  constructor(templateEngine: TemplateEngine) {
    this.templateEngine = templateEngine;
  }

  async generateFiles(options: GenerationOptions): Promise<FileGenerationResult> {
    const { outputPath, templatePath, variables, overwrite = false } = options;
    const result: FileGenerationResult = {
      success: true,
      filesCreated: [],
      filesSkipped: [],
      errors: []
    };

    try {
      // Check if output directory exists
      if (await fs.pathExists(outputPath)) {
        if (!overwrite) {
          result.errors.push(`Directory ${outputPath} already exists. Use --overwrite to overwrite.`);
          result.success = false;
          return result;
        }
        // Remove existing directory if overwrite is enabled
        await fs.remove(outputPath);
      }

      // Create output directory
      await fs.ensureDir(outputPath);

      // Read template files
      const templateFiles = await this.readTemplateFiles(templatePath);

      // Process template files
      const processedFiles = await this.templateEngine.processTemplateFiles(templateFiles, variables);

      // Generate files
      for (const templateFile of processedFiles) {
        try {
          await this.generateFile(outputPath, templateFile, variables, { dryRun: false, verbose: false });
          result.filesCreated.push(templateFile.path);
        } catch (error) {
          result.errors.push(`Failed to generate ${templateFile.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`File generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async generateProject(
    projectPath: string,
    templateFiles: TemplateFile[],
    context: TemplateContext,
    options: ProjectGenerationOptions = {}
  ): Promise<void> {
    const { dryRun = false, verbose = false, overwrite = false } = options;

    // Check if project directory exists
    if (await fs.pathExists(projectPath)) {
      if (!overwrite) {
        throw new Error(`Directory ${projectPath} already exists. Use --overwrite to overwrite.`);
      }
    }

    if (verbose) {
      console.log(chalk.gray(`Generating project at: ${projectPath}`));
    }

    // Create project directory
    if (!dryRun) {
      await fs.ensureDir(projectPath);
      this.generatedDirs.push(projectPath);
    }

    // Process and generate files
    for (const templateFile of templateFiles) {
      await this.generateFile(projectPath, templateFile, context, { dryRun, verbose });
    }

    if (verbose) {
      console.log(chalk.green(`✅ Generated ${this.generatedFiles.length} files in ${this.generatedDirs.length} directories`));
    }
  }

  private async generateFile(
    projectPath: string,
    templateFile: TemplateFile,
    context: TemplateContext,
    options: { dryRun: boolean; verbose: boolean }
  ): Promise<void> {
    const { dryRun, verbose } = options;
    const filePath = path.join(projectPath, templateFile.path);
    const fileDir = path.dirname(filePath);

    // Ensure directory exists
    if (!dryRun) {
      await fs.ensureDir(fileDir);
      if (!this.generatedDirs.includes(fileDir)) {
        this.generatedDirs.push(fileDir);
      }
    }

    if (verbose) {
      console.log(chalk.gray(`${dryRun ? '[DRY RUN] ' : ''}Creating: ${templateFile.path}`));
    }

    // Generate file content
    if (!dryRun) {
      if (templateFile.isBinary) {
        // Handle binary files
        await this.copyBinaryFile(templateFile.sourcePath!, filePath);
      } else {
        // Handle text files
        await fs.writeFile(filePath, templateFile.content, 'utf-8');
      }

      // Set file permissions if specified
      if (templateFile.permissions) {
        await fs.chmod(filePath, templateFile.permissions);
      }

      this.generatedFiles.push(filePath);
    }
  }

  private async copyBinaryFile(sourcePath: string, destPath: string): Promise<void> {
    await fs.copy(sourcePath, destPath);
  }

  async generateDirectory(dirPath: string, options: { dryRun: boolean; verbose: boolean }): Promise<void> {
    const { dryRun, verbose } = options;

    if (verbose) {
      console.log(chalk.gray(`${dryRun ? '[DRY RUN] ' : ''}Creating directory: ${dirPath}`));
    }

    await fs.ensureDir(dirPath);
    this.generatedDirs.push(dirPath);
  }

  async generateFromTemplate(
    templateDir: string,
    projectPath: string,
    context: TemplateContext,
    options: ProjectGenerationOptions = {}
  ): Promise<void> {
    if (options.verbose === true) {
      console.log(chalk.gray(`Reading template from: ${templateDir}`));
    }

    const templateFiles = await this.readTemplateFiles(templateDir);

    if (options.verbose === true) {
      console.log(chalk.gray(`Found ${templateFiles.length} template files`));
    }

    await this.generateProject(projectPath, templateFiles, context, options);
  }

  private async readTemplateFiles(templateDir: string): Promise<TemplateFile[]> {
    const files: TemplateFile[] = [];
    const filesDir = path.join(templateDir, 'files');

    if (!(await fs.pathExists(filesDir))) {
      throw new Error(`Template files directory not found: ${filesDir}`);
    }

    await this.readTemplateDirectory(filesDir, '', files);
    return files;
  }

  private async readTemplateDirectory(
    dirPath: string,
    relativePath: string,
    files: TemplateFile[]
  ): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeFilePath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        await this.readTemplateDirectory(fullPath, relativeFilePath, files);
      } else {
        const templateFile = await this.createTemplateFile(fullPath, relativeFilePath);
        files.push(templateFile);
      }
    }
  }

  private async createTemplateFile(filePath: string, relativePath: string): Promise<TemplateFile> {
    const stats = await fs.stat(filePath);
    const isTemplate = filePath.endsWith('.hbs');
    const isBinary = await this.isBinaryFile(filePath);

    // Remove .hbs extension from output path
    let outputPath = isTemplate ? relativePath.replace(/\.hbs$/, '') : relativePath;
    // Map any template file that ends with .1ui to .ui in the generated output
    // e.g., main.1ui.hbs -> main.ui
    outputPath = outputPath.replace(/\.1ui(\b|$)/, '.ui');

    let content = '';
    if (!isBinary) {
      content = await fs.readFile(filePath, 'utf-8');
    }

    return {
      path: outputPath,
      content,
      isTemplate,
      isBinary,
      sourcePath: filePath,
      permissions: stats.mode
    };
  }

  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      const chunk = buffer.slice(0, 8000);
      
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === 0) {
          return true;
        }
      }
      
      return false;
    } catch (_error) {
      void _error;
      return false;
    }
  }

  async validateTemplateStructure(templateDir: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required files
    const requiredFiles = ['template.json', 'prompts.json'];
    for (const file of requiredFiles) {
      const filePath = path.join(templateDir, file);
      if (!(await fs.pathExists(filePath))) {
        errors.push(`Required file missing: ${file}`);
      }
    }

    // Check files directory
    const filesDir = path.join(templateDir, 'files');
    if (!(await fs.pathExists(filesDir))) {
      errors.push('Required directory missing: files/');
    }

    // Validate template.json
    try {
      const templateJsonPath = path.join(templateDir, 'template.json');
      if (await fs.pathExists(templateJsonPath)) {
        const templateJson = await fs.readJson(templateJsonPath);
        if (!templateJson.name) {
          errors.push('template.json missing required field: name');
        }
        if (!templateJson.version) {
          warnings.push('template.json missing version field');
        }
      }
    } catch (_error) {
      errors.push('Invalid template.json format');
      void _error;
    }

    // Validate prompts.json
    try {
      const promptsJsonPath = path.join(templateDir, 'prompts.json');
      if (await fs.pathExists(promptsJsonPath)) {
        const promptsJson = await fs.readJson(promptsJsonPath);
        if (!Array.isArray(promptsJson.prompts)) {
          errors.push('prompts.json must have prompts array');
        }
      }
    } catch (_error) {
      errors.push('Invalid prompts.json format');
      void _error;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getGeneratedFiles(): string[] {
    return [...this.generatedFiles];
  }

  getGeneratedDirectories(): string[] {
    return [...this.generatedDirs];
  }

  cleanup(): void {
    this.generatedFiles = [];
    this.generatedDirs = [];
  }
}