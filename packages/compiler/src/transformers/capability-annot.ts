/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';
import { resolveIdentifierValue } from './utils.js';
import { compilerError } from './diagnostics.js';

export function capabilityTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
        const visitor = (node: ts.Node): ts.Node => {
      const sourceFile = node.getSourceFile();
      if (ts.isClassDeclaration(node)) {
        const allModifiers = node.modifiers ? [...node.modifiers] : [];
        
        const decorators = allModifiers.filter(ts.isDecorator);
        const otherModifiers = allModifiers.filter((m): m is ts.Modifier => !ts.isDecorator(m));

        const requiresDecorator = decorators.find(d => 
            ts.isCallExpression(d.expression) &&
            ts.isIdentifier(d.expression.expression) &&
            d.expression.expression.text === 'requires'
        );

        if (requiresDecorator) {
            const newMembers = [...node.members];
            const decoratorArgs = (requiresDecorator.expression as ts.CallExpression).arguments;
                        if (decoratorArgs.length > 0) {
                const capabilities = decoratorArgs.map((arg: ts.Expression) => {
                    if (ts.isStringLiteral(arg)) {
                        return arg.text;
                    }
                    if (ts.isIdentifier(arg)) {
                        const resolved = resolveIdentifierValue(arg, sourceFile);
                        if (resolved) {
                            return resolved;
                        }
                        throw compilerError('E1001', `Could not resolve identifier '${arg.text}' for @requires decorator.`, sourceFile, arg);
                    }
                    return null;
                }).filter((c): c is string => c !== null);

                if (capabilities.length !== decoratorArgs.length) {
                    // If any capability was not resolved, we might have a problem.
                    // For now, we'll proceed, but a stricter check might be needed.
                }
                
                const staticProperty = ts.factory.createPropertyDeclaration(
                    [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
                    'requires',
                    undefined,
                    undefined,
                    ts.factory.createArrayLiteralExpression(
                        capabilities.map((cap: string) => ts.factory.createStringLiteral(cap))
                    )
                );
                newMembers.push(staticProperty);

                const remainingDecorators = decorators.filter(d => d !== requiresDecorator);
                
                return ts.factory.updateClassDeclaration(
                    node,
                    [...remainingDecorators, ...otherModifiers],
                    node.name,
                    node.typeParameters,
                    node.heritageClauses,
                    newMembers
                );
            }
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };

    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor) as ts.SourceFile;
  };
}