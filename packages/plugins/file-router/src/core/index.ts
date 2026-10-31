/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Main plugin factory
export { fileRouterPlugin } from './plugin.js';

// Core engines (RouteScanner removed to avoid circular dependency)
export { RouteMatcher } from './matcher.js';
export { PathTransformer } from './transformer.js';

// Internal utilities
export { createRouteDefinition } from './utils.js';