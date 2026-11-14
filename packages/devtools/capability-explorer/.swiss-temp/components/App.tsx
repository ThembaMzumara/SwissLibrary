/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/** @jsxImportSource @swissjs/core */
/// <reference types="@swissjs/core" />
import { SwissComponent, html } from '@swissjs/core';
import { DataService, type ComponentNode, type CapabilityConflict } from '../services/DataService.js';

interface AppState {
  nodes: ComponentNode[];
  conflicts: CapabilityConflict[];
  selectedNode: ComponentNode | null;
  conflictsOnly: boolean;
  loading: boolean;
}

export default class App extends SwissComponent<{}, AppState> {
  private dataService = new DataService();

  constructor(props: {}) {
    super(props);
    this.state = {
      nodes: [],
      conflicts: [],
      selectedNode: null,
      conflictsOnly: false,
      loading: false
    };
  }

  async handleMount() {
    await this.loadData();
    // Set up auto-refresh every 2 seconds when devtools is active
    setInterval(() => this.loadData(), 2000);
  }

  async loadData() {
    try {
      this.setState(state => ({ ...state, loading: true }));
      const snapshot = this.dataService.getSnapshot();
      const hierarchicalNodes = this.buildHierarchy(snapshot.nodes);
      const conflicts = this.detectConflicts(snapshot.nodes);
      
      this.setState(state => ({
        ...state,
        nodes: hierarchicalNodes,
        conflicts,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load devtools data:', error);
      this.setState(state => ({ ...state, loading: false }));
    }
  }

  private buildHierarchy(nodes: ComponentNode[]): ComponentNode[] {
    const nodeMap = new Map<string, ComponentNode & { children: ComponentNode[] }>();
    const roots: ComponentNode[] = [];

    // Create enhanced nodes with children arrays
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build parent-child relationships
    nodes.forEach(node => {
      const enhancedNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children.push(enhancedNode);
      } else {
        roots.push(enhancedNode);
      }
    });

    return roots;
  }

  private detectConflicts(nodes: ComponentNode[]): CapabilityConflict[] {
    const conflicts: CapabilityConflict[] = [];
    const nodeMap = new Map<string, ComponentNode>();
    
    nodes.forEach(node => nodeMap.set(node.id, node));

    nodes.forEach(node => {
      node.consumes.forEach(capability => {
        if (!this.canResolveCapability(node, capability, nodeMap)) {
          conflicts.push({
            componentId: node.id,
            componentName: node.name,
            capability,
            reason: `No provider found for '${capability}' in component hierarchy`
          });
        }
      });
    });

    return conflicts;
  }

  private canResolveCapability(
    consumer: ComponentNode, 
    capability: string, 
    nodeMap: Map<string, ComponentNode>
  ): boolean {
    // Walk up the component tree looking for a provider
    let current: ComponentNode | undefined = consumer;
    
    while (current) {
      if (current.provides.includes(capability)) {
        return true;
      }
      current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }
    
    return false;
  }

  get filteredNodes(): ComponentNode[] {
    if (!this.state.conflictsOnly) {
      return this.state.nodes;
    }

    // Filter to only show nodes with conflicts
    const conflictNodeIds = new Set(this.state.conflicts.map(c => c.componentId));
    return this.filterNodesWithConflicts(this.state.nodes, conflictNodeIds);
  }

  private filterNodesWithConflicts(
    nodes: ComponentNode[], 
    conflictIds: Set<string>
  ): ComponentNode[] {
    return nodes.filter(node => {
      const hasConflict = conflictIds.has(node.id);
      const hasChildWithConflict = (node as any).children?.some((child: ComponentNode) => 
        this.filterNodesWithConflicts([child], conflictIds).length > 0
      );
      return hasConflict || hasChildWithConflict;
    }).map(node => ({
      ...node,
      children: (node as any).children ? 
        this.filterNodesWithConflicts((node as any).children, conflictIds) : []
    }));
  }

  get nodeConflicts(): CapabilityConflict[] {
    if (!this.state.selectedNode) return [];
    return this.state.conflicts.filter(c => c.componentId === this.state.selectedNode!.id);
  }

  refreshData = async () => {
    await this.loadData();
  };

  toggleConflictsOnly = () => {
    this.setState(state => ({ 
      ...state, 
      conflictsOnly: !state.conflictsOnly,
      selectedNode: state.conflictsOnly ? null : state.selectedNode
    }));
  };

  onNodeSelect = (node: ComponentNode) => {
    this.setState(state => ({ ...state, selectedNode: node }));
  };

  onConflictSelect = (conflict: CapabilityConflict) => {
    const node = this.state.nodes.find(n => n.id === conflict.componentId);
    if (node) {
      this.setState(state => ({ ...state, selectedNode: node }));
    }
  };

  render() {
    return html`
      <div class="capability-explorer">
        <header class="explorer-header">
          <h1>SwissJS Capability Explorer</h1>
          <div class="controls">
            <button onclick="${this.refreshData}">Refresh</button>
            <button onclick="${this.toggleConflictsOnly}">
              ${this.state.conflictsOnly ? 'Show All' : 'Conflicts Only'}
            </button>
          </div>
        </header>

        <main class="explorer-content">
          <div class="tree-panel">
            <h2>Component Hierarchy</h2>
            <!-- ComponentTree component will be rendered here -->
            <div class="component-tree">
              ${this.filteredNodes.map(node => html`
                <!-- TreeNode rendering -->
                <div class="tree-node">
                  <div class="node-content">
                    <span class="node-name">${node.name}</span>
                    <span class="node-id">#${node.id.slice(-8)}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>

          <div class="details-panel">
            <h2>Details</h2>
            ${this.state.selectedNode ? html`
              <div class="node-details">
                <h3>${this.state.selectedNode.name}</h3>
                <p>ID: ${this.state.selectedNode.id}</p>
                <div class="capabilities">
                  ${this.state.selectedNode.provides.length > 0 ? html`
                    <div class="provides">
                      <span class="label">provides:</span>
                      ${this.state.selectedNode.provides.map(cap => html`
                        <span class="capability provides-cap">${cap}</span>
                      `)}
                    </div>
                  ` : ''}
                  ${this.state.selectedNode.consumes.length > 0 ? html`
                    <div class="consumes">
                      <span class="label">consumes:</span>
                      ${this.state.selectedNode.consumes.map(cap => html`
                        <span class="capability consumes-cap">${cap}</span>
                      `)}
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : html`
              <div class="no-selection">Select a component to view details</div>
            `}
          </div>

          <div class="conflicts-panel">
            <h2>Capability Conflicts (${this.state.conflicts.length})</h2>
            <div class="conflicts-list">
              ${this.state.conflicts.length === 0 ? html`
                <div class="no-conflicts">
                  <div class="success-icon">✅</div>
                  <div class="message">No capability conflicts detected</div>
                </div>
              ` : html`
                <div class="conflict-items">
                  ${this.state.conflicts.map(conflict => html`
                    <div class="conflict-item" onclick="${() => this.onConflictSelect(conflict)}">
                      <div class="conflict-header">
                        <span class="component-name">${conflict.componentName}</span>
                        <span class="capability-name">${conflict.capability}</span>
                      </div>
                      <div class="conflict-details">
                        <span class="reason">${conflict.reason}</span>
                        <span class="component-id">#${conflict.componentId.slice(-8)}</span>
                      </div>
                    </div>
                  `)}
                </div>
              `}
            </div>
          </div>
        </main>
      </div>
    `;
  }
}
