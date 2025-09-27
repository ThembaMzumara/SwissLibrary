/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { HookRegistry } from '../hooks/hookRegistry.js';
import type { Plugin, PluginContext } from './pluginInterface.js';
import { initializeDefaultHooks } from '../hooks/defaultHooks.js';
import { CapabilityManager } from '../security/capability-manager.js';
import { auditPlugin as securityAuditPlugin } from '../security/index.js';
import type { HookRegistration } from './types/hooks-contract.js';
import type { AuditResult, PluginLogger } from './types/index.js';

/**
 * Canonical Plugin Manager and Registry for SwissJS
 * Handles plugin registration, lifecycle, service registry, and hook integration.
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hookRegistry: HookRegistry;
  private capabilities: Set<string> = new Set();
  private services: Map<string, unknown> = new Map();
  private auditResult: AuditResult | null = null;
    private appContext: { name: string; registerRoute: (path: string, handler: (...args: unknown[]) => unknown) => void; registerMiddleware: (middleware: (...args: unknown[]) => unknown) => void; registerService: (name: string, service: unknown) => void; } | null = null;
  private devContext: { isDevMode: boolean; hotReload: boolean; watchFiles: () => void; compileOnChange: boolean } | null = null;
  private runtimeContext: { type: 'node' | 'bun' | 'unknown'; adapter: unknown; capabilities: { [key: string]: boolean; }; } | null = null;

  constructor() {
    this.hookRegistry = new HookRegistry();
    initializeDefaultHooks(this.hookRegistry);
  }

  private isExperimentalLifecycleEnabled(): boolean {
    try {
      return process?.env?.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE === '1';
    } catch {
      return false;
    }
  }

  /**
   * Set application context for plugins
   */
    setAppContext(app: { name: string; registerRoute: (path: string, handler: (...args: unknown[]) => unknown) => void; registerMiddleware: (middleware: (...args: unknown[]) => unknown) => void; registerService: (name: string, service: unknown) => void; }) {
    this.appContext = app;
  }

  /**
   * Set development context for plugins
   */
  setDevContext(dev: { isDevMode: boolean; hotReload: boolean; watchFiles: () => void; compileOnChange: boolean }) {
    this.devContext = dev;
  }

  /**
   * Set runtime context for plugins
   */
      setRuntimeContext(runtime: { type: 'node' | 'bun' | 'unknown'; adapter: unknown; capabilities: { [key: string]: boolean; }; }) {
    this.runtimeContext = runtime;
    if (this.isExperimentalLifecycleEnabled()) {
      this.hookRegistry.callHook('runtimeReady', { version: undefined });
      for (const plugin of this.plugins.values()) {
        const hooksSurface = {
          addHook: (name: string, handler: (payload: unknown) => unknown, owner?: string, priority?: 'low' | 'normal' | 'high' | 'critical') => {
            this.hookRegistry.addHook(
              name,
              ((payload: unknown) => handler(payload)) as unknown as (...args: unknown[]) => unknown,
              owner ?? plugin.name,
              priority
            );
          },
          removeHooks: (owner: string) => this.hookRegistry.removeHooks(owner),
          callHook: (name: string, payload: unknown) => this.hookRegistry.callHook(name, payload as unknown as { [key: string]: unknown }),
        } as unknown as import('./types/hooks-contract.js').HookRegistrySurface;
        const logger: PluginLogger = {
          info: (msg: string) => console.log(`[plugin:${plugin.name}] ${msg}`),
          warn: (msg: string) => console.warn(`[plugin:${plugin.name}] ${msg}`),
          error: (msg: string) => console.error(`[plugin:${plugin.name}] ${msg}`),
        };
        const ctx: PluginContext = {
          hooks: hooksSurface,
          registerHook: (registration: HookRegistration) => {
            this.hookRegistry.addHook(
              registration.name,
              ((payload: unknown) => registration.handler(payload as never)) as unknown as (...args: unknown[]) => unknown,
              plugin.name,
              registration.priority
            );
          },
          capabilities: this.capabilities,
          logger,
          app: this.appContext ? {
            name: this.appContext.name,
            registerRoute: this.appContext.registerRoute || (() => {}),
            registerMiddleware: this.appContext.registerMiddleware || (() => {}),
            registerService: (name: string, service: unknown) => {
              this.registerService(name, service);
              const reg = this.appContext?.registerService;
              if (typeof reg === 'function') reg(name, service);
            }
          } : undefined,
          dev: this.devContext ? {
            isDevMode: this.devContext.isDevMode || false,
            hotReload: this.devContext.hotReload || false,
            watchFiles: this.devContext.watchFiles || (() => {}),
            compileOnChange: this.devContext.compileOnChange || false
          } : undefined,
          runtime: this.runtimeContext ? {
            type: this.runtimeContext.type || 'unknown',
            adapter: this.runtimeContext.adapter || null,
            capabilities: this.runtimeContext.capabilities || {}
          } : undefined
        };
        try { plugin.onRuntimeReady?.(ctx); } catch { /* no-op */ }
      }
    }
  }

  registerPlugin(plugin: Plugin) {
    // Before plugin registration hook
    this.hookRegistry.callHook('beforePluginRegister', { plugin });
    // Check for duplicates
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    // Verify capabilities (strict when experimental flag is OFF)
    if (!this.isExperimentalLifecycleEnabled()) {
      if (plugin.requiredCapabilities) {
        for (const cap of plugin.requiredCapabilities) {
          if (!this.capabilities.has(cap)) {
            throw new Error(
              `Plugin ${plugin.name} requires missing capability: ${cap}`
            );
          }
        }
      }
    }
    // Create enhanced plugin context
    const hooksSurface = {
      addHook: (name: string, handler: (payload: unknown) => unknown, owner?: string, priority?: 'low' | 'normal' | 'high' | 'critical') => {
        this.hookRegistry.addHook(
          name,
          ((payload: unknown) => handler(payload)) as unknown as (...args: unknown[]) => unknown,
          owner ?? plugin.name,
          priority
        );
      },
      removeHooks: (owner: string) => this.hookRegistry.removeHooks(owner),
      callHook: (name: string, payload: unknown) => this.hookRegistry.callHook(name, payload as unknown as { [key: string]: unknown }),
    } as unknown as import('./types/hooks-contract.js').HookRegistrySurface;

    const logger: PluginLogger = {
      info: (msg: string) => console.log(`[plugin:${plugin.name}] ${msg}`),
      warn: (msg: string) => console.warn(`[plugin:${plugin.name}] ${msg}`),
      error: (msg: string) => console.error(`[plugin:${plugin.name}] ${msg}`),
    };

    const context: PluginContext = {
      hooks: hooksSurface,
      registerHook: (registration: HookRegistration) => {
        this.hookRegistry.addHook(
          registration.name,
          // Adapt typed payload handler to generic unknown[] signature
          ((payload: unknown) => registration.handler(payload as never)) as unknown as (...args: unknown[]) => unknown,
          plugin.name,
          registration.priority
        );
      },
      capabilities: this.capabilities,
      logger,
      app: this.appContext ? {
        name: this.appContext.name,
        registerRoute: this.appContext.registerRoute || (() => {}),
        registerMiddleware: this.appContext.registerMiddleware || (() => {}),
        registerService: (name: string, service: unknown) => {
          this.registerService(name, service);
          const reg = this.appContext?.registerService;
          if (typeof reg === 'function') reg(name, service);
        }
      } : undefined,
      dev: this.devContext ? {
        isDevMode: this.devContext.isDevMode || false,
        hotReload: this.devContext.hotReload || false,
        // Align with types barrel signature (paths[], cb)
        watchFiles: ((paths: string[], cb: (event: string, file: string) => void) => {
          const anyWatch = this.devContext?.watchFiles as unknown as () => void;
          // Back-compat no-op if underlying dev context doesn't support args
          if (typeof anyWatch === 'function') anyWatch();
          void paths; void cb;
        }),
        compileOnChange: this.devContext.compileOnChange || false
      } : undefined,
      runtime: this.runtimeContext ? {
        type: this.runtimeContext.type || 'unknown',
        adapter: this.runtimeContext.adapter || null,
        capabilities: this.runtimeContext.capabilities || {}
      } : undefined
    };
    // Security: audit plugin before init
    const audit = securityAuditPlugin({
      name: plugin.name,
      version: plugin.version,
      requiredCapabilities: plugin.requiredCapabilities,
    });
    if (!audit.ok) {
      // Emit securityError hook with reasons and do not initialize
      this.hookRegistry.callHook('securityError', {
        plugin: { name: plugin.name },
        reasons: audit.reasons,
        context: { phase: 'register' },
      });
      throw new Error(`Security audit failed for plugin ${plugin.name}: ${audit.reasons?.join(', ')}`);
    }

    const useExperimental = this.isExperimentalLifecycleEnabled();
    try {
      if (plugin.init) {
        plugin.init(context);
      }
      this.plugins.set(plugin.name, plugin);
      if (plugin.onLoad) {
        plugin.onLoad(context);
      }
      if (plugin.onRegisterServices) {
        plugin.onRegisterServices(context);
      }
      this.hookRegistry.callHook('pluginActivate', { plugin });
    } catch (err) {
      if (useExperimental) {
        try { this.hookRegistry.callHook('pluginDeactivate', { plugin }); } catch { /* noop */ }
        try { plugin.onUnload?.(context); } catch { /* noop */ }
        this.hookRegistry.removeHooks(plugin.name);
        this.plugins.delete(plugin.name);
      }
      throw err;
    }

    // Register services via legacy providesService as a fallback
    if (plugin.providesService && plugin.getService) {
      const knownNames = ['router','httpClient','devServer','fileRouter','ssr','state','errorHandler'];
      for (const name of knownNames) {
        if (plugin.providesService(name)) {
          if (this.services.has(name)) {
            logger.warn(`Duplicate service registration attempted for '${name}'. Keeping first.`);
          } else {
            this.services.set(name, plugin.getService(name));
          }
        }
      }
    }
    
    // Automatically register plugin capabilities with CapabilityManager
    CapabilityManager.autoRegisterPluginCapabilities(plugin);

    // After plugin registration hook
    this.hookRegistry.callHook('afterPluginRegister', { plugin });
    if (this.isExperimentalLifecycleEnabled()) {
      this.runCapabilityAudit();
    }
  }

  unregisterPlugin(pluginName: string) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;
    // Before plugin unregister hook
    this.hookRegistry.callHook('beforePluginUnregister', { plugin });
    // Create context for unload
    const unloadHooksSurface = {
      addHook: (name: string, handler: (payload: unknown) => unknown, owner?: string, priority?: 'low' | 'normal' | 'high' | 'critical') => {
        this.hookRegistry.addHook(
          name,
          ((payload: unknown) => handler(payload)) as unknown as (...args: unknown[]) => unknown,
          owner ?? plugin.name,
          priority
        );
      },
      removeHooks: (owner: string) => this.hookRegistry.removeHooks(owner),
      callHook: (name: string, payload: unknown) => this.hookRegistry.callHook(name, payload as unknown as { [key: string]: unknown }),
    } as unknown as import('./types/hooks-contract.js').HookRegistrySurface;

    const logger: PluginLogger = {
      info: (msg: string) => console.log(`[plugin:${plugin.name}] ${msg}`),
      warn: (msg: string) => console.warn(`[plugin:${plugin.name}] ${msg}`),
      error: (msg: string) => console.error(`[plugin:${plugin.name}] ${msg}`),
    };

    const context: PluginContext = {
      hooks: unloadHooksSurface,
      registerHook: () => {},
      capabilities: this.capabilities,
      logger,
      app: this.appContext ? {
        name: this.appContext.name,
        registerRoute: this.appContext.registerRoute || (() => {}),
        registerMiddleware: this.appContext.registerMiddleware || (() => {}),
        registerService: (name: string, service: unknown) => {
          this.registerService(name, service);
          const reg = this.appContext?.registerService;
          if (typeof reg === 'function') reg(name, service);
        }
      } : undefined,
      dev: this.devContext ? {
        isDevMode: this.devContext.isDevMode || false,
        hotReload: this.devContext.hotReload || false,
        watchFiles: this.devContext.watchFiles || (() => {}),
        compileOnChange: this.devContext.compileOnChange || false
      } : undefined,
      runtime: this.runtimeContext ? {
        type: this.runtimeContext.type || 'unknown',
        adapter: this.runtimeContext.adapter || null,
        capabilities: this.runtimeContext.capabilities || {}
      } : undefined
    };
    // Deactivate hook for observability
    this.hookRegistry.callHook('pluginDeactivate', { plugin });
    // Call unload hook
    if (plugin.onUnload) {
      plugin.onUnload(context);
    }
    // Remove all hooks for this plugin
    this.hookRegistry.removeHooks(pluginName);
    this.plugins.delete(pluginName);
    // After plugin unregister hook
    this.hookRegistry.callHook('afterPluginUnregister', { plugin });
  }

  grantCapability(capability: string) {
    this.capabilities.add(capability);
  }

  revokeCapability(capability: string) {
    this.capabilities.delete(capability);
  }

  getHookRegistry(): HookRegistry {
    return this.hookRegistry;
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Service registry and resolver (merged from src/plugin/registry.ts and resolver.ts)
   */
  static getService(name: string): unknown {
    for (const plugin of PluginManager.globalRegistry().plugins.values()) {
      if (plugin.providesService && plugin.getService && plugin.providesService(name)) {
        return plugin.getService(name);
      }
    }
    return null;
  }

  static resolvePluginService(name: string): unknown {
    return PluginManager.getService(name);
  }

  /**
   * Global registry singleton for static service resolution
   */
  private static _global: PluginManager;
  static globalRegistry(): PluginManager {
    if (!PluginManager._global) {
      PluginManager._global = new PluginManager();
    }
    return PluginManager._global;
  }

  getService<T>(name: string): T | undefined {
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }
    // Search through plugins - Fix: Add proper null checks
    for (const plugin of this.plugins.values()) {
      if (plugin.providesService && plugin.getService && plugin.providesService(name)) {
        const service = plugin.getService(name);
        if (this.services.has(name)) {
          // do not override existing
        } else {
          this.services.set(name, service);
        }
        return service as T;
      }
    }
    return undefined;
  }

  hasService(name: string): boolean {
    return this.services.has(name) || 
      Array.from(this.plugins.values()).some(p => p.providesService && p.providesService(name));
  }

  register(plugins: Plugin | Plugin[]): void {
    if (Array.isArray(plugins)) {
      plugins.forEach(p => this.registerPlugin(p));
    } else {
      this.registerPlugin(plugins);
    }
  }

  /** Register a service explicitly (preferred in Phase 4) */
  registerService(name: string, service: unknown): void {
    if (this.services.has(name)) {
      console.warn(`[service] Duplicate registration for '${name}'. Keeping first.`);
      return;
    }
    this.services.set(name, service);
  }

  /** Phase 4: Aggregated capability audit */
  runCapabilityAudit(): AuditResult {
    const warnings: AuditResult['warnings'] = [];
    const errors: AuditResult['errors'] = [];
    // naive aggregation based on requiredCapabilities; announcedCapabilities is optional
    const provided = new Set<string>();
    for (const p of this.plugins.values()) {
      for (const cap of p.announcedCapabilities ?? []) provided.add(cap);
    }
    for (const p of this.plugins.values()) {
      for (const req of p.requiredCapabilities ?? []) {
        if (!provided.has(req) && !this.capabilities.has(req)) {
          errors.push({ plugin: p.name, capability: req, message: `Required capability not satisfied: ${req}`, level: 'error' });
        }
      }
    }
    const ok = errors.length === 0;
    const summary = ok ? 'Capability audit OK' : `Capability audit failed: ${errors.length} error(s)`;
    const result: AuditResult = { ok, warnings, errors, summary };
    this.auditResult = result;
    // Emit hook for observers
    this.hookRegistry.callHook('onCapabilityAudit', result);
    // Notify plugins
    for (const p of this.plugins.values()) {
      p.onCapabilityAudit?.(result);
    }
    return result;
  }

  getAudit(): AuditResult | null { return this.auditResult; }
}