/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { getDevtoolsBridge, type GraphSnapshot, type ComponentNodePayload } from '@swissjs/core';

export interface ComponentNode extends ComponentNodePayload {
  children?: ComponentNode[];
}

export type RuntimeEvent = {
  t: number;
  type: string;
  msg: string;
};

export interface SnapshotEntry {
  id: string;
  t: number;
  state: Record<string, unknown>;
}

/**
 * Minimal data access layer for the Runtime Inspector.
 * Bridges to core devtools bridge where available; otherwise returns safe defaults.
 */
export class DataService {
  getSnapshot(): GraphSnapshot {
    try {
      return getDevtoolsBridge().getGraphSnapshot();
    } catch {
      return { nodes: [], edges: [], createdAt: Date.now() };
    }
  }

  /**
   * Convert flat nodes to hierarchical tree based on parentId.
   */
  toHierarchy(nodes: ComponentNodePayload[]): ComponentNode[] {
    const map = new Map<string, ComponentNode & { children: ComponentNode[] }>();
    const roots: ComponentNode[] = [];

    nodes.forEach(n => map.set(n.id, { ...n, children: [] }));

    nodes.forEach(n => {
      const current = map.get(n.id)!;
      if (n.parentId && map.has(n.parentId)) {
        map.get(n.parentId)!.children!.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  }

  /**
   * Shallow state fetch for a component id.
   * Note: current bridge may not expose state; return empty object if unavailable.
   */
  getShallowState(_id: string): Record<string, unknown> {
    // TECH-DEBT: Inspector relies on a shallow snapshot provided by the bridge.
    // Replace with an explicit request/response channel for fresh, validated
    // snapshots and use a canonical serializer with redaction and depth limits.
    try {
      return getDevtoolsBridge().getStateSnapshot(_id) ?? {};
    } catch {
      return {};
    }
  }

  /**
   * Drain recent runtime events (mount/update/unmount/usage).
   * Note: current bridge does not buffer events; returns empty for now.
   */
  drainEvents(): RuntimeEvent[] {
    // TECH-DEBT: Events are ad-hoc and untyped. Switch to a typed DevtoolsEvent
    // union with category-specific buffers (component/capability/perf/error) and
    // backpressure. Expose cursors or pagination instead of full drains.
    try {
      // Bridge returns generic events; cast to RuntimeEvent for inspector
      return getDevtoolsBridge().drainEvents() as RuntimeEvent[];
    } catch {
      return [];
    }
  }

  takeSnapshot(id: string): SnapshotEntry | null {
    const state = this.getShallowState(id);
    return { id, t: Date.now(), state };
  }

  restoreSnapshot(id: string, state: Record<string, unknown>): boolean {
    try {
      return getDevtoolsBridge().restoreState(id, state);
    } catch {
      return false;
    }
  }
}
