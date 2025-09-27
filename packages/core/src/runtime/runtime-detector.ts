/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * SwissJS Runtime Detection & Selection System
 * Supports both Node.js and Bun.js with automatic detection and fallback
 */

import type { RuntimeType, RuntimeCapabilities } from './types/index.js';

export class RuntimeDetector {
  private static instance: RuntimeDetector;
  private detectedRuntime: RuntimeType = 'unknown';
  private capabilities: RuntimeCapabilities | null = null;

  private constructor() {
    this.detectRuntime();
  }

  static getInstance(): RuntimeDetector {
    if (!RuntimeDetector.instance) {
      RuntimeDetector.instance = new RuntimeDetector();
    }
    return RuntimeDetector.instance;
  }

  private detectRuntime(): void {
    if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
      this.detectedRuntime = 'bun';
      this.capabilities = this.getBunCapabilities();
    } else if (typeof process !== 'undefined' && process.versions?.node) {
      this.detectedRuntime = 'node';
      this.capabilities = this.getNodeCapabilities();
    } else {
      this.detectedRuntime = 'unknown';
      this.capabilities = this.getUnknownCapabilities();
    }
  }

  private getBunCapabilities(): RuntimeCapabilities {
    return {
      type: 'bun',
      version:
        (((globalThis as Record<string, unknown>).Bun as { version?: string } | undefined)?.version) ??
        'unknown',
      features: {
        fileSystem: true,
        networking: true,
        bundling: true,
        testing: true,
        packageManagement: true,
        typescript: true,
        ssr: true
      },
      performance: {
        startupTime: 50,
        fileIoSpeed: 1000,
        memoryUsage: 50
      }
    };
  }

  private getNodeCapabilities(): RuntimeCapabilities {
    return {
      type: 'node',
      version: typeof process !== 'undefined' ? process.versions.node : 'unknown',
      features: {
        fileSystem: true,
        networking: true,
        bundling: false,
        testing: false,
        packageManagement: false,
        typescript: false,
        ssr: true
      },
      performance: {
        startupTime: 150,
        fileIoSpeed: 250,
        memoryUsage: 100
      }
    };
  }

  private getUnknownCapabilities(): RuntimeCapabilities {
    return {
      type: 'unknown',
      version: 'unknown',
      features: {
        fileSystem: false,
        networking: false,
        bundling: false,
        testing: false,
        packageManagement: false,
        typescript: false,
        ssr: false
      },
      performance: {
        startupTime: 0,
        fileIoSpeed: 0,
        memoryUsage: 0
      }
    };
  }

  getRuntimeType(): RuntimeType {
    return this.detectedRuntime;
  }

  getCapabilities(): RuntimeCapabilities {
    if (!this.capabilities) throw new Error('Runtime not detected');
    return this.capabilities;
  }

  // Add this method to fix the TS2339 errors
  getAdapter(): RuntimeCapabilities {
    return this.getCapabilities();
  }

  isBun(): boolean {
    return this.detectedRuntime === 'bun';
  }

  isNode(): boolean {
    return this.detectedRuntime === 'node';
  }

  isServer(): boolean {
    return this.isBun() || this.isNode();
  }
}

export const runtimeDetector = RuntimeDetector.getInstance();