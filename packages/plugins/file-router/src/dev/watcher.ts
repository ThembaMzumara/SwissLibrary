/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { WatcherConfig, FileWatcher } from '../types/index.js';

export async function createFileWatcher(config: WatcherConfig): Promise<FileWatcher> {
  const { directory, extensions = ['.ui'] } = config;
  
  // Use Node.js fs.watch for compatibility
  const fs = await import('fs');
  const path = await import('path');
  
  const watcher = fs.watch(directory, { recursive: true });
  
  const handlers = {
    change: new Set<(path: string) => void>(),
    add: new Set<(path: string) => void>(),
    remove: new Set<(path: string) => void>()
  };

  // Start watching in background
  watcher.on('change', (eventType, filename) => {
    if (!filename) return;
    
    const filePath = path.join(directory, filename.toString());
    const isRouteFile = extensions.some(ext => filePath.endsWith(ext));

    if (!isRouteFile) return;

    const eventTypeMap = {
      'rename': 'change',
      'change': 'change'
    } as const;

    const mappedEvent = eventTypeMap[eventType as keyof typeof eventTypeMap] || 'change';

    handlers[mappedEvent].forEach(handler => handler(filePath));
  });

  return {
    on(event, handler) {
      handlers[event].add(handler);
    },
    
    async close() {
      watcher.close();
    }
  };
} 