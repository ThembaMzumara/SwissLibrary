/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { startBatch, endBatch } from './context.js';
import { Signal, type SignalOptions } from './signals.js';

/**
 * Batch multiple updates into a single notification
 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

/**
 * BatchedSignal class that extends Signal with automatic batching
 */
class BatchedSignal<T> extends Signal<T> {
  constructor(initialValue: T, options?: SignalOptions<T>) {
    super(initialValue, options);
  }

  set value(newValue: T) {
    batch(() => {
      super.value = newValue;
    });
  }

  update(updater: (value: T) => T) {
    batch(() => {
      super.update(updater);
    });
  }
}

/**
 * Create a batched signal update
 */
export function batchedSignal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T> {
  return new BatchedSignal(initialValue, options);
}