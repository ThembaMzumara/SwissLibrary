/*
 * Copyright (c) 2024 SwissJS Framework
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';
import { factory } from 'typescript';
import { createJsxFactory, createJsxFragmentFactory } from './jsx-factories.js';

export function jsxTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit = (node: ts.Node): ts.Node => {
      // Handle JSX elements
      if (ts.isJsxElement(node)) {
        return transformJsxElement(node);
      }
      if (ts.isJsxSelfClosingElement(node)) {
        return transformJsxSelfClosingElement(node);
      }
      if (ts.isJsxFragment(node)) {
        return transformJsxFragment(node);
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (sourceFile: ts.SourceFile) => {
      return ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };
  };
}


function transformJsxElement(node: ts.JsxElement) {
  const tagName = node.openingElement.tagName.getText();
  const attributes = transformAttributes(node.openingElement.attributes);
  
  // Process children
  const children: ts.Expression[] = [];
  for (const child of node.children) {
    const transformed = transformJsxChild(child);
    if (transformed !== null) {
      // Handle multiple adjacent text nodes
      if (ts.isStringLiteral(transformed) && children.length > 0) {
        const lastChild = children[children.length - 1];
        if (ts.isStringLiteral(lastChild)) {
          // Merge adjacent text nodes
          children[children.length - 1] = factory.createStringLiteral(
            lastChild.text + transformed.text
          );
          continue;
        }
      }
      children.push(transformed);
    }
  }
  
  return createJsxFactory(tagName, attributes, children);
}

function transformJsxSelfClosingElement(node: ts.JsxSelfClosingElement) {
  const tagName = node.tagName.getText();
  const attributes = transformAttributes(node.attributes);
  return createJsxFactory(tagName, attributes, []);
}

function transformJsxFragment(node: ts.JsxFragment) {
  const children = node.children
    .map(child => transformJsxChild(child))
    .filter((child): child is ts.Expression => child !== null);
  
  return createJsxFragmentFactory(children);
}

function transformJsxChild(node: ts.JsxChild): ts.Expression | null {
  if (ts.isJsxText(node)) {
    // Handle text content, preserving whitespace but normalizing it
    const text = node.getText()
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
      .replace(/\s+/g, ' ');
    
    return text ? factory.createStringLiteral(text) : null;
  }
  
  if (ts.isJsxExpression(node)) {
    if (node.expression) {
      // Handle expressions like {variable} or {() => { ... }}
      return node.expression as ts.Expression;
    }
    // Empty expression like {}
    return null;
  }
  
  if (ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node)) {
    // Process nested elements or fragments
    if (ts.isJsxElement(node)) {
      return transformJsxElement(node);
    } else if (ts.isJsxSelfClosingElement(node)) {
      return transformJsxSelfClosingElement(node);
    } else if (ts.isJsxFragment(node)) {
      return transformJsxFragment(node);
    }
  }
  
  // Ignore other node types (like JsxSpreadChild)
  return null;
}

function transformAttributes(attributes: ts.JsxAttributes): ts.Expression {
  const properties: ts.ObjectLiteralElementLike[] = [];
  
  for (const prop of attributes.properties) {
    if (ts.isJsxAttribute(prop)) {
      // Handle attribute name (Identifier or JsxNamespacedName)
      const propName = ts.isIdentifier(prop.name)
        ? prop.name.text
        : prop.name.getText();
      
      // Handle attribute value
      let propValue: ts.Expression;
      
      if (!prop.initializer) {
        // Boolean attribute without value (e.g., <input disabled />)
        propValue = factory.createTrue();
      } else if (ts.isStringLiteral(prop.initializer)) {
        // String literal value
        propValue = factory.createStringLiteral(prop.initializer.text);
      } else if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
        // Expression value
        propValue = prop.initializer.expression as ts.Expression;
      } else {
        // Fallback for other cases
        propValue = factory.createNull();
      }
      
      // Special handling for class/className
      const attributeName = propName === 'className' ? 'class' : propName;
      
      // Add the property assignment
      properties.push(
        factory.createPropertyAssignment(
          factory.createStringLiteral(attributeName),
          propValue
        )
      );
    } else if (ts.isJsxSpreadAttribute(prop)) {
      // Handle spread attributes
      properties.push(
        factory.createSpreadAssignment(prop.expression as ts.Expression)
      );
    }
  }
  
  return properties.length > 0 
    ? factory.createObjectLiteralExpression(properties, true)
    : factory.createObjectLiteralExpression([], false);
}

// Helper visitor function for nested JSX
export const visitor = (node: ts.Node): ts.Node => {
  if (ts.isJsxElement(node)) {
    return transformJsxElement(node);
  }
  if (ts.isJsxSelfClosingElement(node)) {
    return transformJsxSelfClosingElement(node);
  }
  if (ts.isJsxFragment(node)) {
    return transformJsxFragment(node);
  }
  return node;
};
