/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * SwissJS Development Server Service
 * Provides unified development server capabilities for plugins
 */

import { RuntimeDetector } from './runtime-detector.js';
import { runtimeService } from './runtime-service.js';
import type { DevServerOptions, DevServerContext } from './types/index.js';

export class DevServerService {
  private static instance: DevServerService;
  private runtime: RuntimeDetector;
  private server: unknown = null;
  private context: DevServerContext | null = null;
  private watchers: Map<string, unknown> = new Map();

  private constructor() {
    this.runtime = RuntimeDetector.getInstance();
  }

  static getInstance(): DevServerService {
    if (!DevServerService.instance) {
      DevServerService.instance = new DevServerService();
    }
    return DevServerService.instance;
  }

  /**
   * Initialize development server
   */
  async init(options: DevServerOptions = {}) {
    const {
      port = 3000,
      host = 'localhost',
      open = false,
      https = false,
      watch = [],
      hotReload = true,
      compileOnChange = true
    } = options;

    this.context = {
      app: null,
      plugins: [],
      routes: [],
      middleware: [],
      watchers: []
    };

    // Set up file watchers
    if (watch.length > 0) {
      await this.setupWatchers(watch, hotReload);
    }

    return {
      port,
      host,
      open,
      https,
      hotReload,
      compileOnChange,
      context: this.context
    };
  }

  /**
   * Start development server
   */
  async start(options: DevServerOptions = {}) {
    const config = await this.init(options);
    
    if (this.runtime.isNode()) {
      return await this.startNodeServer(config);
    } else if (this.runtime.isBun()) {
      return await this.startBunServer(config);
    } else {
      throw new Error('Unsupported runtime for development server');
    }
  }

  /**
   * Stop development server
   */
  async stop() {
    if (this.server) {
      if (this.runtime.isNode()) {
        (this.server as unknown as { close: () => void }).close();
      } else if (this.runtime.isBun()) {
        (this.server as unknown as { stop: (force?: boolean) => void }).stop(true);
      }
      this.server = null;
    }

    // Stop all watchers
    for (const [, watcher] of this.watchers) {
      if (watcher && typeof (watcher as { close?: () => void }).close === 'function') {
        (watcher as { close: () => void }).close();
      }
    }
    this.watchers.clear();
  }

  /**
   * Register routes with the dev server
   */
  registerRoutes(routes: unknown[]) {
    if (this.context) {
      this.context.routes.push(...routes);
    }
  }

  /**
   * Register middleware with the dev server
   */
  registerMiddleware(middleware: unknown[]) {
    if (this.context) {
      this.context.middleware.push(...middleware);
    }
  }

  /**
   * Watch files for changes
   */
  async watchFiles(paths: string[], callback: (event: string, file: string) => void) {
    const adapter: unknown = this.runtime.getAdapter();
    
    // Ensure adapter has watchFiles capability
    if (!adapter || typeof (adapter as { watchFiles?: unknown }).watchFiles !== 'function') {
      console.warn('Current runtime adapter does not support watchFiles');
      return;
    }
    
    for (const path of paths) {
      const watcher = (adapter as { watchFiles: (p: string, cb: (e: string, f: string) => void) => unknown }).watchFiles(path, callback);
      this.watchers.set(path, watcher);
    }
  }

  /**
   * Set up file watchers
   */
  private async setupWatchers(paths: string[], hotReload: boolean) {
    if (!hotReload) return;

    await this.watchFiles(paths, (event, file) => {
      console.log(`🔄 File changed: ${file} (${event})`);
      
      // Trigger hot reload
      this.triggerHotReload(file);
    });
  }

  /**
   * Trigger hot reload for changed file
   */
  private triggerHotReload(file: string) {
    // Notify plugins about file change
    if (this.context) {
      this.context.watchers.forEach(watcher => {
        if (typeof watcher === 'function') {
          watcher('change', file);
        }
      });
    }
  }

  /**
   * Start Node.js development server
   */
  private async startNodeServer(config: { port: number; host: string; open?: boolean; https?: boolean }) {
    try {
      // Dynamic import for Vite
      const { createServer } = await import('vite');
      
      const viteConfig = {
        root: runtimeService.resolve('.'),
        server: {
          port: config.port,
          host: config.host,
          open: config.open,
          https: config.https ? {} : false
        },
        plugins: [
          // SwissJS Vite plugin would be imported here
        ],
        optimizeDeps: {
          include: ['@swissjs/core']
        }
      };

      this.server = await createServer(viteConfig);
      await (this.server as { listen: () => Promise<void> }).listen();
      
      console.log(`🚀 Development server running at http://${config.host}:${config.port}`);
      
      return this.server;
    } catch (error) {
      console.error('Failed to start Node.js development server:', error);
      throw error;
    }
  }

  /**
   * Start Bun.js development server
   */
  private async startBunServer(config: { port: number; host: string; open?: boolean; https?: boolean }) {
    try {
      const adapter: unknown = this.runtime.getAdapter();
      
      // Ensure adapter has createServer capability
      if (!adapter || typeof (adapter as { createServer?: unknown }).createServer !== 'function') {
        throw new Error('Current runtime adapter does not support createServer');
      }
      
      this.server = (adapter as { createServer: (opts: unknown) => unknown }).createServer({
        port: config.port,
        hostname: config.host,
        fetch: (req: Request) => {
          return this.handleRequest(req);
        }
      });

      console.log(`🚀 Development server running at http://${config.host}:${config.port}`);
      
      return this.server;
    } catch (error) {
      console.error('Failed to start Bun.js development server:', error);
      throw error;
    }
  }

  /**
   * Handle incoming requests
   */
  private handleRequest(req: Request): Response {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Apply middleware
    for (const middleware of (this.context?.middleware as unknown[] | undefined) || []) {
      const fn = middleware as (r: Request) => Response | void;
      const result = fn(req);
      if (result instanceof Response) {
        return result;
      }
    }

    // Match routes
    for (const route of (this.context?.routes as unknown[] | undefined) || []) {
      const r = route as { path?: string; pattern?: RegExp; handler: (req: Request) => Response };
      if (r.path === pathname || (r.pattern && r.pattern.test(pathname))) {
        return r.handler(req);
      }
    }

    // Default response
    return new Response('Not Found', { status: 404 });
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      running: this.server !== null,
      runtime: this.runtime.getRuntimeType(),
      context: this.context
    };
  }
}