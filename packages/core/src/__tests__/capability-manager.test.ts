/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PluginManager } from '../plugins/pluginManager.js';

// Mock the component system to avoid circular dependencies
vi.mock('../component/component.js', () => {
  return {
    SwissComponent: class SwissComponent {
      static requires: string[] = [];
      static isErrorBoundary = false;
      constructor() {}
    }
  };
});

// Create a mock PluginManager
const mockPluginManager = {
  hasService: vi.fn(),
  getService: vi.fn(),
  listPlugins: vi.fn(),
  register: vi.fn(),
  unregister: vi.fn(),
  grantCapability: vi.fn(),
  revokeCapability: vi.fn(),
  getHookRegistry: vi.fn().mockReturnValue({
    addHook: vi.fn(),
    removeHook: vi.fn(),
    callHook: vi.fn(),
    removeHooks: vi.fn()
  }),
  discoverPluginCapabilities: vi.fn().mockReturnValue([])
};

let pluginManager: unknown;
beforeEach(() => {
  pluginManager = mockPluginManager;
  // Set the plugin manager for CapabilityManager
  CapabilityManager.setPluginManager(pluginManager as PluginManager);
  // Clear all mocks before each test
  vi.clearAllMocks();
});

import { CapabilityManager } from '../security/capability-manager.js';

describe('CapabilityManager', () => {
  // Clear all registries before each test
  beforeEach(() => {
    // Clear via structural casts to avoid explicit any
    const CM = CapabilityManager as unknown as {
      globalCapabilities: Set<string>;
      componentCapabilities: WeakMap<unknown, Set<string>>;
      serviceRegistry: Map<string, unknown>;
      resolutionCache: Map<string, unknown>;
    };
    CM.globalCapabilities.clear();
    CM.componentCapabilities = new WeakMap();
    CM.serviceRegistry.clear();
    CM.resolutionCache.clear();
  });

  describe('Backward Compatibility', () => {
    it('should register and check global capabilities', () => {
      CapabilityManager.registerGlobal(['ui:render', 'data:fetch']);
      expect(CapabilityManager.has('ui:render')).toBe(true);
      expect(CapabilityManager.has('data:fetch')).toBe(true);
      expect(CapabilityManager.has('ui:unknown')).toBe(false);
    });

    it('should register and check component-specific capabilities', () => {
      // Create a mock component class for testing
      class TestComponent {
        static componentName = 'TestComponent';
        static requires: string[] = [];
        static isErrorBoundary = false;
        constructor() {}
      }
      
      CapabilityManager.registerForComponent(TestComponent as unknown as typeof SwissComponent, ['component:render', 'component:update']);
      // Create an instance with a constructor property
      const instance = { constructor: TestComponent } as unknown as SwissComponent;
      
      expect(CapabilityManager.has('component:render', instance)).toBe(true);
      expect(CapabilityManager.has('component:update', instance)).toBe(true);
      expect(CapabilityManager.has('component:unknown', instance)).toBe(false);
    });

    it('should check multiple capabilities with hasAll', () => {
      CapabilityManager.registerGlobal(['ui:render', 'data:fetch', 'auth:validate']);
      
      expect(CapabilityManager.hasAll(['ui:render', 'data:fetch'])).toBe(true);
      expect(CapabilityManager.hasAll(['ui:render', 'unknown:capability'])).toBe(false);
    });
  });

  describe('New Registry Features', () => {
    it('should register and resolve services', () => {
      const testService = () => 'test result';
      CapabilityManager.registerService('service:test', testService);
      
      const resolved = CapabilityManager.resolve('service:test');
      expect(resolved).toBe(testService);
      expect(resolved!()).toBe('test result');
    });

    it('should return null for unresolved capabilities', () => {
      const resolved = CapabilityManager.resolve('service:unknown');
      expect(resolved).toBeNull();
    });

    it('should unregister services', () => {
      const testService = () => 'test result';
      CapabilityManager.registerService('service:test', testService);
      
      expect(CapabilityManager.resolve('service:test')).toBe(testService);
      
      const result = CapabilityManager.unregisterService('service:test');
      expect(result).toBe(true);
      expect(CapabilityManager.resolve('service:test')).toBeNull();
    });

    it('should validate capability format', () => {
      expect(() => CapabilityManager.registerService('invalid_capability', () => {})).toThrow();
      // Resolve throws for null/undefined capabilities
      expect(() => CapabilityManager.resolve('')).toThrow();
      expect(() => CapabilityManager.resolve(null as unknown as string)).toThrow();
      // For invalid format but valid string, it returns null
      expect(CapabilityManager.resolve('invalid_capability')).toBeNull();
    });
  });

  describe('Async Resolution', () => {
    it('should resolve services asynchronously', async () => {
      const asyncService = async () => 'async result';
      CapabilityManager.registerService('service:async', asyncService);
      
      const resolved = await CapabilityManager.resolveAsync('service:async');
      expect(resolved).toBe(asyncService);
      expect(await resolved!()).toBe('async result');
    });

    it('should return null for unresolved capabilities asynchronously', async () => {
      const resolved = await CapabilityManager.resolveAsync('service:unknown');
      expect(resolved).toBeNull();
    });
  });

  describe('Registry Persistence', () => {
    it('should serialize registry data', () => {
      CapabilityManager.registerGlobal(['ui:render', 'data:fetch']);
      CapabilityManager.registerService('service:test', () => 'result');
      
      const serialized = CapabilityManager.serializeRegistry();
      expect(serialized.globalCapabilities).toContain('ui:render');
      expect(serialized.globalCapabilities).toContain('data:fetch');
      expect(serialized.serviceRegistry).toContain('service:test');
    });

    it('should deserialize registry data', () => {
      // First, set up some data
      CapabilityManager.registerGlobal(['ui:render']);
      CapabilityManager.registerService('service:test', () => 'result');
      
      // Serialize
      const serialized = CapabilityManager.serializeRegistry();
      
      // Clear registries using structural cast
      const CM2 = CapabilityManager as unknown as {
        globalCapabilities: Set<string>;
        serviceRegistry: Map<string, unknown>;
      };
      CM2.globalCapabilities.clear();
      CM2.serviceRegistry.clear();
      
      // Verify cleared
      expect(CapabilityManager.has('ui:render')).toBe(false);
      
      // Deserialize
      CapabilityManager.deserializeRegistry(serialized);
      
      // Note: We can only verify capability names, not service functions
      // as functions cannot be serialized/deserialized
      const newSerialized = CapabilityManager.serializeRegistry();
      expect(newSerialized.globalCapabilities).toContain('ui:render');
    });
  });

  describe('Plugin Integration', () => {
    beforeEach(() => {
      // Clear all mock calls
      vi.clearAllMocks();
    });

    it('should check capabilities in plugin manager', () => {
      // Mock the plugin manager's hasService method
      pluginManager.hasService.mockImplementation((capability) => {
        return capability === 'plugin:storage:read';
      });

      // Test checking a capability that exists in plugin manager
      expect(CapabilityManager.has('plugin:storage:read')).toBe(true);
      expect(pluginManager.hasService).toHaveBeenCalledWith('plugin:storage:read');
    });

    it('should resolve capabilities from plugin manager', async () => {
      // Mock the plugin manager's getService method
      const mockService = vi.fn();
      pluginManager.getService.mockImplementation((capability) => {
        if (capability === 'plugin:storage:read') {
          return mockService;
        }
        return null;
      });

      // Test resolving a capability from plugin manager
      const resolved = await CapabilityManager.resolveAsync('plugin:storage:read');
      expect(resolved).toBe(mockService);
      expect(pluginManager.getService).toHaveBeenCalledWith('plugin:storage:read');
    });

    it('should return false for non-existent plugin capabilities', () => {
      // Mock the plugin manager's hasService method to return false
      pluginManager.hasService.mockReturnValue(false);

      // Test checking a capability that doesn't exist in plugin manager
      expect(CapabilityManager.has('plugin:nonexistent:read')).toBe(false);
      expect(pluginManager.hasService).toHaveBeenCalledWith('plugin:nonexistent:read');
    });

    it('should handle plugin service resolution errors', async () => {
      // Mock the plugin manager's getService method to return null
      pluginManager.getService.mockReturnValue(null);

      // Test resolving a capability that fails
      const resolved = await CapabilityManager.resolveAsync('plugin:storage:read');
      expect(resolved).toBeNull();
      expect(pluginManager.getService).toHaveBeenCalledWith('plugin:storage:read');
    });

    it('should list all available plugin capabilities', () => {
      // Mock the plugin manager's listPlugins method to return plugin names
      pluginManager.listPlugins.mockReturnValue([
        'storage',
        'network'
      ]);
      
      // Mock getService to return plugin objects with capabilities
      pluginManager.getService.mockImplementation((pluginName) => {
        if (pluginName === 'storage') {
          return { capabilities: ['read', 'write'] };
        } else if (pluginName === 'network') {
          return { capabilities: ['fetch'] };
        }
        return null;
      });
      
      // Mock hasService for common services
      pluginManager.hasService.mockImplementation((serviceName) => {
        return serviceName === 'storage' || serviceName === 'network';
      });

      // Test discovering plugin capabilities
      const capabilities = CapabilityManager.discoverPluginCapabilities();
      expect(capabilities).toContain('storage:read');
      expect(capabilities).toContain('storage:write');
      expect(capabilities).toContain('network:fetch');
      expect(pluginManager.listPlugins).toHaveBeenCalled();
    });
  });
});
