/*
 * Copyright (c) 2024 SwissJS Framework
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/*
 * Copyright (c) 2024 SwissJS Framework
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';
import { factory } from 'typescript';

export function createJsxFactory(
  tagName: string, 
  attributes: ts.Expression, 
  children: ts.Expression[]
): ts.CallExpression {
  // Handle fragment shorthand
  if (tagName === 'Fragment') {
    return createJsxFragmentFactory(children);
  }
  // Create the arguments array for createElement
  const args: ts.Expression[] = [
    // First arg: tag name (identifier or string literal)
    tagName.startsWith(tagName[0].toUpperCase())
      ? factory.createIdentifier(tagName)
      : factory.createStringLiteral(tagName),
    
    // Second arg: attributes object
    attributes,
    
    // Third arg (optional): children array
    ...(children.length > 0 ? [
      factory.createArrayLiteralExpression(
        children.filter(Boolean) as ts.Expression[],
        true
      )
    ] : [])
  ];

  // Create the createElement call
  return factory.createCallExpression(
    factory.createIdentifier('createElement'),
    undefined,
    args
  );
}

export function createJsxFragmentFactory(
  children: ts.Expression[]
): ts.CallExpression {
  return factory.createCallExpression(
    factory.createIdentifier('Fragment'),
    undefined,
    children.length > 0 
      ? [
          factory.createArrayLiteralExpression(
            children.filter(Boolean) as ts.Expression[],
            true
          )
        ]
      : []
  );
}

// Helper function to create property access for nested components
export function createMemberAccess(
  expression: string,
  name: string | ts.Identifier
): ts.PropertyAccessExpression {
  const parts = expression.split('.');
  let current: ts.Expression = factory.createIdentifier(parts[0]);
  
  for (let i = 1; i < parts.length; i++) {
    current = factory.createPropertyAccessExpression(
      current,
      factory.createIdentifier(parts[i])
    );
  }
  
  return factory.createPropertyAccessExpression(
    current,
    typeof name === 'string' ? factory.createIdentifier(name) : name
  );
}
