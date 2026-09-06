/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { SwissComponent } from './component.js';

// Enhanced Event Types and Interfaces
export type EventPhase = 'capturing' | 'bubbling' | 'target';
export type EventCallback<T = unknown> = (event: SwissEvent<T>) => void;

export interface EventOptions {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
  capability?: string;
}

export interface ListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  priority?: number;
  capability?: string;
}

// Internal interface for storing listeners with wrapped callbacks
export interface StoredListener {
  options: ListenerOptions;
  wrappedCallback: EventCallback;
}

export class SwissEvent<T = unknown> {
  public readonly type: string;
  public readonly target: SwissComponent | null;
  public currentTarget: SwissComponent | null = null;
  public readonly detail: T;
  public readonly timestamp: number;
  
  public bubbles: boolean;
  public cancelable: boolean;
  public composed: boolean;
  public phase: EventPhase | null = null;
  
  public propagationStopped = false;
  public immediatePropagationStopped = false;
  public defaultPrevented = false;

  constructor(
    type: string,
    detail?: T,
    options: EventOptions = {},
    target: SwissComponent | null = null
  ) {
    this.type = type;
    this.detail = detail as T;
    this.target = target;
    this.timestamp = Date.now();
    
    this.bubbles = options.bubbles ?? true;
    this.cancelable = options.cancelable ?? true;
    this.composed = options.composed ?? true;
    
    // Capability check for emission (TODO: integrate CapabilityManager)
    // if (options.capability && target) {
    //   // verify capability here
    // }
  }

  stopPropagation() {
    this.propagationStopped = true;
  }

  stopImmediatePropagation() {
    this.immediatePropagationStopped = true;
    this.propagationStopped = true;
  }

  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }
}

// --- SwissComponent Event System Integration ---

declare module './component.js' {
  interface SwissComponent {
    _parent: SwissComponent | null;
    _children: SwissComponent[];
    // Fixed: Use proper typing for event registry
    _eventRegistry: Map<string, {
      capture: Map<EventCallback, StoredListener>;
      bubble: Map<EventCallback, StoredListener>;
    }>;
    addChild(child: SwissComponent): this;
    getParentComponent(): SwissComponent | null;
    on(phase: string, callback: (...args: unknown[]) => void, options?: { once?: boolean; priority?: number }): this;
    off(eventType: string, callback: EventCallback): this;
    emit<T = unknown>(eventType: string, detail?: T, options?: EventOptions): boolean;
    _dispatchEvent(event: SwissEvent): boolean;
    _triggerEvent(component: SwissComponent, event: SwissEvent, phase: 'capture' | 'bubble'): boolean;
    handleError?(type: string, error: unknown): void;
  }
}

SwissComponent.prototype._parent = null;
SwissComponent.prototype._children = [];
SwissComponent.prototype._eventRegistry = new Map();

SwissComponent.prototype.addChild = function(child: SwissComponent) {
  child._parent = this;
  this._children.push(child);
  return this;
};

SwissComponent.prototype.getParentComponent = function() {
  return this._parent;
};

SwissComponent.prototype.on = function(eventType: string, callback: EventCallback, options: ListenerOptions = {}) {
  if (!this._eventRegistry.has(eventType)) {
    this._eventRegistry.set(eventType, {
      capture: new Map(),
      bubble: new Map()
    });
  }
  
  const eventRegistry = this._eventRegistry.get(eventType)!;
  const phase = options.capture ? 'capture' : 'bubble';
  const listeners = eventRegistry[phase];
  
  // Wrap callback with capability check
  const wrappedCallback = (event: SwissEvent) => {
    // TODO: enforce capability if options.capability is provided
    callback(event);
  };
  
  // Store both options and wrapped callback
  listeners.set(callback, {
    options,
    wrappedCallback
  });
  return this;
};

SwissComponent.prototype.off = function(eventType: string, callback: EventCallback) {
  const registry = this._eventRegistry.get(eventType);
  if (!registry) return this;
  
  registry.capture.delete(callback);
  registry.bubble.delete(callback);
  return this;
};

SwissComponent.prototype.emit = function<T = unknown>(eventType: string, detail?: T, options: EventOptions = {}) {
  const event = new SwissEvent<T>(eventType, detail, options, this);
  return this._dispatchEvent(event);
};

SwissComponent.prototype._dispatchEvent = function(event: SwissEvent) {
  // Build propagation path (root -> target), avoid aliasing `this`
  const path: SwissComponent[] = [];
  const buildPath = (node: SwissComponent | null): void => {
    if (!node) return;
    buildPath(node.getParentComponent());
    path.push(node);
  };
  buildPath(this);
  
  // 1. Capturing phase (root -> target)
  event.phase = 'capturing';
  for (let i = 0; i < path.length - 1; i++) {
    if (this._triggerEvent(path[i], event, 'capture') || event.propagationStopped) {
      return !event.defaultPrevented;
    }
  }
  
  // 2. Target phase
  event.phase = 'target';
  if (this._triggerEvent(this, event, 'bubble') || event.propagationStopped) {
    return !event.defaultPrevented;
  }
  
  // 3. Bubbling phase (target -> root)
  if (event.bubbles) {
    event.phase = 'bubbling';
    for (let i = path.length - 2; i >= 0; i--) {
      if (this._triggerEvent(path[i], event, 'bubble') || event.propagationStopped) {
        break;
      }
    }
  }
  
  return !event.defaultPrevented;
};

SwissComponent.prototype._triggerEvent = function(
  component: SwissComponent,
  event: SwissEvent,
  phase: 'capture' | 'bubble'
) {
  const registry = component._eventRegistry.get(event.type);
  if (!registry) return false;
  
  const listenersMap = registry[phase];
  event.currentTarget = component;
  
  // Sort listeners by priority (highest first)
  const sortedListeners = Array.from(listenersMap.entries())
    .sort((a, b) => (b[1].options.priority ?? 0) - (a[1].options.priority ?? 0));
  
  for (const [originalCallback, storedListener] of sortedListeners) {
    try {
      // Use the wrapped callback
      storedListener.wrappedCallback(event);
      
      // Remove if once
      if (storedListener.options.once) {
        listenersMap.delete(originalCallback);
      }
      
      if (event.immediatePropagationStopped) return true;
    } catch (error) {
      // Safe error handling
      if (component.handleError) {
        component.handleError('event', error);
      } else {
        console.error('[SwissEvent] Component listener error:', error);
      }
    }
  }
  return false;
};

// --- Global Event Hub ---
class SwissEventHub {
  private static instance: SwissEventHub;
  private listeners = new Map<string, Map<EventCallback, ListenerOptions>>();
  private constructor() {}
  
  static getInstance(): SwissEventHub {
    if (!SwissEventHub.instance) {
      SwissEventHub.instance = new SwissEventHub();
    }
    return SwissEventHub.instance;
  }
  
  on(eventType: string, callback: EventCallback, options: ListenerOptions = {}) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Map());
    }
    this.listeners.get(eventType)!.set(callback, options);
  }
  
  off(eventType: string, callback: EventCallback) {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }
  
  emit<T = unknown>(eventType: string, detail?: T, options: EventOptions = {}) {
    const event = new SwissEvent(eventType, detail, options);
    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners) return true;
    
    const listeners = Array.from(eventListeners.entries())
      .sort((a, b) => (b[1].priority ?? 0) - (a[1].priority ?? 0));
    
    for (const [callback] of listeners) {
      try {
        // TODO: enforce capability if provided in options
        callback(event);
        if (event.immediatePropagationStopped) break;
      } catch (error) {
        console.error('[SwissEventHub] Error in global listener:', error);
      }
    }
    return !event.defaultPrevented;
  }
}

// Global event API
export const SwissEvents = {
  on: (eventType: string, callback: EventCallback, options?: ListenerOptions) => {
    SwissEventHub.getInstance().on(eventType, callback, options);
  },
  off: (eventType: string, callback: EventCallback) => {
    SwissEventHub.getInstance().off(eventType, callback);
  },
  emit: <T = unknown>(eventType: string, detail?: T, options?: EventOptions) => {
    return SwissEventHub.getInstance().emit(eventType, detail, options);
  }
};

// Predefined event types
export const SWISS_EVENTS = {
  COMPONENT_MOUNT: 'swiss:component:mount',
  COMPONENT_UPDATE: 'swiss:component:update',
  COMPONENT_DESTROY: 'swiss:component:destroy',
  STATE_CHANGE: 'swiss:state:change',
  ROUTE_CHANGE: 'swiss:route:change',
  ERROR: 'swiss:error'
};