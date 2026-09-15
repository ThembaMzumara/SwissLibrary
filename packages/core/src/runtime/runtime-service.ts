/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * SwissJS Runtime Service Layer
 * Provides unified APIs for both Node.js and Bun.js
 */

import { runtimeDetector } from './runtime-detector.js';
import type { RuntimeAdapter } from './runtime-adapter.js';

export class RuntimeService {
  private adapter: RuntimeAdapter | null = null;
  private capabilities = runtimeDetector.getCapabilities();

  constructor() {
    // Only create adapter in server environments
    if (runtimeDetector.isServer()) {
      this.initializeAdapter();
    }
  }

  private async initializeAdapter() {
    try {
      this.adapter = await this.createAdapter();
    } catch (error) {
      console.warn('Failed to initialize runtime adapter:', error);
    }
  }

  private async createAdapter(): Promise<RuntimeAdapter> {
    const runtimeType = runtimeDetector.getRuntimeType();
    
    // Don't load adapters in browser environment
    if (runtimeType === 'browser') {
      throw new Error('Runtime adapters are not available in browser environment');
    }
    
    switch (runtimeType) {
      case 'bun': {
        const { BunAdapter } = await import('./adapters/bun-adapter.js');
        return new BunAdapter();
      }
      case 'node': {
        const { NodeAdapter } = await import('./adapters/node-adapter.js');
        return new NodeAdapter();
      }
      default: throw new Error(`Unsupported runtime: ${runtimeType}`);
    }
  }

  private ensureAdapter(): RuntimeAdapter {
    if (!this.adapter) {
      throw new Error('Runtime adapter not available in browser environment');
    }
    return this.adapter;
  }

  // File System
  readFile(path: string): Promise<string> {
    return this.ensureAdapter().readFile(path);
  }

  writeFile(path: string, content: string): Promise<void> {
    return this.ensureAdapter().writeFile(path, content);
  }

  readDir(path: string): Promise<string[]> {
    return this.ensureAdapter().readDir(path);
  }

  exists(path: string): Promise<boolean> {
    return this.ensureAdapter().exists(path);
  }

  // Process Management
  spawn(command: string, args: string[]): Promise<unknown> {
    return this.ensureAdapter().spawn(command, args);
  }

  exec(command: string): Promise<string> {
    return this.ensureAdapter().exec(command);
  }

  // Networking
  createServer(options: unknown): unknown {
    return this.ensureAdapter().createServer(options);
  }

  // Path Operations
  join(...paths: string[]): string {
    return this.ensureAdapter().join(...paths);
  }

  resolve(...paths: string[]): string {
    return this.ensureAdapter().resolve(...paths);
  }

  dirname(path: string): string {
    return this.ensureAdapter().dirname(path);
  }

  basename(path: string, ext?: string): string {
    return this.ensureAdapter().basename(path, ext);
  }

  // Development Tools
  watchFiles(path: string, callback: (event: string, filename: string) => void): unknown {
    return this.ensureAdapter().watchFiles(path, callback);
  }

  // Bundling
  bundle(entry: string, options: unknown): Promise<unknown> {
    return this.ensureAdapter().bundle(entry, options);
  }

  // Runtime Information
  getRuntimeType(): string {
    return this.capabilities.type;
  }

  getCapabilities() {
    return this.capabilities;
  }
}

export const runtimeService = new RuntimeService(); 