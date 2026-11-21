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
import type { TemplateMetadata } from '../types/template.types.js';

export const forgeCommand = new Command('forge')
  .description('Manage Swiss Forge templates')
  .addCommand(createListCommand())
  .addCommand(createInstallCommand())
  .addCommand(createUninstallCommand())
  .addCommand(createSearchCommand())
  .addCommand(createValidateCommand())
  .addCommand(createStatsCommand())
  .addCommand(createUpdateCommand());

function createListCommand(): Command {
  return new Command('list')
    .alias('ls')
    .description('List available templates')
    .option('-s, --source <source>', 'Filter by source (builtin, community)')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const registry = await initializeRegistry();
        let templates = await registry.listTemplates();

        // Apply filters
        if (options.source) {
          templates = templates.filter(t => t.source === options.source);
        }

        if (options.tags) {
          const tags = options.tags.split(',').map((tag: string) => tag.trim());
          templates = templates.filter(t => 
            tags.some((tag: string) => t.tags.includes(tag))
          );
        }

        if (options.json) {
          console.log(JSON.stringify(templates, null, 2));
          return;
        }

        await displayTemplates(templates);
      } catch (error) {
        console.error(chalk.red('Error listing templates:'), error);
        process.exit(1);
      }
    });
}

function createInstallCommand(): Command {
  return new Command('install')
    .description('Install a template')
    .argument('<template>', 'Template URL or local path')
    .option('-n, --name <name>', 'Custom template name')
    .action(async (template, options) => {
      try {
        const registry = await initializeRegistry();
        
        console.log(chalk.blue(`Installing template: ${template}`));
        
        const installedPath = await registry.installTemplate(template, options.name);
        
        console.log(chalk.green(`✅ Template installed successfully`));
        console.log(chalk.cyan(`Path: ${installedPath}`));
        
        // Update registry
        await registry.updateRegistry();
        
      } catch (error) {
        console.error(chalk.red('Error installing template:'), error);
        process.exit(1);
      }
    });
}

function createUninstallCommand(): Command {
  return new Command('uninstall')
    .description('Uninstall a template')
    .argument('<template>', 'Template type to uninstall')
    .option('-f, --force', 'Force uninstall without confirmation')
    .action(async (templateType, options) => {
      try {
        const registry = await initializeRegistry();
        
        const template = await registry.getTemplate(templateType);
        if (!template) {
          console.error(chalk.red(`Template "${templateType}" not found`));
          process.exit(1);
        }

        if (template.source === 'builtin') {
          console.error(chalk.red('Cannot uninstall built-in templates'));
          process.exit(1);
        }

        if (!options.force) {
          const answers = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to uninstall "${template.name}"?`,
              default: false
            }
          ]);

          if (!answers.confirm) {
            console.log(chalk.yellow('Uninstall cancelled'));
            return;
          }
        }

        await registry.uninstallTemplate(templateType);
        await registry.updateRegistry();

      } catch (error) {
        console.error(chalk.red('Error uninstalling template:'), error);
        process.exit(1);
      }
    });
}

function createSearchCommand(): Command {
  return new Command('search')
    .description('Search for templates')
    .argument('<query>', 'Search query')
    .option('--json', 'Output as JSON')
    .action(async (query, options) => {
      try {
        const registry = await initializeRegistry();
        const templates = await registry.searchTemplates(query);

        if (options.json) {
          console.log(JSON.stringify(templates, null, 2));
          return;
        }

        if (templates.length === 0) {
          console.log(chalk.yellow(`No templates found matching: "${query}"`));
          return;
        }

        console.log(chalk.blue(`Found ${templates.length} template(s) matching: "${query}"\n`));
        await displayTemplates(templates);

      } catch (error) {
        console.error(chalk.red('Error searching templates:'), error);
        process.exit(1);
      }
    });
}

function createValidateCommand(): Command {
  return new Command('validate')
    .description('Validate a template')
    .argument('<template-path>', 'Path to template directory')
    .action(async (templatePath) => {
      try {
        const registry = await initializeRegistry();
        const isValid = await registry.validateTemplate(templatePath);

        if (isValid) {
          console.log(chalk.green(`✅ Template is valid: ${templatePath}`));
        } else {
          console.log(chalk.red(`❌ Template is invalid: ${templatePath}`));
          process.exit(1);
        }

      } catch (error) {
        console.error(chalk.red('Error validating template:'), error);
        process.exit(1);
      }
    });
}

function createStatsCommand(): Command {
  return new Command('stats')
    .description('Show template statistics')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const registry = await initializeRegistry();
        const stats = await registry.getTemplateStats();

        if (options.json) {
          console.log(JSON.stringify(stats, null, 2));
          return;
        }

        console.log(chalk.blue('Template Statistics:'));
        console.log(chalk.green(`  Built-in templates: ${stats.builtin}`));
        console.log(chalk.green(`  Community templates: ${stats.community}`));
        console.log(chalk.green(`  Total templates: ${stats.total}`));

      } catch (error) {
        console.error(chalk.red('Error getting template stats:'), error);
        process.exit(1);
      }
    });
}

function createUpdateCommand(): Command {
  return new Command('update')
    .description('Update template registry')
    .action(async () => {
      try {
        const registry = await initializeRegistry();
        await registry.updateRegistry();
        
        console.log(chalk.green('✅ Template registry updated'));

      } catch (error) {
        console.error(chalk.red('Error updating registry:'), error);
        process.exit(1);
      }
    });
}

async function initializeRegistry(): Promise<Registry> {
  const registry = new Registry({
    registryPath: path.join(__dirname, '../../templates-registry'),
    templatesPath: path.join(__dirname, '../../templates')
  });

  await registry.initialize();
  return registry;
}

async function displayTemplates(templates: TemplateMetadata[]): Promise<void> {
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates found'));
      return;
    }
  
    console.log(chalk.blue(`Found ${templates.length} template(s):\n`));
  
    for (const template of templates) {
      console.log(chalk.green(`📦 ${template.name}`));
      console.log(chalk.gray(`   Type: ${template.type}`));
      console.log(chalk.gray(`   Description: ${template.description}`));
      console.log(chalk.gray(`   Source: ${template.source}`));
      console.log(chalk.gray(`   Version: ${template.version}`));
      
      if (template.tags && template.tags.length > 0) {
        console.log(chalk.gray(`   Tags: ${template.tags.join(', ')}`));
      }
      
      if (template.author) {
        console.log(chalk.gray(`   Author: ${template.author}`));
      }
      
      if (template.repository) {
        console.log(chalk.gray(`   Repository: ${template.repository}`));
      }
      
      console.log(); // Empty line between templates
    }
  }