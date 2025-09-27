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
import { BunAdapter } from './adapters/bun-adapter.js';
import { NodeAdapter } from './adapters/node-adapter.js';
import type { RuntimeAdapter } from './runtime-adapter.js';

export class RuntimeService {
  private adapter: RuntimeAdapter;
  private capabilities = runtimeDetector.getCapabilities();

  constructor() {
    this.adapter = this.createAdapter();
  }

  private createAdapter(): RuntimeAdapter {
    switch (runtimeDetector.getRuntimeType()) {
      case 'bun': return new BunAdapter();
      case 'node': return new NodeAdapter();
      default: throw new Error('Unsupported runtime');
    }
  }

  // File System
  readFile(path: string): Promise<string> {
    return this.adapter.readFile(path);
  }

  writeFile(path: string, content: string): Promise<void> {
    return this.adapter.writeFile(path, content);
  }

  readDir(path: string): Promise<string[]> {
    return this.adapter.readDir(path);
  }

  exists(path: string): Promise<boolean> {
    return this.adapter.exists(path);
  }

  // Process Management
  spawn(command: string, args: string[]): Promise<unknown> {
    return this.adapter.spawn(command, args);
  }

  exec(command: string): Promise<string> {
    return this.adapter.exec(command);
  }

  // Networking
  createServer(options: unknown): unknown {
    return this.adapter.createServer(options);
  }

  // Path Operations
  join(...paths: string[]): string {
    return this.adapter.join(...paths);
  }

  resolve(...paths: string[]): string {
    return this.adapter.resolve(...paths);
  }

  dirname(path: string): string {
    return this.adapter.dirname(path);
  }

  basename(path: string, ext?: string): string {
    return this.adapter.basename(path, ext);
  }

  // Development Tools
  watchFiles(path: string, callback: (event: string, filename: string) => void): unknown {
    return this.adapter.watchFiles(path, callback);
  }

  // Bundling
  bundle(entry: string, options: unknown): Promise<unknown> {
    return this.adapter.bundle(entry, options);
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