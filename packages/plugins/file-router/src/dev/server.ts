/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { DevServerOptions, DevServer } from '../types/index.js';

// DevServer interface is imported from the types barrel

export async function createDevServer(options: DevServerOptions = {}): Promise<DevServer> {
  const { port = 3000, hotReload = true, middleware = [], routes = {} } = options;
  void hotReload; // reference to satisfy no-unused-vars if not used
  
  // Import express conditionally
  const express = await import('express');
  const app = express.default();
  
  // Add middleware with guard
  middleware.forEach((mw) => {
    if (typeof mw === 'function') {
      app.use(mw as unknown as Parameters<typeof app.use>[0]);
    }
  });
  
  // Add custom routes
  Object.entries(routes).forEach(([path, handler]) => {
    if (typeof handler === 'function') {
      app.get(path, handler as unknown as Parameters<typeof app.get>[1]);
    }
  });
  
  let server: unknown;
  
  return {
    port,
    
    async start() {
      return new Promise<void>((resolve, reject) => {
        server = app.listen(port, () => {
          console.log(`🚀 File Router Dev Server running on http://localhost:${port}`);
          resolve();
        });
        
        (server as { on: (event: string, cb: (err?: unknown) => void) => void }).on('error', reject);
      });
    },
    
    async stop() {
      if (server) {
        return new Promise<void>((resolve) => {
          (server as { close: (cb: () => void) => void }).close(() => resolve());
        });
      }
    }
  };
} 