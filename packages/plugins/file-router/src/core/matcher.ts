/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { PathTransformer } from './transformer.js';

export class RouteMatcher {
  private transformer = new PathTransformer();

  /**
   * Match a path against a route pattern
   */
  matchRoute(pattern: string, path: string): { match: boolean; params: Record<string, string> } {
    return this.transformer.matchRoute(pattern, path);
  }

  /**
   * Find the best matching route from a list of routes
   */
  findBestMatch(
    routes: Array<{ path: string; [key: string]: unknown }>,
    path: string
  ): { route: { path: string; [key: string]: unknown }; params: Record<string, string> } | null {

    for (const route of routes) {
      const result = this.matchRoute(route.path, path);
      if (result.match) {
        return { route, params: result.params };
      }
    }
    return null;
  }

  /**
   * Sort routes by specificity (most specific first)
   */
  sortRoutesBySpecificity(
    routes: Array<{ path: string; [key: string]: unknown }>
  ): Array<{ path: string; [key: string]: unknown }> {

    return routes.sort((a, b) => {
      // Static routes before dynamic routes
      const aIsDynamic = a.path.includes(':');
      const bIsDynamic = b.path.includes(':');
      
      if (aIsDynamic && !bIsDynamic) return 1;
      if (!aIsDynamic && bIsDynamic) return -1;
      
      // More specific routes first (more segments)
      const aSegments = a.path.split('/').length;
      const bSegments = b.path.split('/').length;
      
      return bSegments - aSegments;
    });
  }
} 