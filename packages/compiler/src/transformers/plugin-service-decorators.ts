/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';

// Transformer to process @plugin (class) and @service (property) decorators.
// - Removes these decorators from class declarations/members
// - Emits runtime-equivalent registration calls after the class:
//     plugin(name, options?)(ClassName);
//     service(name, options?)(ClassName.prototype, 'prop');

export function pluginServiceTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const factory = context.factory;

    return (sourceFile: ts.SourceFile) => {
      const output: ts.Statement[] = [];

      const visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isClassDeclaration(node) && node.name) {
          return transformClass(node, sourceFile, factory, output);
        }
        return ts.visitEachChild(node, visit, context);
      };

      const transformed = ts.visitNode(sourceFile, visit);
      if (!transformed) return sourceFile;
      const transformedSf = transformed as ts.SourceFile;

      // Append generated registration statements at the end of the source file
      const newStatements = factory.createNodeArray([
        ...transformedSf.statements,
        ...output
      ]);
      return factory.updateSourceFile(transformedSf, newStatements);
    };
  };
}

function transformClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  factory: ts.NodeFactory,
  out: ts.Statement[]
): ts.ClassDeclaration {
  const className = node.name!.getText(sourceFile);

  const classDecorators: ts.Decorator[] = [];
  const otherClassModifiers: ts.ModifierLike[] = [];
  if (node.modifiers) {
    for (const m of node.modifiers) {
      if (ts.isDecorator(m)) classDecorators.push(m); else otherClassModifiers.push(m);
    }
  }

  const handledClassDecorators: ts.Decorator[] = [];

  // Handle @plugin on class
  for (const dec of classDecorators) {
    if (!ts.isCallExpression(dec.expression)) continue;
    const expr = dec.expression.expression;
    const name = ts.isIdentifier(expr) ? expr.text : undefined;
    if (name !== 'plugin') continue;
    handledClassDecorators.push(dec);

    const args = dec.expression.arguments ? [...dec.expression.arguments] : [];
    const outerCall = factory.createCallExpression(
      factory.createIdentifier('plugin'),
      undefined,
      args
    );
    const innerCall = factory.createCallExpression(
      outerCall,
      undefined,
      [factory.createIdentifier(className)]
    );
    out.push(factory.createExpressionStatement(innerCall));
  }

  // Visit members to handle @service on properties
  const newMembers: ts.ClassElement[] = [];
  for (const member of node.members) {
    if (ts.isPropertyDeclaration(member) && member.name && member.modifiers?.some(ts.isDecorator)) {
      const memberDecorators: ts.Decorator[] = [];
      const otherMemberModifiers: ts.ModifierLike[] = [];
      for (const m of member.modifiers || []) {
        if (ts.isDecorator(m)) memberDecorators.push(m); else otherMemberModifiers.push(m);
      }
      const handledMemberDecorators: ts.Decorator[] = [];
      for (const dec of memberDecorators) {
        if (!ts.isCallExpression(dec.expression)) continue;
        const expr = dec.expression.expression;
        const dname = ts.isIdentifier(expr) ? expr.text : undefined;
        if (dname !== 'service') continue;
        handledMemberDecorators.push(dec);

        const args = dec.expression.arguments ? [...dec.expression.arguments] : [];
        const outerCall = factory.createCallExpression(
          factory.createIdentifier('service'),
          undefined,
          args
        );
        const propName = getPropertyNameText(member.name, sourceFile);
        if (propName) {
          const innerCall = factory.createCallExpression(
            outerCall,
            undefined,
            [
              factory.createPropertyAccessExpression(
                factory.createIdentifier(className),
                'prototype'
              ),
              factory.createStringLiteral(propName)
            ]
          );
          out.push(factory.createExpressionStatement(innerCall));
        }
      }
      // Reconstruct member without handled decorators
      const remaining = memberDecorators.filter(d => !handledMemberDecorators.includes(d));
      const newMods: ts.ModifierLike[] = [];
      if (remaining.length > 0) for (const d of remaining) newMods.push(d);
      for (const m of otherMemberModifiers) newMods.push(m);
      newMembers.push(factory.updatePropertyDeclaration(
        member,
        newMods.length > 0 ? newMods : undefined,
        member.name,
        member.questionToken,
        member.type,
        member.initializer
      ));
    } else {
      newMembers.push(member);
    }
  }

  // Rebuild class without handled class decorators
  const remainingClassDecorators = classDecorators.filter(d => !handledClassDecorators.includes(d));
  const newClassModifiers: ts.ModifierLike[] = [];
  if (remainingClassDecorators.length > 0) for (const d of remainingClassDecorators) newClassModifiers.push(d);
  for (const m of otherClassModifiers) newClassModifiers.push(m);

  return factory.updateClassDeclaration(
    node,
    newClassModifiers.length > 0 ? newClassModifiers : undefined,
    node.name,
    node.typeParameters,
    node.heritageClauses,
    newMembers
  );
}

function getPropertyNameText(name: ts.PropertyName, sourceFile: ts.SourceFile): string | null {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name)) {
    const text = name.expression.getText(sourceFile);
    return text;
  }
  return null;
}
