/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Registry } from '../forge/registry.js';
import { TemplateEngine } from '../forge/template-engine.js';
import { PromptEngine } from '../forge/prompt-engine.js';
import { FileGenerator } from '../forge/file-generator.js';
import { DependencyManager } from '../forge/dependency-manager.js';
import type { TemplateMetadata, GenerationOptions } from '../types/index.js';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname for resolving template paths at runtime
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createCommand = new Command('create')
  .description('Create a new project from a template')
  .argument('[project-name]', 'Name of the project to create')
  .option('-t, --template <template>', 'Template to use')
  .option('-o, --output <path>', 'Output directory')
  .option('--skip-install', 'Skip dependency installation')
  .option('--skip-git', 'Skip git initialization')
  .option('--overwrite', 'Overwrite existing files')
  .option('--list', 'List available templates')
  .action(async (projectName: string | undefined, options: Record<string, unknown>) => {
    try {
      console.log(chalk.blue('🧀 SwissJS Project Creator'));
      console.log(chalk.gray('Creating your new SwissJS project...\n'));

      // Initialize registry
      const registry = new Registry({
        // When compiled, __dirname is packages/cli/dist/commands
        // Go up two levels to reach the package root (dist -> cli), then into templates*/
        // dist/commands -> dist -> (..) cli -> templates*
        registryPath: path.join(__dirname, '../../templates-registry'),
        templatesPath: path.join(__dirname, '../../templates')
      });

      await registry.initialize();

      // List templates if requested
      if (options.list === true) {
        await listTemplates(registry);
        return;
      }

      // Interactive template selection if not specified
      let selectedTemplate: TemplateMetadata;
      const templateOpt = options.template ? String(options.template) : '';
      if (templateOpt) {
        const template = await registry.getTemplate(templateOpt);
        if (!template) {
          console.error(chalk.red(`Template "${templateOpt}" not found`));
          process.exit(1);
        }
        selectedTemplate = template;
      } else {
        selectedTemplate = await selectTemplate(registry);
      }

      // Get project name if not provided
      if (!projectName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            default: 'my-swissjs-project',
            validate: (input: string) => {
              if (!input.trim()) {
                return 'Project name is required';
              }
              if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                return 'Project name must contain only letters, numbers, hyphens, and underscores';
              }
              return true;
            }
          }
        ]);
        projectName = answers.projectName;
      }

      // Ensure projectName is a defined string from here on
      const projectNameStr: string = projectName as string;

      // Determine output path
      const outputPath = String(options.output ?? path.join(process.cwd(), projectNameStr));

      // Run template prompts
      const promptEngine = new PromptEngine();
      const templateVariables = await promptEngine.runPrompts(
        selectedTemplate.path,
        { projectName: projectNameStr }
      );

      // Generate project
      await generateProject({
        template: selectedTemplate,
        projectName: projectNameStr,
        outputPath,
        variables: templateVariables as Record<string, unknown>,
        options: {
          skipInstall: options.skipInstall === true,
          skipGit: options.skipGit === true,
          overwrite: options.overwrite === true
        }
      });

      console.log(chalk.green(`\n✅ Project "${projectName}" created successfully!`));
      console.log(chalk.cyan(`\nNext steps:`));
      console.log(chalk.white(`  cd ${projectNameStr}`));
      
      if (options.skipInstall === true) {
        console.log(chalk.white(`  npm install`));
      }
      
      console.log(chalk.white(`  npm run dev`));

    } catch (error: unknown) {
      console.error(chalk.red('Error creating project:'), error);
      process.exit(1);
    }
  });

async function listTemplates(registry: Registry): Promise<void> {
  const templates = await registry.listTemplates();
  
  if (templates.length === 0) {
    console.log(chalk.yellow('No templates found'));
    return;
  }

  console.log(chalk.bold('\nAvailable Templates:\n'));
  
  // Group templates by source
  const builtin = templates.filter(t => t.source === 'builtin');
  const community = templates.filter(t => t.source === 'community');

  if (builtin.length > 0) {
    console.log(chalk.blue('Built-in Templates:'));
    builtin.forEach(template => {
      console.log(`  ${chalk.green(template.type)} - ${template.description}`);
      if (template.tags.length > 0) {
        console.log(`    ${chalk.gray('Tags:')} ${template.tags.join(', ')}`);
      }
    });
    console.log();
  }

  if (community.length > 0) {
    console.log(chalk.blue('Community Templates:'));
    community.forEach(template => {
      console.log(`  ${chalk.green(template.type)} - ${template.description}`);
      if (template.author) {
        console.log(`    ${chalk.gray('Author:')} ${template.author}`);
      }
      if (template.tags.length > 0) {
        console.log(`    ${chalk.gray('Tags:')} ${template.tags.join(', ')}`);
      }
    });
  }
}

async function selectTemplate(registry: Registry): Promise<TemplateMetadata> {
  const templates = await registry.listTemplates();
  
  if (templates.length === 0) {
    console.error(chalk.red('No templates available'));
    process.exit(1);
  }

  // Create choices for inquirer
  const choices = templates.map(template => ({
    name: `${template.name} - ${template.description}`,
    value: template,
    short: template.name
  }));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices,
      pageSize: 10
    }
  ]);

  return answers.template;
}

async function generateProject(params: {
  template: TemplateMetadata;
  projectName: string;
  outputPath: string;
  variables: Record<string, unknown>;
  options: {
    skipInstall?: boolean;
    skipGit?: boolean;
    overwrite?: boolean;
  };
}): Promise<void> {
  const { template, projectName, outputPath, variables, options } = params;

  console.log(chalk.blue(`\nGenerating project from template: ${template.name}`));

  // Initialize engines
  const templateEngine = new TemplateEngine();
  const fileGenerator = new FileGenerator(templateEngine);
  const dependencyManager = new DependencyManager();

  // Generate files
  const generationOptions: GenerationOptions = {
    outputPath,
    templatePath: template.path,
    variables: {
      ...variables,
      projectName,
      timestamp: new Date().toISOString()
    },
    overwrite: options.overwrite,
    skipInstall: options.skipInstall,
    skipGit: options.skipGit
  };

  const result = await fileGenerator.generateFiles(generationOptions);

  if (!result.success) {
    console.error(chalk.red('File generation failed:'));
    result.errors.forEach((error: string) => console.error(chalk.red(`  - ${error}`)));
    process.exit(1);
  }

  console.log(chalk.green(`Created ${result.filesCreated.length} files`));
  if (result.filesSkipped.length > 0) {
    console.log(chalk.yellow(`Skipped ${result.filesSkipped.length} files`));
  }

  // Install dependencies
  if (!options.skipInstall) {
    console.log(chalk.blue('\nInstalling dependencies...'));
    
    const dependencies = Object.keys(template.dependencies || {});
    const devDependencies = Object.keys(template.devDependencies || {});

    if (dependencies.length > 0) {
      await dependencyManager.installDependencies(
        outputPath,
        dependencies,
        { packageManager: 'npm', dev: false }
      );
    }

    if (devDependencies.length > 0) {
      await dependencyManager.installDependencies(
        outputPath,
        devDependencies,
        { packageManager: 'npm', dev: true }
      );
    }
  }

  // Initialize git
  if (!options.skipGit) {
    console.log(chalk.blue('\nInitializing git repository...'));
    await dependencyManager.initGit(outputPath);
  }
}