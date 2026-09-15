/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { PathTransformer } from './transformer.js';
import { runtimeService } from '@swissjs/core';
import type { RouteDefinition } from '@swissjs/core';
import type { FileRouterOptions } from '../types/index.js';

export class RouteScanner {
  private transformer = new PathTransformer();

  constructor(private config: FileRouterOptions) {}

  async scanRoutes(directory: string): Promise<RouteDefinition[]> {
    const routes: RouteDefinition[] = [];
    try {
      await this.scanDirectory(directory, routes, '');
    } catch (error) {
      console.error(`Failed to scan routes directory: ${directory}`, error);
      throw error;
    }
    return this.sortRoutesBySpecificity(routes);
  }

  private async scanDirectory(
    dirPath: string,
    routes: RouteDefinition[],
    routePrefix: string
  ): Promise<void> {
    const entries = await runtimeService.readDir(dirPath);
    for (const entry of entries) {
      const fullPath = runtimeService.join(dirPath, entry);
      // TODO: runtimeService.exists/isDirectory if needed
      // For now, assume all entries are files (as in Bun)
      // If you need to check for directories, add a runtimeService.isDirectory method
      // For now, skip directory recursion
      // Check if file has valid route extension
      const isRouteFile = this.config.extensions?.some((ext: string) =>
        entry.endsWith(ext)
      ) ?? entry.endsWith('.ui');
      if (!isRouteFile) continue;
      const route = await this.createRouteFromFile(fullPath, routePrefix);
      if (route) {
        routes.push(route);
      }
    }
  }

  private async createRouteFromFile(
    filePath: string,
    routePrefix: string
  ): Promise<RouteDefinition | null> {
    try {
      const routePath = this.transformer.filePathToRoute(filePath, routePrefix);
      return {
        path: routePath,
        component: () => import(filePath),
        meta: {
          filePath,
          lastModified: Date.now() // Simplified for now
        }
      };
    } catch (error) {
      console.warn(`Failed to create route from file: ${filePath}`, error);
      return null;
    }
  }

  private sortRoutesBySpecificity(routes: RouteDefinition[]): RouteDefinition[] {
    return routes.sort((a, b) => {
      const aIsDynamic = a.path.includes(':');
      const bIsDynamic = b.path.includes(':');
      if (aIsDynamic && !bIsDynamic) return 1;
      if (!aIsDynamic && bIsDynamic) return -1;
      const aSegments = a.path.split('/').length;
      const bSegments = b.path.split('/').length;
      return bSegments - aSegments;
    });
  }
} 