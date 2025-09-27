/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { SwissComponent } from './component.js';
import { CapabilityManager } from '../security/capability-manager.js';
import { PluginManager } from '../plugins/index.js';

// --- SYMBOL KEYS FOR METADATA ---
const SWISS_COMPONENT = Symbol('swiss:component');
const SWISS_TEMPLATE = Symbol('swiss:template');
const SWISS_STYLE = Symbol('swiss:style');
const SWISS_CAPABILITIES = Symbol('swiss:capabilities');
const SWISS_LIFECYCLE = Symbol('swiss:lifecycle');
const SWISS_RENDER = Symbol('swiss:render');
const SWISS_BINDINGS = Symbol('swiss:bindings');
const SWISS_PLUGINS = Symbol('swiss:plugins');

// --- TYPE DEFINITIONS ---
interface CapabilityOptions {
  strict?: boolean;
  fallback?: string;
  scope?: 'children' | 'siblings' | 'global';
  conditional?: (context: unknown) => boolean;
  audit?: boolean;
}

interface LifecycleOptions {
  async?: boolean;
  timeout?: number;
  retry?: number;
  throttle?: number;
  dependencies?: string[];
  cleanup?: string[];
}

interface RenderOptions {
  strategy?: 'virtual' | 'incremental' | 'full';
  cache?: boolean;
  ssr?: boolean;
  deep?: boolean;
  immediate?: boolean;
}

interface PluginOptions {
  version?: string;
  lazy?: boolean;
  capabilities?: string[];
  singleton?: boolean;
  factory?: (context: unknown) => unknown;
}

interface LifecycleMetadata {
  mount?: { method: string; options: LifecycleOptions };
  update?: { method: string; options: LifecycleOptions };
  destroy?: { method: string; options: LifecycleOptions };
  error?: { method: string; options: LifecycleOptions };
}

// Plugin metadata interface removed (unused)

// Reintroduce local ComponentOptions for decorator-specific options
interface ComponentOptions {
  tag?: string;
  isolated?: boolean;
  name?: string;
  selector?: string;
}

// --- UTILITY FUNCTIONS ---
function attachMetadata(target: object, key: symbol, value: unknown) {
  if (!Reflect.hasMetadata(key, target)) {
    Reflect.defineMetadata(key, [], target);
  }
  const existing = (Reflect.getMetadata(key, target) as unknown) || [];
  const metadata: unknown[] = Array.isArray(existing) ? existing : [];
  metadata.push(value);
  Reflect.defineMetadata(key, metadata, target);
}

function validateCapability(capability: string): boolean {
  const capabilityPattern = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/;
  return capabilityPattern.test(capability);
}

function applyThrottle(originalMethod: (...args: unknown[]) => unknown | Promise<unknown>, throttle?: number) {
  if (!throttle) return originalMethod;
  
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: unknown[]) {
    if (timeout) clearTimeout(timeout);
    return new Promise(resolve => {
      timeout = setTimeout(async () => {
        resolve(await originalMethod.apply(this as unknown, args));
      }, throttle);
    });
  };
}

// --- COMPONENT DIRECTIVES ---
// Overload for registration call
export function component<T extends { new (...args: unknown[]): Record<string, unknown> }>(target: T): void;
// Overload for decorator factory
export function component<T extends { new (...args: unknown[]): Record<string, unknown> }>(options?: ComponentOptions): (target: T) => void;
// Implementation
export function component(arg?: unknown): unknown {
  if (typeof arg === 'function') {
    // Registration call: component(Card)
    // You can add runtime registration logic here if needed
    return;
  }
  // Decorator factory: @component or @component(options)
  return function (target: object) {
    const options = (arg as Partial<ComponentOptions>) || {};
    const metadata = {
      isComponent: true,
      options: {
        isolated: options.isolated ?? true,
        ...options
      }
    };
    Reflect.defineMetadata(SWISS_COMPONENT, metadata, target);
    // Auto-register component
    if (typeof window !== 'undefined') {
      const tag = (options.tag || (target as { name?: string }).name);
      if (tag && !customElements.get(tag)) {
        customElements.define(tag, target as unknown as CustomElementConstructor);
      }
    }
  };
}

export function template(template: string) {
  return function <T extends { new (...args: unknown[]): Record<string, unknown> }>(target: T): void | T {
    if (!template || typeof template !== 'string') {
      throw new Error('Template must be a non-empty string');
    }
    
    Reflect.defineMetadata(SWISS_TEMPLATE, {
      source: template,
      isFilePath: !template.includes('<')
    }, target);
  };
}

export function style(style: string | object) {
  return function <T extends { new (...args: unknown[]): Record<string, unknown> }>(target: T): void | T {
    if (!style) throw new Error('Style must be provided');
    
    Reflect.defineMetadata(SWISS_STYLE, {
      source: style,
      type: typeof style === 'string' ? 'file' : 'object'
    }, target);
  };
}

// --- CAPABILITY DIRECTIVES ---
export function requires(capabilities: string | string[], options: CapabilityOptions = {}) {
  return function (target: object) {
    const caps = Array.isArray(capabilities) ? capabilities : [capabilities];
    
    // Validate capabilities
    for (const cap of caps) {
      if (!validateCapability(cap)) {
        throw new Error(`Invalid capability: ${cap}. Expected "namespace:action"`);
      }
    }
    
    attachMetadata(target, SWISS_CAPABILITIES, {
      type: 'required',
      capabilities: caps,
      options
    });
  };
}

export function provides(capabilities: string | string[], options: CapabilityOptions = {}) {
  return function (target: object) {
    const caps = Array.isArray(capabilities) ? capabilities : [capabilities];
    
    for (const cap of caps) {
      if (!validateCapability(cap)) {
        throw new Error(`Invalid capability: ${cap}. Expected "namespace:action"`);
      }
    }
    
    attachMetadata(target, SWISS_CAPABILITIES, {
      type: 'provided',
      capabilities: caps,
      options
    });
  };
}

export function capability(capability: string, options: CapabilityOptions = {}) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!validateCapability(capability)) {
      throw new Error(`Invalid capability: ${capability}`);
    }
    
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: unknown[]) {
      // Ensure 'this' is a SwissComponent instance
      if (!(this instanceof SwissComponent)) {
        throw new Error('Capability check can only be performed on SwissComponent instances.');
      }
      // Runtime capability check
      if (!CapabilityManager.has(capability, this)) {
        if (options.strict !== false) {
          throw new Error(`Missing capability: ${capability}`);
        }
        if (options.fallback) {
          const table = this as unknown as Record<string, unknown>;
          const fb = table[options.fallback];
          if (typeof fb === 'function') {
            return (fb as (...a: unknown[]) => unknown)(...args as unknown[]);
          }
          return;
        }
        return;
      }
      
      // Audit logging
      if (options.audit) {
        console.log(`[Swiss] Capability used: ${capability}`);
      }
      
      return originalMethod.apply(this, args as unknown[]);
    };
    
    attachMetadata(target, SWISS_CAPABILITIES, {
      type: 'method',
      capability,
      method: propertyKey,
      options
    });
  };
}

// --- LIFECYCLE DIRECTIVES ---
function lifecycleDecorator(phase: 'mount' | 'update' | 'destroy' | 'error', options: LifecycleOptions = {}) {
  return function (target: object, propertyKey: string, descriptor?: PropertyDescriptor) {
    // Support both 2- and 3-argument decorator signatures
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }
    if (options.throttle && descriptor && descriptor.value) {
      descriptor.value = applyThrottle(descriptor.value, options.throttle);
    }
    const ctor = (target as { constructor: object }).constructor;
    const existing = (Reflect.getMetadata(SWISS_LIFECYCLE, ctor as object) as unknown) || {};
    const lifecycle = (typeof existing === 'object' && existing) ? (existing as Record<string, unknown>) : {};
    (lifecycle as Record<string, unknown>)[phase] = { method: propertyKey, options };
    Reflect.defineMetadata(SWISS_LIFECYCLE, lifecycle, ctor);
  };
}

export const onMount = (options?: LifecycleOptions) => lifecycleDecorator('mount', options);
export const onUpdate = (options?: LifecycleOptions) => lifecycleDecorator('update', options);
export const onDestroy = (options?: LifecycleOptions) => lifecycleDecorator('destroy', options);
export const onError = (options?: LifecycleOptions & { recover?: boolean }) => 
  lifecycleDecorator('error', options);

// --- RENDERING DIRECTIVES ---
export function render(options: RenderOptions = {}) {
  return function (target: SwissComponent, propertyKey: string) {
    Reflect.defineMetadata(SWISS_RENDER, {
      method: propertyKey,
      options
    }, target.constructor);
  };
}

export function bind(propertyName: string, options: RenderOptions = {}) {
  return function (target: SwissComponent, propertyKey: string) {
    attachMetadata(target, SWISS_BINDINGS, {
      property: propertyKey,
      bindTo: propertyName,
      options
    });
  };
}

export function computed(options: RenderOptions & { dependencies?: string[] } = {}) {
  return function (target: SwissComponent, propertyKey: string, descriptor: PropertyDescriptor) {
    if (descriptor.get && options.cache) {
      const originalGet = descriptor.get;
      let cachedValue: unknown;
      
      let isDirty = true;
      
      descriptor.get = function () {
        if (isDirty) {
          cachedValue = originalGet.call(this);
          isDirty = false;
        }
        return cachedValue;
      };
    }
    
    Reflect.defineMetadata(SWISS_RENDER, {
      type: 'computed',
      property: propertyKey,
      options
    }, target.constructor);
  };
}

// --- PLUGIN DIRECTIVES ---
export function plugin(pluginName: string, options: PluginOptions = {}) {
  return function <T extends { new (...args: unknown[]): Record<string, unknown> }>(target: T): void | T {
    attachMetadata(target, SWISS_PLUGINS, {
      type: 'plugin',
      name: pluginName,
      options
    });
  };
}

export function service(serviceName: string, options: PluginOptions = {}) {
  return function (target: object, propertyKey: string) {
    attachMetadata(target, SWISS_PLUGINS, {
      type: 'service',
      name: serviceName,
      property: propertyKey,
      options
    });
  };
}

// --- METADATA ACCESSORS ---
export function getComponentMetadata(target: object) {
  return Reflect.getMetadata(SWISS_COMPONENT, target) || null;
}

export function getTemplateMetadata(target: object) {
  return Reflect.getMetadata(SWISS_TEMPLATE, target) || null;
}

export function getStyleMetadata(target: object) {
  return Reflect.getMetadata(SWISS_STYLE, target) || null;
}

export function getCapabilityMetadata(target: object) {
  return Reflect.getMetadata(SWISS_CAPABILITIES, target) || [];
}

export function getLifecycleMetadata(target: object): LifecycleMetadata {
  return Reflect.getMetadata(SWISS_LIFECYCLE, target) || {};
}

export function getRenderMetadata(target: object) {
  return Reflect.getMetadata(SWISS_RENDER, target) || null;
}

export function getBindingMetadata(target: object) {
  return Reflect.getMetadata(SWISS_BINDINGS, target) || [];
}

export function getPluginMetadata(target: object) {
  return Reflect.getMetadata(SWISS_PLUGINS, target) || [];
}

// --- RUNTIME INTEGRATION ---
export function applyDecoratorMetadata(component: SwissComponent) {
  const constructor = component.constructor as unknown as object;
  
  // Apply lifecycle hooks
  const lifecycle = getLifecycleMetadata(constructor) as Record<string, { method: string; options: unknown }>;
  for (const [phase, config] of Object.entries(lifecycle)) {
    const table = (component as unknown as Record<string, unknown>);
    const key = `on${phase.charAt(0).toUpperCase()}${phase.slice(1)}`;
    const val = table[config.method];
    table[key] = typeof val === 'function'
      ? (val as (...args: unknown[]) => unknown).bind(component)
      : val;
  }
  
  // Apply custom render method
  const renderConfig = getRenderMetadata(constructor) as { method: string } | null;
  if (renderConfig) {
    const table = (component as unknown as Record<string, unknown>);
    table.render = (table[renderConfig.method] as (...args: unknown[]) => unknown).bind(component);
  }
  
  // Apply plugin services
  const plugins = getPluginMetadata(constructor) as Array<Record<string, unknown>>;
  for (const plugin of plugins) {
    if (plugin.type === 'service') {
      (component as unknown as Record<string, unknown>)[plugin.property as string] = PluginManager.getService(plugin.name as string);
    }
  }
  
  // Apply capability requirements
  const capabilities = getCapabilityMetadata(constructor) as Array<Record<string, unknown>>;
  const requiredCaps = capabilities
    .filter((c) => c.type === 'required')
    .flatMap((c) => (Array.isArray(c.capabilities) ? (c.capabilities as string[]) : []));
  
  if (requiredCaps.length > 0 && !CapabilityManager.hasAll(requiredCaps, component)) {
    throw new Error(`Missing capabilities: ${requiredCaps.join(', ')}`);
  }
}

// --- FRAMEWORK UTILITIES ---
export function collectComponentMetadata(target: object) {
  return {
    component: getComponentMetadata(target),
    template: getTemplateMetadata(target),
    style: getStyleMetadata(target),
    capabilities: getCapabilityMetadata(target),
    lifecycle: getLifecycleMetadata(target),
    render: getRenderMetadata(target),
    bindings: getBindingMetadata(target),
    plugins: getPluginMetadata(target)
  };
}

export function validateComponent(target: object) {
  const errors: string[] = [];
  const metadata = collectComponentMetadata(target);
  
  if (!metadata.component) {
    errors.push('Component decorator missing');
  }
  
  // Validate capability formats
  for (const cap of (metadata.capabilities as Array<Record<string, unknown>>)) {
    if (cap.type === 'required' || cap.type === 'provided') {
      for (const c of (cap.capabilities as string[])) {
        if (!validateCapability(c)) {
          errors.push(`Invalid capability format: ${c}`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// --- TYPE EXPORTS ---
export type { 
  CapabilityOptions, 
  LifecycleOptions, 
  RenderOptions, 
  PluginOptions 
};