/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/** @jsxImportSource @swissjs/core */
/// <reference types="@swissjs/core" />
import { SwissComponent } from '@swissjs/core';
import TreeNode from './TreeNode.tsx';
import type { ComponentNode, CapabilityConflict } from '../services/DataService.js';

interface ComponentTreeProps {
  nodes: ComponentNode[];
  conflicts: CapabilityConflict[];
  onNodeSelect: (node: ComponentNode) => void;
}

export default class ComponentTree extends SwissComponent<ComponentTreeProps> {
  constructor(props: ComponentTreeProps) {
    super(props);
  }

  // Flatten all nodes from the tree for provider/consumer detection
  getAllNodes = (): ComponentNode[] => {
    const allNodes: ComponentNode[] = [];
    
    const addNode = (node: ComponentNode) => {
      allNodes.push(node);
      const children = (node as any).children || [];
      children.forEach((child: ComponentNode) => addNode(child));
    };
    
    this.props.nodes.forEach(addNode);
    return allNodes;
  };

  render() {
    const allNodes = this.getAllNodes();
    
    return (
      <div className="component-tree">
        {this.props.nodes.map(node => (
          <TreeNode 
            key={node.id}
            node={node}
            conflicts={this.props.conflicts}
            onNodeSelect={this.props.onNodeSelect}
            allNodes={allNodes}
            level={0}
          />
        ))}
      </div>
    );
  }
}
