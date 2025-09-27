/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Export signals module
export * from './signals.js';

// Export effect module, but avoid currentEffect conflict
export { Effect, effect, onCleanup, trackEffect } from './effect.js';

// Export batch module, but rename batch to avoid conflict
export { batch as batchUpdates, batchedSignal } from './batch.js';

// Export other modules
export * from './store.js';
export * from './context.js';
export * from './integration.js';