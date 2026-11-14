/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Example: Using SwissJS Enhanced Framework with File Router Plugin
 * 
 * This example demonstrates how to use the enhanced framework with:
 * - SwissApp for app-level plugin registration
 * - Enhanced plugin context with routing and development capabilities
 * - File router plugin integration
 * - Runtime detection and services
 */

import { SwissApp, DevServerService } from './index.js';

// Define types for better type safety
interface RouteHandler {
  (req: Request): Response | Promise<Response>;
}

interface FileWatchEvent {
  event: 'add'|'change'|'unlink';
  file: string;
}

interface PluginContext {
  app: {
    registerRoute(path: string, handler: RouteHandler): void;
  };
  dev?: {
    watchFiles(paths: string[], callback: (event: FileWatchEvent['event'], file: string) => void): void;
  };
  runtime?: {
    type: 'bun'|'node'|'deno';
    getAdapter?(): unknown;
  };
}

interface Server {
  port: number;
  host: string;
  close(): Promise<void>;
}

// Example 1: Basic app setup with file router
export async function createBasicApp() {
  // Create app instance
  const app = SwissApp.getInstance('my-app');
  
  // Register plugins
  app.registerPlugins([]);
  
  // Start the app
  app.start();
  
  return app;
}

// Example 2: Development server with file router
export async function createDevApp() {
  const app = SwissApp.getInstance('dev-app');
  
  // Get development server service
  const devServer = DevServerService.getInstance();
  
  // Register plugins
  app.registerPlugins([]);
  
  // Start development server
  await devServer.start({
    port: 3000,
    host: 'localhost',
    hotReload: true,
    watch: ['./src/routes', './src/components']
  });
  
  // Start the app
  app.start();
  
  return { app, devServer };
}

// Example 3: Production app with SSR
export async function createProductionApp() {
  const app = SwissApp.getInstance('prod-app');
  
  // Register plugins for production
  app.registerPlugins([]);
  
  // Start the app
  app.start();
  
  return app;
}

// Example 4: Custom plugin with enhanced context
export const customPlugin = {
  name: 'custom-plugin',
  version: '1.0.0',
  
  init(context: PluginContext) {
    // Use enhanced context capabilities
    if (context.app) {
      context.app.registerRoute('/custom', () => {
        return new Response('Custom route handler');
      });
    }
    
    if (context.dev?.watchFiles) {
      context.dev.watchFiles(['./src/custom'], (event: FileWatchEvent['event'], file: string) => {
        console.log(`Custom file changed: ${file}`);
      });
    }
  },
  
  onDevServerStart(_context: PluginContext, _server: Server) {
    void _context;
    void _server;
    console.log('Custom plugin: Dev server started');
  }
};

// Example 5: Runtime-aware plugin
export const runtimePlugin = {
  name: 'runtime-plugin',
  version: '1.0.0',
  
  init(context: PluginContext) {
    if (context.runtime) {
      console.log(`Running on ${context.runtime.type} runtime`);
      
      if (context.runtime.type === 'bun') {
        // Use Bun-specific optimizations
        console.log('Using Bun optimizations');
      } else if (context.runtime.type === 'node') {
        // Use Node.js-specific features
        console.log('Using Node.js features');
      }
    }
  }
};