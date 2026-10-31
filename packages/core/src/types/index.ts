/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Core package types barrel
// Consolidate routing and other cross-cutting core types here

export interface ComponentConstructor {
  new (...args: unknown[]): unknown;
}

export type ComponentImport = () => Promise<{ default: ComponentConstructor }>;

export interface RouteDefinition {
  path: string;
  component: ComponentImport | ComponentConstructor;
  // Optional layout component to wrap this route's component tree
  layout?: ComponentImport | ComponentConstructor;
  children?: RouteDefinition[];
  meta?: RouteMeta;
}

export interface RouteParams {
  [key: string]: string;
}

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  [key: string]: unknown;
}

export interface RouterContext {
  navigate: (path: string, params?: RouteParams) => void;
  currentRoute: RouteDefinition | null;
}
