/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';

// Transformer to process lifecycle and render-related decorators in one pass:
// - @onMount, @onUpdate, @onDestroy, @onError           (method)
// - @render                                             (method)
// - @bind                                              (property)
// - @computed                                          (getter)
// The transformer removes these decorators from class members and emits
// equivalent registration calls after the class declaration, e.g.:
//   onMount(opts?)(ClassName.prototype, 'method', Object.getOwnPropertyDescriptor(ClassName.prototype, 'method'))
//   render(opts?)(ClassName.prototype, 'method', Object.getOwnPropertyDescriptor(ClassName.prototype, 'method'))
//   bind('prop')(ClassName.prototype, 'field')
//   computed(opts?)(ClassName.prototype, 'getter', Object.getOwnPropertyDescriptor(ClassName.prototype, 'getter'))
//
// Diagnostics: throws errors with codes when decorators are placed on invalid elements.
//   LC1001: @render must decorate a method
//   LC1002: @computed must decorate a getter or accessor
//   LC1003: lifecycle decorators must decorate a method

export function lifecycleRenderTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const factory = context.factory;

    return (sourceFile: ts.SourceFile) => {
      const out: ts.Statement[] = [];

      const visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isClassDeclaration(node) && node.name) {
          return transformClass(node, sourceFile, factory, out);
        }
        return ts.visitEachChild(node, visit, context);
      };

      const transformed = ts.visitNode(sourceFile, visit);
      if (!transformed) return sourceFile;
      const transformedSf = transformed as ts.SourceFile;

      const newStatements = factory.createNodeArray([
        ...transformedSf.statements,
        ...out
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

  const newMembers: ts.ClassElement[] = [];

  for (const member of node.members) {
    // TS 5.9+: use helper APIs to access decorators/modifiers
    const memberDecorators: readonly ts.Decorator[] = ts.canHaveDecorators(member) ? (ts.getDecorators(member) ?? []) : [];
    const otherMemberModifiers: readonly ts.ModifierLike[] = ts.getModifiers(member as unknown as ts.HasModifiers) ?? [];
    if (memberDecorators.length === 0) {
      newMembers.push(member);
      continue;
    }

    const handled: ts.Decorator[] = [];

    for (const dec of memberDecorators) {
      if (!ts.isCallExpression(dec.expression)) continue;
      const expr = dec.expression.expression;
      const name = ts.isIdentifier(expr) ? expr.text : undefined;
      if (!name) continue;
      if (!isLifecycleOrRenderDecorator(name)) continue;

      // Validate placement and build registration call
      const args = dec.expression.arguments ? [...dec.expression.arguments] : [];
      if (isLifecycleDecorator(name)) {
        // must be a method
        if (!isMethodLike(member)) {
          throw new Error(`SwissJS Compiler [LC1003]: @${name} must decorate a method in ${className}`);
        }
        handled.push(dec);
        if (!member.name) continue;
        const prop = getMemberName(member.name, sourceFile);
        if (prop) out.push(makeMethodDecoratorCall(factory, name, args, className, prop));
      } else if (name === 'render') {
        if (!isMethodLike(member)) {
          throw new Error(`SwissJS Compiler [LC1001]: @render must decorate a method in ${className}`);
        }
        handled.push(dec);
        if (!member.name) continue;
        const prop = getMemberName(member.name, sourceFile);
        if (prop) out.push(makeMethodDecoratorCall(factory, 'render', args, className, prop));
      } else if (name === 'bind') {
        // can be used on property
        if (!ts.isPropertyDeclaration(member)) {
          // Allow also accessor, but primary is property
          if (!ts.isGetAccessorDeclaration(member) && !ts.isSetAccessorDeclaration(member)) {
            // Treat as property-like fallback
          }
        }
        handled.push(dec);
        if (!member.name) continue;
        const prop = getMemberName(member.name, sourceFile);
        if (prop) out.push(makePropertyDecoratorCall(factory, 'bind', args, className, prop));
      } else if (name === 'computed') {
        // must be a getter/accessor or method with descriptor
        const isGetter = ts.isGetAccessorDeclaration(member) || ts.isMethodDeclaration(member) || ts.isSetAccessorDeclaration(member);
        if (!isGetter) {
          throw new Error(`SwissJS Compiler [LC1002]: @computed must decorate a getter/method in ${className}`);
        }
        handled.push(dec);
        if (!member.name) continue;
        const prop = getMemberName(member.name, sourceFile);
        if (prop) out.push(makeMethodDecoratorCall(factory, 'computed', args, className, prop));
      }
    }

    // Rebuild member without handled decorators
    if (handled.length > 0) {
      const remaining = memberDecorators.filter(d => !handled.includes(d));
      const newMods: ts.ModifierLike[] = [...remaining, ...otherMemberModifiers];

      if (ts.isMethodDeclaration(member)) {
        newMembers.push(factory.updateMethodDeclaration(
          member,
          newMods.length > 0 ? newMods : undefined,
          member.asteriskToken,
          member.name,
          member.questionToken,
          member.typeParameters,
          member.parameters,
          member.type,
          member.body
        ));
      } else if (ts.isPropertyDeclaration(member)) {
        newMembers.push(factory.updatePropertyDeclaration(
          member,
          newMods.length > 0 ? newMods : undefined,
          member.name,
          member.questionToken,
          member.type,
          member.initializer
        ));
      } else if (ts.isGetAccessorDeclaration(member)) {
        newMembers.push(factory.updateGetAccessorDeclaration(
          member,
          newMods.length > 0 ? newMods : undefined,
          member.name,
          member.parameters,
          member.type,
          member.body
        ));
      } else if (ts.isSetAccessorDeclaration(member)) {
        newMembers.push(factory.updateSetAccessorDeclaration(
          member,
          newMods.length > 0 ? newMods : undefined,
          member.name,
          member.parameters,
          member.body
        ));
      } else {
        newMembers.push(member);
      }
    } else {
      newMembers.push(member);
    }
  }

  return factory.updateClassDeclaration(
    node,
    node.modifiers,
    node.name,
    node.typeParameters,
    node.heritageClauses,
    newMembers
  );
}

function isLifecycleOrRenderDecorator(name: string): boolean {
  return isLifecycleDecorator(name) || name === 'render' || name === 'bind' || name === 'computed';
}

function isLifecycleDecorator(name: string): boolean {
  return name === 'onMount' || name === 'onUpdate' || name === 'onDestroy' || name === 'onError';
}

function isMethodLike(member: ts.ClassElement): member is ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration {
  return ts.isMethodDeclaration(member) || ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member);
}

function getMemberName(name: ts.PropertyName | ts.BindingName | ts.PropertyName, sourceFile: ts.SourceFile): string | null {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name)) return name.expression.getText(sourceFile);
  return null;
}

function makeMethodDecoratorCall(
  factory: ts.NodeFactory,
  decoratorName: string,
  args: readonly ts.Expression[],
  className: string,
  methodName: string
): ts.Statement {
  const outer = factory.createCallExpression(
    factory.createIdentifier(decoratorName),
    undefined,
    [...args]
  );
  const inner = factory.createCallExpression(
    outer,
    undefined,
    [
      factory.createPropertyAccessExpression(factory.createIdentifier(className), 'prototype'),
      factory.createStringLiteral(methodName),
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier('Object'),
          'getOwnPropertyDescriptor'
        ),
        undefined,
        [
          factory.createPropertyAccessExpression(factory.createIdentifier(className), 'prototype'),
          factory.createStringLiteral(methodName)
        ]
      )
    ]
  );
  return factory.createExpressionStatement(inner);
}

function makePropertyDecoratorCall(
  factory: ts.NodeFactory,
  decoratorName: string,
  args: readonly ts.Expression[],
  className: string,
  propName: string
): ts.Statement {
  const outer = factory.createCallExpression(
    factory.createIdentifier(decoratorName),
    undefined,
    [...args]
  );
  const inner = factory.createCallExpression(
    outer,
    undefined,
    [
      factory.createPropertyAccessExpression(factory.createIdentifier(className), 'prototype'),
      factory.createStringLiteral(propName)
    ]
  );
  return factory.createExpressionStatement(inner);
}
