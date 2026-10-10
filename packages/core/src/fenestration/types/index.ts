/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { SwissComponent } from '../../component/component.js';

export interface FenestrationCapability {
  id: string;
  provider: (...args: unknown[]) => unknown;
  method: string; // The method name that implements the capability
  scope: 'global' | 'component' | 'plugin' | 'tenant';
  security: {
    roles?: string[];
    permissions?: string[];
    context?: string[];
  };
  metadata: {
    declarationType: 'provides' | 'requires' | 'capability';
    getService(name: string): unknown | null;
    sourceFile: string;
    lineNumber?: number;
  };
}

export interface FenestrationContext {
  requiredCapabilities?: string[];
  component?: SwissComponent;
  tenant?: string;
  user?: { id: string; roles: string[] };
  session?: { id: string; permissions: string[] };
  layer: 'component' | 'service' | 'plugin' | 'runtime';
}

export interface FenestrationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pierced: boolean; // Whether the call successfully pierced layers
  path: string[]; // The layers that were pierced
}
