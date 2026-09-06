/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';

// Transformer to process class decorators: @component, @template, @style
// - Removes these decorators from class declarations
// - Emits runtime-equivalent registration calls after the class:
//     component(args?)(ClassName);
//     template(args)(ClassName);
//     style(args)(ClassName);
// This mirrors the existing runtime decorator behavior without relying on regex.

export function componentTemplateStyleTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const factory = context.factory;

    return (sourceFile: ts.SourceFile) => {
      const newStatements: ts.Statement[] = [];

      const visitStatements = (statements: readonly ts.Statement[]): void => {
        for (const stmt of statements) {
          if (ts.isClassDeclaration(stmt) && stmt.name) {
            const result = transformClass(stmt, sourceFile, factory);
            if (Array.isArray(result)) {
              newStatements.push(...result);
            } else if (result) {
              newStatements.push(result);
            }
          } else {
            newStatements.push(stmt);
          }
        }
      };

      visitStatements(sourceFile.statements);

      return factory.updateSourceFile(sourceFile, newStatements);
    };
  };
}

function transformClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  factory: ts.NodeFactory
): ts.Statement[] | ts.Statement | undefined {
  const className = node.name?.getText(sourceFile);
  if (!className) return node;

  const modifiers = node.modifiers ? [...node.modifiers] : [];
  if (modifiers.length === 0) return node;

  // Split decorators of interest and others
  const decorators: ts.Decorator[] = [];
  const otherModifiers: ts.ModifierLike[] = [];

  for (const m of modifiers) {
    if (ts.isDecorator(m)) {
      decorators.push(m);
    } else {
      otherModifiers.push(m);
    }
  }

  const handled: ts.Decorator[] = [];
  const registrations: ts.ExpressionStatement[] = [];

  for (const dec of decorators) {
    // Only handle call expression decorators
    if (!ts.isCallExpression(dec.expression)) continue;
    const expr = dec.expression.expression;
    const name = ts.isIdentifier(expr) ? expr.text : undefined;
    if (!name) continue;
    if (name !== 'component' && name !== 'template' && name !== 'style') continue;

    handled.push(dec);

    // Build: name(...args)(ClassName);
    const args = dec.expression.arguments ? [...dec.expression.arguments] : [];
    const outerCall = factory.createCallExpression(
      factory.createIdentifier(name),
      /*typeArgs*/ undefined,
      args
    );
    const innerCall = factory.createCallExpression(
      outerCall,
      /*typeArgs*/ undefined,
      [factory.createIdentifier(className)]
    );
    registrations.push(factory.createExpressionStatement(innerCall));
  }

  if (handled.length === 0) {
    // Nothing to do
    return node;
  }

  // Reconstruct modifiers without handled decorators
  const remainingDecorators = decorators.filter(d => !handled.includes(d));
  const newModifiers: ts.ModifierLike[] = [];
  if (remainingDecorators.length > 0) {
    for (const d of remainingDecorators) newModifiers.push(d);
  }
  for (const m of otherModifiers) newModifiers.push(m);

  const updatedClass = factory.updateClassDeclaration(
    node,
    newModifiers.length > 0 ? newModifiers : undefined,
    node.name,
    node.typeParameters,
    node.heritageClauses,
    node.members
  );

  // Return the class followed by the registration calls
  return [updatedClass, ...registrations];
}
