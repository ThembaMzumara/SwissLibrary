/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Configuration types
export type { FileRouterOptions } from './config.js';
export type { RouteConfig, LayoutConfig } from './route.js';

// Development types (conditional)
export type { DevServerOptions, WatcherConfig, FileWatcher, DevServer } from './dev.js';

// Re-export core types from framework
export type { RouteDefinition, ComponentConstructor } from '@swissjs/core';