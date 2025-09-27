/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * FenestrationRegistry - Core system for managing cross-layer capability piercing
 * 
 * This registry enables direct communication across architectural layers without
 * propagating through intermediate boundaries. It implements the fenestration
 * pattern: "Pierce layers, don't propagate through them."
 */

import type { FenestrationCapability, FenestrationContext, FenestrationResult } from './types/index.js';
export type { FenestrationCapability, FenestrationContext, FenestrationResult } from './types/index.js';

/**
 * Core Fenestration Registry
 * Manages capability registration, resolution, and secure cross-layer piercing
 */
export class FenestrationRegistry {
  private static capabilities: Map<string, FenestrationCapability> = new Map();
  private static services: Map<string, unknown> = new Map();
  private static dependencyGraph = new Map<string, Set<string>>();
  private static securityPolicies = new Map<string, (context: FenestrationContext) => boolean>();
  
  /**
   * Register a capability provider
   * Called during decorator processing and runtime registration
   */
  static register(capabilityId: string, handler: (...args: unknown[]) => unknown, options: { declarationType?: 'provides' | 'requires' | 'capability', sourceFile?: string } = {}): void {
    // Validate capability format
    if (!this.isValidCapabilityId(capabilityId)) {
      throw new Error(`Invalid capability ID format: ${capabilityId}. Must follow pattern: namespace:action`);
    }

    // Store capability
    const capability: FenestrationCapability = {
      id: capabilityId,
      provider: handler,
      method: capabilityId.split(':')[1], // Default to action name
      scope: 'component', // Default scope, can be overridden
      security: {},
      metadata: {
        declarationType: options.declarationType || 'capability',
        sourceFile: options.sourceFile || 'unknown',
        getService: (name: string) => this.services.get(name),
      },
    };
    
    this.capabilities.set(capabilityId, capability);
    
    // Track provider
    if (!this.services.has(capabilityId)) {
      this.services.set(capabilityId, handler);
    }
    
    console.debug(`[Fenestration] Registered capability: ${capabilityId}`);
  }

  /**
   * Pierce architectural layers to access a capability directly
   * This is the core fenestration method
   */
  static pierce<T>(capabilityId: string, context: FenestrationContext, ...params: unknown[]): FenestrationResult<T> {
    try {
      // 1. Validate capability exists
      const capability = this.capabilities.get(capabilityId);
      if (!capability) {
        return {
          success: false,
          error: `Capability '${capabilityId}' not found in registry`,
          pierced: false,
          path: []
        };
      }

      // 2. Security validation
      if (!this.validateSecurity(capability, context)) {
        return {
          success: false,
          error: `Security validation failed for capability '${capabilityId}'`,
          pierced: false,
          path: []
        };
      }

      // 3. Execute the capability
      if (typeof capability.provider !== 'function') {
        throw new TypeError(`Capability provider for '${capabilityId}' is not a function.`);
      }
      const result = (capability.provider as (...args: unknown[]) => T)(...params);
      
      // 4. Track the piercing path
      
      // 5. Track the piercing path
      const path = this.calculatePiercingPath(context.layer, capability.scope);
      
      return {
        success: true,
        data: result,
        pierced: true,
        path
      };

    } catch (error) {
      return {
        success: false,
        error: `Fenestration error: ${error instanceof Error ? error.message : String(error)}`,
        pierced: false,
        path: []
      };
    }
  }

  /**
   * Async version of pierce for capabilities requiring async resolution
   */
  static async pierceAsync<T>(capabilityId: string, context: FenestrationContext, ...params: unknown[]): Promise<FenestrationResult<T>> {
    try {
      // First check if the capability exists and is accessible
      const capability = this.capabilities.get(capabilityId);
      if (!capability) {
        return {
          success: false,
          error: `Capability '${capabilityId}' not found in registry`,
          pierced: false,
          path: []
        };
      }

      // Security validation
      if (!this.validateSecurity(capability, context)) {
        return {
          success: false,
          error: `Security validation failed for capability '${capabilityId}'`,
          pierced: false,
          path: []
        };
      }

      // 3. Execute the capability asynchronously
      if (typeof capability.provider !== 'function') {
        return {
          success: false,
          error: `Capability provider for '${capabilityId}' is not a function.`,
          pierced: false,
          path: []
        };
      }

      // Execute the provider and properly handle both sync and async results
      const result = capability.provider(...params);
      const isPromise = result !== null && typeof result === 'object' && 'then' in result && typeof (result as { then: unknown }).then === 'function';

      // If it's a Promise, await it
      const data = (isPromise ? await result : result) as T;
      
      // Track the piercing path
      const path = this.calculatePiercingPath(context.layer, capability.scope);
      
      return {
        success: true,
        data,
        pierced: true,
        path
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Async fenestration error: ${error instanceof Error ? error.message : String(error)}`,
        pierced: false,
        path: []
      };
    }
  }

  /**
   * Get all capabilities available to a given context
   */
  static getAvailableCapabilities(context: FenestrationContext): string[] {
    const available: string[] = [];
    
    for (const [capabilityId, capability] of this.capabilities) {
      if (this.validateSecurity(capability, context)) {
        available.push(capabilityId);
      }
    }
    
    return available.sort();
  }

  /**
   * Register a security policy for a capability
   */
  static addSecurityPolicy(
    capabilityId: string,
    policy: (context: FenestrationContext) => boolean
  ): void {
    this.securityPolicies.set(capabilityId, policy);
  }

  /**
   * Get the dependency graph for visualization/debugging
   */
  static getDependencyGraph(): Map<string, Set<string>> {
    return new Map(this.dependencyGraph);
  }

  /**
   * Clear all registrations (for testing)
   */
  static clear(): void {
    this.capabilities.clear();
    this.services.clear();
    this.dependencyGraph.clear();
    this.securityPolicies.clear();
  }

  // Private helper methods

  private static isValidCapabilityId(id: string): boolean {
    // Capability IDs must follow pattern: namespace:action (e.g., 'db:query', 'auth:verify')
    return /^[a-z][a-z0-9]*:[a-z][a-z0-9]*$/i.test(id);
  }

  private static validateSecurity(
    capability: FenestrationCapability,
    context: FenestrationContext
  ): boolean {
    // Check custom security policy first
    const customPolicy = this.securityPolicies.get(capability.id);
    if (customPolicy && !customPolicy(context)) {
      return false;
    }

    // Check role-based access
    if (capability.security.roles && context.user) {
      const hasRequiredRole = capability.security.roles.some(role =>
        context.user!.roles.includes(role)
      );
      if (!hasRequiredRole) {
        return false;
      }
    }

    // Check permission-based access
    if (capability.security.permissions && context.session) {
      const hasRequiredPermission = capability.security.permissions.some(permission =>
        context.session!.permissions.includes(permission)
      );
      if (!hasRequiredPermission) {
        return false;
      }
    }

    // 3. Check scope compatibility
    return this.validateScope(capability.scope, context);
  }



  private static validateScope(
    capabilityScope: string,
    context: FenestrationContext
  ): boolean {
    switch (capabilityScope) {
      case 'global':
        return true; // Global capabilities are always accessible
      case 'component':
        return !!context.component; // Requires component context
      case 'plugin':
        return context.layer === 'plugin' || context.layer === 'runtime';
      case 'tenant':
        return !!context.tenant; // Requires tenant context
      default:
        return false;
    }
  }

  private static calculatePiercingPath(
    fromLayer: string,
    toScope: string
  ): string[] {
    // Calculate which architectural layers were pierced
    const layers = ['component', 'service', 'plugin', 'runtime'];
    const fromIndex = layers.indexOf(fromLayer);
    const toIndex = layers.indexOf(toScope === 'global' ? 'runtime' : toScope);
    
    if (fromIndex === -1 || toIndex === -1) {
      return [fromLayer, toScope];
    }
    
    // Return the path of layers that were pierced
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    return layers.slice(start, end + 1);
  }
}

