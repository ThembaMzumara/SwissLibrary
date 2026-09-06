/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { signal, Signal } from './signals.js';

/**
 * JSX integration helper
 */
export function $<T>(signal: Signal<T>): T {
  return signal.value;
}

/**
 * Create a signal-bound attribute
 */
export function bindAttr(
  element: HTMLElement,
  attribute: string,
  signal: Signal<unknown>
) {
  const update = () => {
    element.setAttribute(attribute, String(signal.value));
  };
  update();
  signal.subscribe(update);
}

/**
 * Create a signal-bound class
 */
export function bindClass(
  element: HTMLElement,
  className: string,
  signal: Signal<boolean>
) {
  const update = () => {
    if (signal.value) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  };
  update();
  signal.subscribe(update);
}

/**
 * Create a signal-bound style
 */
export function bindStyle(
  element: HTMLElement,
  property: string,
  signal: Signal<unknown>
) {
  const update = () => {
    (element.style as unknown as Record<string, string>)[property] = String(signal.value);
  };
  update();
  signal.subscribe(update);
}

/**
 * Create a text node bound to a signal
 */
export function createBoundText(signal: Signal<unknown>): Text {
  const textNode = document.createTextNode('');
  const update = () => {
    textNode.textContent = String(signal.value);
  };
  update();
  signal.subscribe(update);
  return textNode;
}

/**
 * Create a signal that updates from an event
 */
export function eventSignal<T = Event>(
  element: HTMLElement,
  eventName: string
): Signal<T | null> {
  const sig = signal<T | null>(null);
  element.addEventListener(eventName, (e) => {
    sig.value = e as unknown as T;
  });
  return sig;
}

// Placeholder for integration with frameworks or devtools
export function integrateWithFramework() {
  // Integration logic goes here
}