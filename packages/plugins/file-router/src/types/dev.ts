/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export interface WatcherConfig {
  /** Directory to watch */
  directory: string;
  
  /** File extensions to watch */
  extensions?: string[];
  
  /** Ignore patterns */
  ignore?: string[];
}

export interface DevServerOptions {
  /** Development server port */
  port?: number;
  
  /** Enable hot reload */
  hotReload?: boolean;
  
  /** Custom middleware */
  middleware?: unknown[];
  
  /** Custom routes */
  routes?: Record<string, unknown>;
}

// Runtime dev types
export interface FileWatcher {
  on(event: 'change' | 'add' | 'remove', handler: (path: string) => void): void;
  close(): Promise<void>;
}

export interface DevServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  port: number;
}