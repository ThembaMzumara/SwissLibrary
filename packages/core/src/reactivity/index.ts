/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Export signals module (using computed from signals as primary)
export { signal, Signal, ComputedSignal, computed } from './signals.js';

// Export effect module
export { Effect, effect, onCleanup, trackEffect } from './effect.js';

// Export batch module
export { batch as batchUpdates, batchedSignal } from './batch.js';

// Export store module
export * from './store.js';

// Export context module
export * from './context.js';

// Export integration module
export * from './integration.js';

// Export reactive module (excluding computed to avoid conflict)
export { reactive, watch, watchAll } from './reactive.js';
export { computed as computedLegacy, effect as reactiveEffect } from './reactive.js';

// Export types
export * from './types/index.js';
