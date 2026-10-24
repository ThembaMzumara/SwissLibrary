/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export class PathTransformer {
  /**
   * Transform file path to route pattern
   * 
   * Examples:
   * - /routes/index.ui -> /
   * - /routes/about.ui -> /about
   * - /routes/user/[id].ui -> /user/:id
   * - /routes/blog/[slug]/edit.ui -> /blog/:slug/edit
   */
  filePathToRoute(filePath: string, routePrefix: string = ''): string {
    let route = filePath
      // Remove everything before /routes
      .replace(/^.*?\/routes/, '')
      // Remove route prefix if provided
      .replace(new RegExp('^' + routePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '')
      // Handle index files
      .replace(/\/index\.(ui|js|ts)$/, '/')
      .replace(/^index\.(ui|js|ts)$/, '/')
      // Remove file extensions
      .replace(/\.(ui|js|ts)$/, '')
      // Convert [param] to :param (Next.js style)
      .replace(/\[([^\]]+)\]/g, ':$1')
      // Convert [[...param]] to :param* (catch-all routes)
      .replace(/\[\[\.\.\.([^\]]+)\]\]/g, ':$1*')
      // Clean up double slashes
      .replace(/\/+/g, '/')
      // Ensure starts with /
      .replace(/^(?!\/)/, '/');

    // Handle root route
    if (route === '' || route === '/index') {
      route = '/';
    }

    return route;
  }

  /**
   * Transform route pattern back to potential file paths
   * Useful for reverse lookups and debugging
   */
  routeToFilePaths(route: string, routesDir: string, extensions: string[]): string[] {
    const paths: string[] = [];
    
    const basePath = route === '/' ? 'index' : route.replace(/^\//, '');
    const pathWithParams = basePath.replace(/:([^/]+)/g, '[$1]');
    
    for (const ext of extensions) {
      paths.push(`${routesDir}/${pathWithParams}${ext}`);
      
      if (route === '/') {
        paths.push(`${routesDir}/index${ext}`);
      }
    }
    
    return paths;
  }

  /**
   * Extract parameter names from route pattern
   */
  extractParamNames(route: string): string[] {
    const matches = route.match(/:([^/]+)/g);
    return matches ? matches.map(match => match.slice(1)) : [];
  }

  /**
   * Check if route pattern matches path
   */
  matchRoute(pattern: string, path: string): { match: boolean; params: Record<string, string> } {
    const params: Record<string, string> = {};
    
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);
    
    if (!match) {
      return { match: false, params: {} };
    }
    
    // Extract parameters
    const paramNames = this.extractParamNames(pattern);
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1] || '';
    });
    
    return { match: true, params };
  }
} 