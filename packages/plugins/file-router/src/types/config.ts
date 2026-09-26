/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export interface FileRouterOptions {
  /** Routes directory relative to project root */
  routesDir?: string;
  
  /** File extensions to scan for routes */
  extensions?: string[];
  
  /** Enable nested layouts */
  layouts?: boolean;
  
  /** Enable lazy loading */
  lazyLoading?: boolean;
  
  /** Enable route preloading */
  preloading?: boolean;
  
  /** Custom route transformation */
  transform?: (path: string) => string;
  
  /** Development server options */
  dev?: {
    hotReload?: boolean;
    port?: number;
  };
}

export interface RouteConfig {
  /** Route path pattern */
  path: string;
  
  /** Component file path */
  component: string;
  
  /** Layout component */
  layout?: string;
  
  /** Route metadata */
  meta?: {
    title?: string;
    description?: string;
    guards?: string[];
    middleware?: string[];
    [key: string]: unknown;
  };
}

export interface LayoutConfig {
  /** Layout component name */
  component: string;
  
  /** Layout metadata */
  meta?: {
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
}