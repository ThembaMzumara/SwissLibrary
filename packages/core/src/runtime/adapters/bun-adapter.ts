/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/// <reference types="bun" />
import type { RuntimeAdapter } from '../runtime-adapter.js';
import path from 'path'; // Use Node.js path module for cross-runtime compatibility
import fs from 'fs';

export class BunAdapter implements RuntimeAdapter {
  readFile(filePath: string): Promise<string> {
    return Bun.file(filePath).text();
  }

  writeFile(filePath: string, content: string): Promise<void> {
    return Bun.write(filePath, content).then(() => {}); // Convert number return to void
  }

  async readDir(dirPath: string): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      const entries = await fs.readdir(dirPath);
      return entries.filter(entry => typeof entry === 'string');
    } catch {
      console.warn('Bun.readdir not available, falling back to fs');
      return [];
    }
  }

  async exists(filePath: string): Promise<boolean> {
    return Bun.file(filePath).exists();
  }

  spawn(command: string, args: string[]): Promise<unknown> {
    return new Promise((resolve) => {
      Bun.spawn([command, ...args], {
        onExit: (code) => resolve(code)
      });
    });
  }

  exec(command: string): Promise<string> {
    const proc = Bun.spawn(['sh', '-c', command], {
      stdout: 'pipe',
      stderr: 'inherit'
    });
    return new Response(proc.stdout).text();
  }

  createServer(options: unknown): unknown {
    return Bun.serve(options as Parameters<typeof Bun.serve>[0]);
  }

  join(...paths: string[]): string {
    return path.join(...paths); // Use Node.js path
  }

  resolve(...paths: string[]): string {
    return path.resolve(...paths); // Use Node.js path
  }

  dirname(filePath: string): string {
    return path.dirname(filePath); // Use Node.js path
  }

  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext); // Use Node.js path
  }

  watchFiles(pathToWatch: string, callback: (event: string, filename: string) => void): unknown {
    try {
      // Use fs.watch as fallback since Bun.watch may not be available
      return fs.watch(pathToWatch, (event: string, filename: string | null) => {
        callback(event, filename ?? '');
      });
    } catch {
      console.warn('File watching not available');
      return null;
    }
  }

  bundle(entry: string, options: unknown): Promise<unknown> {
    const extra = (options && typeof options === 'object') ? (options as Record<string, unknown>) : {};
    return Bun.build({ entrypoints: [entry], ...extra });
  }
}