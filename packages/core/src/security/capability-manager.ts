/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import type { SwissComponent } from '../component/component.js';
import { PluginManager } from '../plugins/pluginManager.js';
import { evaluateCapability } from './index.js';
import type {
  CapabilityService,
  CapabilityScope,
  CapabilityContext,
  CapabilityAuditLog,
  RateLimitEntry,
} from './types/index.js';

export class CapabilityManager {
  // Global capability registry
  private static globalCapabilities = new Set<string>();
  // Component-specific capabilities
  private static componentCapabilities = new WeakMap<typeof SwissComponent, Set<string>>();
  // Runtime registry for capability-to-service mapping
  private static serviceRegistry = new Map<string, CapabilityService>();
  // Cache for resolved capabilities
  private static resolutionCache = new Map<string, CapabilityService>();
  // Capability scope mapping
  private static capabilityScopes = new Map<string, CapabilityScope>();
  // Audit log
  private static auditLog: CapabilityAuditLog[] = [];
  // Rate limiting
  private static rateLimits = new Map<string, RateLimitEntry>();
  private static rateLimitConfig: number = 1000;
  // Fallback services
  private static fallbackServices = new Map<string, CapabilityService>();

  // Plugin integration
  private static pluginManager: PluginManager | null = null;

  // Set the plugin manager instance for integration
  static setPluginManager(pluginManager: PluginManager): void {
    this.pluginManager = pluginManager;
  }

  // Discover capabilities from registered plugins
  static discoverPluginCapabilities(): string[] {
    const capabilities: string[] = [];
    
    if (this.pluginManager) {
      const pluginNames = this.pluginManager.listPlugins();
      
      for (const pluginName of pluginNames) {
        const plugin = this.pluginManager.getService(pluginName);

        if (plugin && typeof plugin === 'object' && plugin !== null && 'capabilities' in plugin) {
          const pluginWithCaps = plugin as { capabilities: string[] };
          if (Array.isArray(pluginWithCaps.capabilities)) {
            capabilities.push(...pluginWithCaps.capabilities.map((cap: string) => `${pluginName}:${cap}`));
          }
        }
        
        const commonServices = ['router', 'httpClient', 'devServer', 'fileRouter', 'ssr', 'state', 'errorHandler'];
        for (const serviceName of commonServices) {
          if (this.pluginManager.hasService(serviceName)) {
            capabilities.push(`${pluginName}:${serviceName}`);
          }
        }
      }
    }
    
    return capabilities;
  }

  // Register capabilities discovered from plugins
  static registerPluginCapabilities(): void {
    const pluginCaps = this.discoverPluginCapabilities();
    this.registerGlobal(pluginCaps);
  }

  // Automatically register capabilities from a plugin
  static autoRegisterPluginCapabilities(plugin: { 
    name: string,
    capabilities?: string[];
    providesService?: (name: string) => boolean;
    getService?: (name: string) => CapabilityService;
   }): void {
    if (plugin.capabilities && Array.isArray(plugin.capabilities)) {
      this.registerGlobal(plugin.capabilities);
      
      plugin.capabilities.forEach((cap: string) => {
        if (plugin.getService && plugin.providesService && plugin.providesService(cap)) {
          const service = plugin.getService(cap);
          if (service) {
            this.registerService(cap, service);
          }
        }
      });
    }
    
    const commonServices = ['router', 'httpClient', 'devServer', 'fileRouter', 'ssr', 'state', 'errorHandler'];
    commonServices.forEach(serviceName => {
      if (plugin.providesService && plugin.providesService(serviceName)) {
        this.registerGlobal([serviceName]);
        
        if (plugin.getService) {
          const service = plugin.getService(serviceName);
          if (service) {
            this.registerService(serviceName, service);
          }
        }
      }
    });
  }

  // Register global capabilities
  static registerGlobal(capabilities: string[]): void {
    capabilities.forEach(cap => {
      this.globalCapabilities.add(cap);
      this.capabilityScopes.set(cap, 'global');
    });
  }

  // Register component-specific capabilities
  static registerForComponent(component: typeof SwissComponent, capabilities: string[]): void {
    const capSet = new Set(capabilities);
    this.componentCapabilities.set(component, capSet);
    capabilities.forEach(cap => this.capabilityScopes.set(cap, 'component'));
  }

  // Get capabilities provided by a component class
  static getProvidedCapabilities(component: typeof SwissComponent): string[] {
    const capSet = this.componentCapabilities.get(component);
    return capSet ? Array.from(capSet) : [];
  }

  // Register a service for a capability
  static registerService(capability: string, service: CapabilityService): void {
    if (!this.isValidCapabilityFormat(capability)) {
      throw new Error(`Invalid capability format: ${capability}. Expected "namespace:action"`);
    }
    
    this.serviceRegistry.set(capability, service);
    this.resolutionCache.delete(capability);
  }

  // Unregister a service for a capability
  static unregisterService(capability: string): boolean {
    const result = this.serviceRegistry.delete(capability);
    this.resolutionCache.delete(capability);
    return result;
  }

  // Resolve a capability to its service function with validation and security
  static resolve<T extends CapabilityService>(
    capability: string, 
    context?: CapabilityContext
  ): T | null {
    if (!capability || typeof capability !== 'string') {
      throw new Error('Capability must be a non-empty string');
    }
    
    if (this.isRateLimited(capability, context)) {
      this.logAudit(capability, context, false, 'Rate limit exceeded');
      throw new Error(`Rate limit exceeded for capability: ${capability}`);
    }
    
    if (!this.validateScope(capability, context)) {
      this.logAudit(capability, context, false, 'Scope validation failed');
      return this.getFallbackService(capability) as T | null;
    }
    
        if (!this.validatePermissions(capability, context)) {
      this.logAudit(capability, context, false, 'Permission validation failed');
      return this.getFallbackService(capability) as T | null;
    }
    
    if (this.resolutionCache.has(capability)) {
      this.logAudit(capability, context, true);
      const service = this.resolutionCache.get(capability);
      return service as T;
    }
    
    if (this.serviceRegistry.has(capability)) {
      const service = this.serviceRegistry.get(capability)!;
      this.resolutionCache.set(capability, service);
      this.logAudit(capability, context, true);
      return service as T;
    }
    
    const fallback = this.getFallbackService(capability);
    if (fallback) {
      this.logAudit(capability, context, true, 'Using fallback service');
      return fallback as T;
    }

    this.logAudit(capability, context, false, 'Capability not found');
    return null;
  }

  // Resolve a capability to its service function asynchronously with validation and security
  static async resolveAsync<T extends CapabilityService>(
    capability: string, 
    context?: CapabilityContext
  ): Promise<T | null> {
    if (!capability || typeof capability !== 'string') {
      throw new Error('Capability must be a non-empty string');
    }
    
    if (this.isRateLimited(capability, context)) {
      this.logAudit(capability, context, false, 'Rate limit exceeded');
      throw new Error(`Rate limit exceeded for capability: ${capability}`);
    }
    
    if (!this.validateScope(capability, context)) {
      this.logAudit(capability, context, false, 'Scope validation failed');
      return Promise.resolve(this.getFallbackService(capability) as T | null);
    }
    
        if (!this.validatePermissions(capability, context)) {
      this.logAudit(capability, context, false, 'Permission validation failed');
      return Promise.resolve(this.getFallbackService(capability) as T | null);
    }
    
    if (this.resolutionCache.has(capability)) {
      this.logAudit(capability, context, true);
      return this.resolutionCache.get(capability) as T;
    }
    
    if (this.serviceRegistry.has(capability)) {
      const service = this.serviceRegistry.get(capability)!;
      this.resolutionCache.set(capability, service);
      this.logAudit(capability, context, true);
      return service as T;
    }
    
    const fallback = this.getFallbackService(capability);
    if (fallback) {
      this.logAudit(capability, context, true, 'Using fallback service');
      return fallback as T;
    }
    
    if (this.pluginManager) {
      try {
        const pluginService = this.pluginManager.getService<T>(capability);
        if (pluginService) {
          this.resolutionCache.set(capability, pluginService as CapabilityService);
          this.logAudit(capability, context, true, 'Resolved from plugin manager');
          return pluginService;
        }
      } catch (error) {
        console.warn(`Failed to resolve capability '${capability}' from plugins:`, error);
      }
    }
    
    this.logAudit(capability, context, false, 'Capability not found');
    return null;
  }

  // Check if capability exists (global, component-specific, or in plugins)
  static has(capability: string, component?: SwissComponent): boolean {
    if (this.globalCapabilities.has(capability)) return true;

    if (component) {
      const componentCaps = this.componentCapabilities.get(component.constructor as typeof SwissComponent);
      if (componentCaps?.has(capability)) return true;
    }

    if (this.pluginManager && this.pluginManager.hasService(capability)) {
      return true;
    }
    return false;
  }

  // Check if all capabilities exist
  static hasAll(capabilities: string[], component?: SwissComponent): boolean {
    return capabilities.every(cap => this.has(cap, component));
  }

  // Serialize the capability registry to a JSON-serializable object
  static serializeRegistry(): { globalCapabilities: string[], serviceRegistry: string[] } {
    return {
      globalCapabilities: Array.from(this.globalCapabilities),
      serviceRegistry: Array.from(this.serviceRegistry.keys())
    };
  }

  // Deserialize the capability registry from a JSON-serializable object
  static deserializeRegistry(data: { globalCapabilities: string[], serviceRegistry: string[] }): void {
    this.globalCapabilities.clear();
    
    if (data.globalCapabilities) {
      this.globalCapabilities = new Set(data.globalCapabilities);
    }
  }

  // Register a fallback service for a capability
  static registerFallbackService(capability: string, service: CapabilityService): void {
    if (!this.isValidCapabilityFormat(capability)) {
      throw new Error(`Invalid capability format: ${capability}. Expected "namespace:action"`);
    }
    
    this.fallbackServices.set(capability, service);
  }

  // Get audit logs
  static getAuditLogs(): CapabilityAuditLog[] {
    return [...this.auditLog];
  }

  // Clear audit logs
  static clearAuditLogs(): void {
    this.auditLog = [];
  }

  // Set rate limit (requests per minute)
  static setRateLimit(limit: number): void {
    this.rateLimitConfig = limit;
  }

  // Helper method to validate capability format
  private static isValidCapabilityFormat(capability: string): boolean {
    return typeof capability === 'string' && capability.includes(':') && capability.length > 0;
  }

  // Helper method to validate capability scope
  private static validateScope(capability: string, context?: CapabilityContext): boolean {
    const scope = this.capabilityScopes.get(capability);
    
    // If no scope is defined, allow access
    if (!scope) return true;
    
    // Global scope is accessible from anywhere
    if (scope === 'global') return true;
    
    // Component scope requires a component context
    if (scope === 'component') {
      return !!context?.component;
    }
    
    // Plugin scope requires a plugin context
    if (scope === 'plugin') {
      return !!context?.plugin;
    }
    
    return false;
  }

  // Helper method to validate permissions (simplified implementation)
    private static validatePermissions(capability: string, context?: CapabilityContext): boolean {
    // Delegate to security gateway if present; default allow if no gateway
    try {
      const securityContext = {
        layer: context?.plugin ? 'plugin' : context?.component ? 'component' : 'runtime',
        componentName: context?.component ? String((context.component as { constructor?: { name?: string } })?.constructor?.name ?? 'Unknown') : undefined,
        pluginName: context?.plugin,
        userId: context?.userId,
      } as Parameters<typeof evaluateCapability>[1];
      return evaluateCapability(capability, securityContext);
    } catch {
      // If gateway not set, allow by default to preserve current behavior
      return true;
    }
  }

  // Helper method to check rate limiting
  private static isRateLimited(capability: string, context?: CapabilityContext): boolean {
    const key = `${capability}-${context?.userId || 'anonymous'}`;
    const now = Date.now();
    const entry = this.rateLimits.get(key);
    
    // If no entry exists, create one
    if (!entry) {
      this.rateLimits.set(key, { count: 1, timestamp: now });
      return false;
    }
    
    // If the entry is older than 1 minute, reset it
    if (now - entry.timestamp > 60000) {
      this.rateLimits.set(key, { count: 1, timestamp: now });
      return false;
    }
    
    // Increment the count
    entry.count++;
    
    // Check if limit is exceeded
    return entry.count > this.rateLimitConfig;
  }

  // Helper method to log audit entries
  private static logAudit(
    capability: string, 
    context: CapabilityContext | undefined, 
    success: boolean, 
    error?: string
  ): void {
    const logEntry: CapabilityAuditLog = {
      capability,
      timestamp: Date.now(),
      userId: context?.userId,
      component: context?.component?.constructor?.name,
      plugin: context?.plugin,
      success,
      error
    };
    
    this.auditLog.push(logEntry);
    
    // Keep only the last 1000 log entries to prevent memory issues
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  // Helper method to get fallback service
  private static getFallbackService(
    capability: string
  ): CapabilityService | null {
    return this.fallbackServices.get(capability) || null;
  }
}