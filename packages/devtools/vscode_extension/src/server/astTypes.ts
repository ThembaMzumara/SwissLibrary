/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/**
 * AST Node types for the SwissJS parser
 */

export type NodeType = 
  | 'Document'
  | 'Tag'
  | 'Attribute'
  | 'Text'
  | 'Expression';

export interface BaseNode {
  type: NodeType;
  range: {
    start: { 
      line: number; 
      column: number;
      offset: number;
    };
    end: { 
      line: number; 
      column: number;
      offset: number;
    };
  };
  parent?: ASTNode;
}

export interface DocumentNode extends BaseNode {
  type: 'Document';
  children: (TagNode | TextNode | ExpressionNode)[];
}

export interface TagNode extends BaseNode {
  type: 'Tag';
  name: string;
  selfClosing: boolean;
  attributes: AttributeNode[];
  children: (TagNode | TextNode | ExpressionNode)[];
  /**
   * True when the parser could not find a proper closing tag before EOF
   */
  unclosed?: boolean;
}

export interface AttributeNode extends BaseNode {
  type: 'Attribute';
  name: string;
  value: string | null;
  valueRange?: {
    start: { 
      line: number; 
      column: number;
      offset: number;
    };
    end: { 
      line: number; 
      column: number;
      offset: number;
    };
  };
}

export interface TextNode extends BaseNode {
  type: 'Text';
  value: string;
}

export interface ExpressionNode extends BaseNode {
  type: 'Expression';
  value: string;
  expression: string;
}

export type ASTNode = 
  | DocumentNode
  | TagNode
  | AttributeNode
  | TextNode
  | ExpressionNode;
