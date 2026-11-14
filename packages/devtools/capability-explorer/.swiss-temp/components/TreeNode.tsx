/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/** @jsxImportSource @swissjs/core */
/// <reference types="@swissjs/core" />
import { SwissComponent } from '@swissjs/core';
import type { ComponentNode, CapabilityConflict } from '../services/DataService.js';

interface TreeNodeProps {
  node: ComponentNode;
  conflicts: CapabilityConflict[];
  onNodeSelect: (node: ComponentNode) => void;
  allNodes?: ComponentNode[]; // Pass all nodes for provider/consumer detection
  level?: number; // Nesting level for indentation
}

interface TreeNodeState {
  expanded: boolean;
}

export default class TreeNode extends SwissComponent<TreeNodeProps, TreeNodeState> {
  constructor(props: TreeNodeProps) {
    super(props);
    this.state = {
      expanded: (props.level || 0) < 2 // Auto-expand first 2 levels
    };
  }

  get children(): ComponentNode[] {
    return (this.props.node as any).children || [];
  }

  get hasConflicts(): boolean {
    return this.props.conflicts.some(c => c.componentId === this.props.node.id);
  }

  isConflictCapability = (capability: string): boolean => {
    return this.props.conflicts.some(c => 
      c.componentId === this.props.node.id && c.capability === capability
    );
  };

  // Find all nodes that provide capabilities this node consumes
  getProviders = (capability: string): ComponentNode[] => {
    const providers: ComponentNode[] = [];
    const allNodes = this.getAllNodesFromRoot();
    
    allNodes.forEach(node => {
      if (node.provides.includes(capability) && node.id !== this.props.node.id) {
        providers.push(node);
      }
    });
    
    return providers;
  };

  // Find all nodes that consume capabilities this node provides
  getConsumers = (capability: string): ComponentNode[] => {
    const consumers: ComponentNode[] = [];
    const allNodes = this.getAllNodesFromRoot();
    
    allNodes.forEach(node => {
      if (node.consumes.includes(capability) && node.id !== this.props.node.id) {
        consumers.push(node);
      }
    });
    
    return consumers;
  };

  // Helper to get all nodes from the tree
  getAllNodesFromRoot = (): ComponentNode[] => {
    // Use passed allNodes if available, otherwise fall back to local traversal
    if (this.props.allNodes) {
      return this.props.allNodes;
    }
    
    // Fallback: traverse from current node (limited scope)
    const allNodes: ComponentNode[] = [this.props.node];
    
    const addChildren = (node: ComponentNode) => {
      const children = (node as any).children || [];
      children.forEach((child: ComponentNode) => {
        allNodes.push(child);
        addChildren(child);
      });
    };
    
    addChildren(this.props.node);
    return allNodes;
  };

  toggleExpanded = () => {
    this.setState(state => ({ ...state, expanded: !state.expanded }));
  };

  render() {
    return (
      <div className={`tree-node ${this.hasConflicts ? 'has-conflicts' : ''}`}>
        <div 
          className="node-content" 
          onClick={() => this.props.onNodeSelect(this.props.node)} 
          style={{ paddingLeft: `${(this.props.level || 0) * 20}px` }}
        >
          <span className="node-icon" onClick={this.toggleExpanded}>
            {this.children.length > 0 ? (this.state.expanded ? '▼' : '▶') : '•'}
          </span>
          <span className="node-name">{this.props.node.name}</span>
          <span className="node-id">#{this.props.node.id.slice(-8)}</span>
          
          <div className="capabilities">
            {this.props.node.provides.length > 0 && (
              <div className="provides">
                <span className="label">provides:</span>
                {this.props.node.provides.map(cap => {
                  const consumers = this.getConsumers(cap);
                  return (
                    <span 
                      key={cap} 
                      className="capability provides-cap"
                      title={`Consumed by: ${consumers.map(c => c.name).join(', ') || 'none'}`}
                    >
                      {cap}
                      {consumers.length > 0 && (
                        <span className="connection-indicator">→{consumers.length}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            
            {this.props.node.consumes.length > 0 && (
              <div className="consumes">
                <span className="label">consumes:</span>
                {this.props.node.consumes.map(cap => {
                  const providers = this.getProviders(cap);
                  const isConflict = this.isConflictCapability(cap);
                  return (
                    <span 
                      key={cap} 
                      className={`capability consumes-cap ${isConflict ? 'conflict' : ''}`}
                      title={`Provided by: ${providers.map(p => p.name).join(', ') || 'none'}`}
                    >
                      {providers.length > 0 && !isConflict && (
                        <span className="connection-indicator">←{providers.length}</span>
                      )}
                      {cap}
                      {isConflict && <span className="conflict-indicator">⚠</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {this.state.expanded && this.children.map(child => (
          <TreeNode 
            key={child.id}
            node={child}
            conflicts={this.props.conflicts}
            level={(this.props.level || 0) + 1}
            onNodeSelect={this.props.onNodeSelect}
            allNodes={this.props.allNodes}
          />
        ))}
      </div>
    );
  }

  private getStyles(): string {
    return html`
      <style>
        .tree-node {
          margin: 2px 0;
        }

        .tree-node.has-conflicts {
          background-color: #fff3cd;
          border-left: 3px solid #ffc107;
        }

        .node-content {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 3px;
          gap: 8px;
        }

        .node-content:hover {
          background-color: #f8f9fa;
        }

        .expand-icon {
          width: 12px;
          height: 12px;
          cursor: pointer;
        }

        .node-name {
          font-weight: 500;
        }

        .node-type {
          font-size: 0.8em;
          color: #666;
          margin-left: 8px;
        }

        .capabilities {
          display: flex;
          gap: 4px;
          margin-left: auto;
        }

        .capability-badges {
          display: flex;
          gap: 4px;
        }

        .provider-badge {
          font-size: 0.75em;
          padding: 2px 4px;
          border-radius: 2px;
          color: #155724;
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
        }

        .consumer-badge {
          font-size: 0.75em;
          padding: 2px 4px;
          border-radius: 2px;
          color: #0c5460;
          background-color: #d1ecf1;
          border: 1px solid #bee5eb;
        }

        .conflict-badge {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
      </style>
    `;
  }
}
