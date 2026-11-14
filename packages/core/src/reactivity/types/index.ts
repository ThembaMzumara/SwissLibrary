/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Consolidated reactivity types

export type Listener = () => void;
export type PropertyKey = string | number | symbol;

export interface ReactiveObject {
  [key: PropertyKey]: unknown;
  __listeners?: Map<PropertyKey, Set<Listener>>;
  __globalListeners?: Set<Listener>;
}

export type EffectDisposer = () => void;

// Options for Signal
export interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;
  capability?: string;
  name?: string;
}

// Effect lifecycle stages
export enum EffectStage {
  INITIAL,
  ACTIVE,
  DISPOSED
}

// Store helpers
export type StoreObject = Record<string, unknown>;
export type StoreUpdate<T> = Partial<T> | ((state: T) => Partial<T>);

// Effect shape used by context tracking in reactivity/context.ts
export interface TrackedEffect {
  execute: () => void;
  dependencies: Set<unknown>;
  cleanup?: () => void;
}
