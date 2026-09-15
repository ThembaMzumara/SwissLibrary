/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import type { TemplateMetadata, TemplateRegistry, RegistryConfig } from '../types/index.js';

export class Registry {
  private registryPath: string;
  private templatesPath: string;
  private config: RegistryConfig;

  constructor(config: RegistryConfig) {
    this.config = config;
    this.registryPath = config.registryPath;
    this.templatesPath = config.templatesPath;
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.templatesPath);
    await fs.ensureDir(path.join(this.templatesPath, 'community'));
    
    // Initialize registry index if it doesn't exist
    const registryIndexPath = path.join(this.registryPath, 'registry.json');
    if (!(await fs.pathExists(registryIndexPath))) {
      await this.createDefaultRegistry();
    }
  }

  private async createDefaultRegistry(): Promise<void> {
    const defaultRegistry: TemplateRegistry = {
      version: '1.0.0',
      templates: [],
      lastUpdated: new Date().toISOString()
    };

    await fs.writeJson(
      path.join(this.registryPath, 'registry.json'),
      defaultRegistry,
      { spaces: 2 }
    );
  }

  async listTemplates(): Promise<TemplateMetadata[]> {
    const builtInTemplates = await this.getBuiltInTemplates();
    const communityTemplates = await this.getCommunityTemplates();
    
    return [...builtInTemplates, ...communityTemplates];
  }

  async getBuiltInTemplates(): Promise<TemplateMetadata[]> {
    const templates: TemplateMetadata[] = [];
    const templatesDir = path.join(this.templatesPath);
    
    if (!(await fs.pathExists(templatesDir))) {
      return templates;
    }

    const entries = await fs.readdir(templatesDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'community') {
        const templatePath = path.join(templatesDir, entry.name);
        const metadata = await this.readTemplateMetadata(templatePath);
        
        if (metadata) {
          templates.push({
            ...metadata,
            source: 'builtin',
            path: templatePath
          });
        }
      }
    }

    return templates;
  }

  async getCommunityTemplates(): Promise<TemplateMetadata[]> {
    const templates: TemplateMetadata[] = [];
    const communityDir = path.join(this.templatesPath, 'community');
    
    if (!(await fs.pathExists(communityDir))) {
      return templates;
    }

    const entries = await fs.readdir(communityDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const templatePath = path.join(communityDir, entry.name);
        const metadata = await this.readTemplateMetadata(templatePath);
        
        if (metadata) {
          templates.push({
            ...metadata,
            source: 'community',
            path: templatePath
          });
        }
      }
    }

    return templates;
  }

  private async readTemplateMetadata(templatePath: string): Promise<TemplateMetadata | null> {
    try {
      const metadataPath = path.join(templatePath, 'template.json');
      
      if (!(await fs.pathExists(metadataPath))) {
        return null;
      }

      const metadata = await fs.readJson(metadataPath);
      
      return {
        name: metadata.name,
        type: metadata.type || path.basename(templatePath),
        version: metadata.version || '1.0.0',
        description: metadata.description || '',
        author: metadata.author || '',
        tags: metadata.tags || [],
        capabilities: metadata.capabilities || [],
        dependencies: metadata.dependencies || {},
        devDependencies: metadata.devDependencies || {},
        source: 'community',
        path: templatePath,
        createdAt: metadata.createdAt || new Date().toISOString(),
        updatedAt: metadata.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.warn(`Failed to read template metadata from ${templatePath}:`, error);
      return null;
    }
  }

  async getTemplate(type: string): Promise<TemplateMetadata | null> {
    const templates = await this.listTemplates();
    return templates.find(t => t.type === type) || null;
  }

  async installTemplate(templateUrl: string, templateName?: string): Promise<string> {
    // This would typically download from a URL or registry
    // For now, we'll support local path installation
    
    if (templateUrl.startsWith('http')) {
      return await this.downloadTemplate(templateUrl, templateName);
    } else {
      return await this.linkLocalTemplate(templateUrl, templateName);
    }
  }

  private async downloadTemplate(url: string, templateName?: string): Promise<string> {
    void url;
    void templateName;
    // TODO: Implement actual download logic
    // This would typically:
    // 1. Download tar/zip from URL
    // 2. Extract to community directory
    // 3. Validate template structure
    // 4. Update registry
    
    throw new Error('Template download not implemented yet');
  }

  private async linkLocalTemplate(localPath: string, templateName?: string): Promise<string> {
    if (!(await fs.pathExists(localPath))) {
      throw new Error(`Template path does not exist: ${localPath}`);
    }

    const metadata = await this.readTemplateMetadata(localPath);
    if (!metadata) {
      throw new Error(`Invalid template structure at: ${localPath}`);
    }

    const name = templateName || metadata.name || path.basename(localPath);
    const targetPath = path.join(this.templatesPath, 'community', name);

    if (await fs.pathExists(targetPath)) {
      throw new Error(`Template already exists: ${name}`);
    }

    await fs.copy(localPath, targetPath);
    
    console.log(chalk.green(`✅ Template installed: ${name}`));
    return targetPath;
  }

  async uninstallTemplate(templateType: string): Promise<void> {
    const template = await this.getTemplate(templateType);
    
    if (!template) {
      throw new Error(`Template not found: ${templateType}`);
    }

    if (template.source === 'builtin') {
      throw new Error(`Cannot uninstall built-in template: ${templateType}`);
    }

    await fs.remove(template.path);
    console.log(chalk.green(`✅ Template uninstalled: ${templateType}`));
  }

  async updateRegistry(): Promise<void> {
    const registry = await this.getRegistryData();
    const templates = await this.listTemplates();
    
    // Update registry with current templates
    registry.templates = templates.map(t => ({
      name: t.name,
      type: t.type,
      version: t.version,
      description: t.description,
      author: t.author,
      tags: t.tags,
      source: t.source,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));
    
    registry.lastUpdated = new Date().toISOString();
    
    await fs.writeJson(
      path.join(this.registryPath, 'registry.json'),
      registry,
      { spaces: 2 }
    );
    
    console.log(chalk.green('✅ Registry updated'));
  }

  async getRegistryData(): Promise<TemplateRegistry> {
    const registryPath = path.join(this.registryPath, 'registry.json');
    
    if (!(await fs.pathExists(registryPath))) {
      await this.createDefaultRegistry();
    }
    
    return await fs.readJson(registryPath);
  }

  async validateTemplate(templatePath: string): Promise<boolean> {
    try {
      // Check required files exist
      const requiredFiles = ['template.json', 'prompts.json'];
      for (const file of requiredFiles) {
        const filePath = path.join(templatePath, file);
        if (!(await fs.pathExists(filePath))) {
          console.warn(`Missing required file: ${file}`);
          return false;
        }
      }

      // Check files directory exists
      const filesDir = path.join(templatePath, 'files');
      if (!(await fs.pathExists(filesDir))) {
        console.warn('Missing files directory');
        return false;
      }

      // Validate template.json structure
      const metadata = await this.readTemplateMetadata(templatePath);
      if (!metadata || !metadata.name || !metadata.type) {
        console.warn('Invalid template metadata');
        return false;
      }

      // Validate prompts.json structure
      const promptsPath = path.join(templatePath, 'prompts.json');
      const prompts = await fs.readJson(promptsPath);
      if (!Array.isArray(prompts)) {
        console.warn('Invalid prompts configuration');
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Template validation failed:', error);
      return false;
    }
  }

  async searchTemplates(query: string): Promise<TemplateMetadata[]> {
    const templates = await this.listTemplates();
    const searchTerm = query.toLowerCase();
    
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm)) ||
      template.type.toLowerCase().includes(searchTerm)
    );
  }

  async publishTemplate(templatePath: string, registryUrl?: string): Promise<void> {
    void registryUrl;
    // Validate template before publishing
    if (!(await this.validateTemplate(templatePath))) {
      throw new Error('Template validation failed');
    }

    // TODO: Implement actual publishing logic
    // This would typically:
    // 1. Package template into tar/zip
    // 2. Upload to registry
    // 3. Update registry index
    
    throw new Error('Template publishing not implemented yet');
  }

  async getTemplateStats(): Promise<{ builtin: number; community: number; total: number }> {
    const builtin = await this.getBuiltInTemplates();
    const community = await this.getCommunityTemplates();
    
    return {
      builtin: builtin.length,
      community: community.length,
      total: builtin.length + community.length
    };
  }
}