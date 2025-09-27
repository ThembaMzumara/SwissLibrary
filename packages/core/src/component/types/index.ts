/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { Plugin } from '../../plugins/pluginInterface.js';
import type { SwissComponent } from '../component.js';

export type LifecyclePhase =
  | 'init' | 'mount' | 'update' | 'destroy'
  | 'secure' | 'optimize' | 'extend'
  | 'render' | 'error'
  | string;

// Context storage used by components
export type ContextMap = Map<symbol, unknown>;

// Capability set used in component options
export type CapabilitySet = Set<string>;

// Options accepted by SwissComponent constructor
export interface SwissComponentOptions {
  context?: ContextMap;
  capabilities?: CapabilitySet;
  plugins?: Plugin[];
  errorBoundary?: boolean;
  isServer?: boolean;
}

// Lifecycle hook registration stored on SwissComponent
export interface ComponentHook {
  phase: string;
  callback: (...args: unknown[]) => void;
  once: boolean;
  capability: string | undefined;
  priority: number;
}

// Error information used by error boundaries and reporting
export interface SwissErrorInfo {
  error: Error | unknown;
  phase: string;
  component: SwissComponent;
  timestamp: number;
}

export type ComponentConstructor = new (...args: unknown[]) => unknown;

// Re-export router types used by some component consumers
import type { RouteDefinition } from '../../types/routing.js';
export type { RouteDefinition };
import type { VNode } from '../../vdom/types/index.js';

// Base component props/state
export interface BaseComponentState {
  [key: string]: unknown;
}

export interface BaseComponentProps {
  [key: string]: unknown;
}

// ErrorBoundary props/state
export interface ErrorBoundaryState {
  error: unknown | null;
  [key: string]: unknown;
}

export interface ErrorBoundaryProps {
  fallback: (error: unknown, reset: () => void) => VNode;
  children: VNode[];
  [key: string]: unknown;
}
