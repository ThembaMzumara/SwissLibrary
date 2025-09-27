/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Consolidated runtime-related types

export type RuntimeType = 'node' | 'bun' | 'unknown';

export interface RuntimeCapabilities {
  type: RuntimeType;
  version: string;
  features: {
    fileSystem: boolean;
    networking: boolean;
    bundling: boolean;
    testing: boolean;
    packageManagement: boolean;
    typescript: boolean;
    ssr: boolean;
  };
  performance: {
    startupTime: number;
    fileIoSpeed: number;
    memoryUsage: number;
  };
}

export interface RuntimeAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  readDir(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  spawn(command: string, args: string[]): Promise<unknown>;
  exec(command: string): Promise<string>;
  createServer(options: unknown): unknown;
  join(...paths: string[]): string;
  resolve(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string, ext?: string): string;
  watchFiles(path: string, callback: (event: string, filename: string) => void): unknown;
  bundle(entry: string, options: unknown): Promise<unknown>;
}

export interface DevServerOptions {
  port?: number;
  host?: string;
  open?: boolean;
  https?: boolean;
  watch?: string[];
  hotReload?: boolean;
  compileOnChange?: boolean;
}

export interface DevServerContext {
  app: unknown;
  plugins: unknown[];
  routes: unknown[];
  middleware: unknown[];
  watchers: unknown[];
}
