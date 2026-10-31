/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

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