/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { getDevtoolsBridge, type GraphSnapshot, type ComponentNodePayload } from '@swissjs/core';

export interface ComponentNode extends ComponentNodePayload {
  children?: ComponentNode[];
}

export interface CapabilityConflict {
  componentId: string;
  componentName: string;
  capability: string;
  reason: string;
}

export class DataService {
  /**
   * Get the current snapshot of the component hierarchy from the devtools bridge
   */
  getSnapshot(): GraphSnapshot {
    try {
      return getDevtoolsBridge().getGraphSnapshot();
    } catch (error) {
      console.warn('Failed to get devtools snapshot:', error);
      return {
        nodes: [],
        edges: [],
        createdAt: Date.now()
      };
    }
  }

  /**
   * Check if devtools bridge is available and active
   */
  isActive(): boolean {
    try {
      const snapshot = this.getSnapshot();
      return snapshot.nodes.length > 0 || snapshot.createdAt > 0;
    } catch {
      return false;
    }
  }

  /**
   * Reset the devtools bridge data (useful for testing)
   */
  reset(): void {
    try {
      getDevtoolsBridge().reset();
    } catch (error) {
      console.warn('Failed to reset devtools bridge:', error);
    }
  }
}
