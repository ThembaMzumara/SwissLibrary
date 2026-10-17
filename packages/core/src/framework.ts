/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { HookRegistry } from './hooks/hookRegistry.js';
import { PluginManager } from './plugins/index.js';
import type { Plugin } from './plugins/pluginInterface.js';
import type { SwissComponent } from './component/component.js';
import { ComponentRegistry } from './component/ComponentRegistry.js';
import { coreDirectiveHandlers, isCoreDirective } from './directives/coreDirectives.js';
import type { DirectiveBinding } from './directives/types/index.js';

export const SWISS_VERSION = '1.0.0';

/**
 * SwissApp - Application-level framework instance
 * Provides app-specific plugin registration and routing capabilities
 */
export class SwissApp {
  private static instances = new Map<string, SwissApp>();
  
  public readonly name: string;
  public readonly framework: SwissFramework;
  public readonly plugins: PluginManager;
  public readonly hooks: HookRegistry;
  
  private constructor(name: string) {
    this.name = name;
    this.framework = SwissFramework.getInstance();
    this.plugins = new PluginManager();
    this.hooks = this.framework.hooks;
    
    // Register app-specific hooks
    this.setupAppHooks();
  }
  
  static getInstance(name: string = 'default'): SwissApp {
    if (!SwissApp.instances.has(name)) {
      SwissApp.instances.set(name, new SwissApp(name));
    }
    return SwissApp.instances.get(name)!;
  }
  
  private setupAppHooks() {
    // App-specific hooks
    this.hooks.addHook('appInit', () => {}, this.name, 'critical');
    this.hooks.addHook('appStart', () => {}, this.name, 'critical');
    this.hooks.addHook('appReady', () => {}, this.name, 'critical');
    this.hooks.addHook('appStop', () => {}, this.name, 'critical');
    
    // Routing hooks
    this.hooks.addHook('routeRegister', () => {}, this.name, 'normal');
    this.hooks.addHook('routeMatch', () => {}, this.name, 'normal');
    this.hooks.addHook('routeNavigate', () => {}, this.name, 'normal');
    
    // Plugin integration hooks
    this.hooks.addHook('pluginRegister', () => {}, this.name, 'normal');
    this.hooks.addHook('pluginLoad', () => {}, this.name, 'normal');
    this.hooks.addHook('pluginUnload', () => {}, this.name, 'normal');
  }
  
  /**
   * Register plugins at the app level
   */
  registerPlugins(plugins: Plugin | Plugin[]) {
    this.hooks.callHook('pluginRegister', { app: this.name, plugins });
    this.plugins.register(plugins);
    this.hooks.callHook('pluginLoad', { app: this.name, plugins });
  }
  
  /**
   * Get app-specific services
   */
  get services() {
    return {
      router: this.plugins.getService('router'),
      http: this.plugins.getService('httpClient'),
      state: this.plugins.getService('state'),
      ssr: this.plugins.getService('ssr'),
      errors: this.plugins.getService('errorHandler'),
      dev: this.plugins.getService('devServer'),
      fileRouter: this.plugins.getService('fileRouter')
    };
  }
  
  /**
   * Start the application
   */
  start() {
    this.hooks.callHook('appStart', { app: this.name, timestamp: Date.now() });
    this.framework.start();
    this.hooks.callHook('appReady', { app: this.name, version: SWISS_VERSION });
  }
  
  /**
   * Stop the application
   */
  stop() {
    this.hooks.callHook('appStop', { app: this.name, reason: 'user-request' });
    this.framework.stop();
  }
}

export class SwissFramework {
  private static instance: SwissFramework;
  
  public readonly hooks: HookRegistry;
  public readonly plugins: PluginManager;
  public readonly components: ComponentRegistry;
  // public readonly router: Router; // Removed, now a plugin
  // public readonly ssr: SSRSystem; // Removed, now a plugin
  // public readonly data: DataFetcher; // Removed, now a plugin
  // public readonly security: CapabilitySystem; // Removed, now a plugin
  
  private constructor() {
    this.hooks = new HookRegistry();
    this.plugins = new PluginManager();
    // this.security = new CapabilitySystem(this.hooks); // Removed, now a plugin
    this.components = new ComponentRegistry(this.hooks);
    // this.router = new Router(this.hooks, this.security); // Removed, now a plugin
    // this.data = new DataFetcher(this.hooks); // Removed, now a plugin
    // this.ssr = new SSRSystem(this.hooks, /* router is now a plugin */ undefined, this.components, this.data, this.security); // Removed, now a plugin
    
    this.setupCoreHooks();
    this.registerCorePlugins();
  }
  
  static getInstance(): SwissFramework {
    if (!SwissFramework.instance) {
      SwissFramework.instance = new SwissFramework();
    }
    return SwissFramework.instance;
  }
  
  private setupCoreHooks() {
    // Register default framework hooks
    this.hooks.addHook('frameworkInit', () => {}, 'swiss-core', 'critical');
    this.hooks.addHook('frameworkStart', () => {}, 'swiss-core', 'critical');
    this.hooks.addHook('frameworkReady', () => {}, 'swiss-core', 'critical');
    this.hooks.addHook('frameworkStop', () => {}, 'swiss-core', 'critical');
    
    // Initialize core systems
    this.hooks.callHook('frameworkInit', { version: SWISS_VERSION });
  }
  
  private registerCorePlugins() {
    this.plugins.register([
      // RouterPlugin,
      // HttpClientPlugin,
      // StatePlugin,
      // SSRPlugin,
      // ErrorPlugin
    ]);
  }
  
  start() {
    this.hooks.callHook('frameworkStart', { timestamp: Date.now() });
    
    // Additional startup logic
    if (typeof window !== 'undefined') {
      // this.ssr.hydrateClient(); // Removed, now a plugin
    }
    
    this.hooks.callHook('frameworkReady', { version: SWISS_VERSION });
  }
  
  stop() {
    this.hooks.callHook('frameworkStop', { reason: 'user-request' });
    // Cleanup logic
    this.hooks.callHook('frameworkStopped', {});
  }

  get services() {
    return {
      router: this.plugins.getService('router'),
      http: this.plugins.getService('httpClient'),
      state: this.plugins.getService('state'),
      ssr: this.plugins.getService('ssr'),
      errors: this.plugins.getService('errorHandler')
    };
  }
}

// Global framework instance
export const framework = SwissFramework.getInstance();

export function processDirectives(component: SwissComponent) {
  const elements = (component as unknown as { $el: HTMLElement }).$el.querySelectorAll('[\\@\\w+]');
  elements.forEach(el => {
    const directives = Array.from(el.attributes)
      .filter(attr => attr.name.startsWith('@'))
      .map(attr => ({
        name: attr.name.substring(1),
        expression: attr.value,
        modifier: extractModifiers(attr.name)
      }));
    directives.forEach(directive => {
      const binding: DirectiveBinding = {
        value: evaluateExpression(component, directive.expression),
        expression: directive.expression,
        modifiers: Array.isArray(directive.modifier)
          ? Object.fromEntries(directive.modifier.map(m => [m, true]))
          : directive.modifier
            ? { [directive.modifier]: true }
            : {}
      };
      if (isCoreDirective(directive.name)) {
        coreDirectiveHandlers[directive.name](el as HTMLElement, binding, component);
      } else {
        framework.hooks.callHook('processDirective', {
          element: el as HTMLElement,
          directive: directive.name,
          binding,
          component
        });
      }
    });
  });
}

function extractModifiers(name: string): string | string[] {
  const parts = name.split('.').slice(1);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts;
}

function evaluateExpression(component: unknown, expression: string): unknown {
  // TODO: Implement real expression evaluation
  // For now, just return the value from the component if it exists
  if (component && typeof component === 'object' && expression in (component as Record<string, unknown>)) {
    return (component as Record<string, unknown>)[expression];
  }
  return undefined;
}