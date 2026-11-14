/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * Convert file path to route path
 */
export function pathToRoute(filePath: string, routesDir: string = './routes'): string {
  // Remove routes directory prefix
  let route = filePath.replace(new RegExp(`^${routesDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
  
  // Handle index files
  route = route.replace(/\/index\.(ui|js|ts)$/, '/');
  route = route.replace(/^index\.(ui|js|ts)$/, '/');
  
  // Remove file extensions
  route = route.replace(/\.(ui|js|ts)$/, '');
  
  // Convert [param] to :param
  route = route.replace(/\[([^\]]+)\]/g, ':$1');
  
  // Clean up slashes
  route = route.replace(/\/+/g, '/');
  
  // Ensure starts with /
  if (!route.startsWith('/')) {
    route = '/' + route;
  }
  
  // Handle root route
  if (route === '' || route === '/index') {
    route = '/';
  }
  
  return route;
}

/**
 * Convert route path to potential file paths
 */
export function routeToPath(route: string, routesDir: string = './routes', extensions: string[] = ['.ui']): string[] {
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