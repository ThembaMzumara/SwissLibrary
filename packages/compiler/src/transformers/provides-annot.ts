/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';
import { resolveIdentifierValue } from './utils.js';

export function providesTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const visitor = (node: ts.Node): ts.Node => {
      const sourceFile = node.getSourceFile();
      if (ts.isClassDeclaration(node)) {
        const allModifiers = node.modifiers ? [...node.modifiers] : [];
        
        const providesDecorator = allModifiers.find(
          (modifier) => ts.isDecorator(modifier) && ts.isCallExpression(modifier.expression) && modifier.expression.expression.getText() === 'provides'
        ) as ts.Decorator | undefined;

        if (providesDecorator) {
            const newMembers = [...node.members];
            const decoratorArgs = (providesDecorator.expression as ts.CallExpression).arguments;
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
                        throw new Error(`[SwissJS Compiler] Could not resolve identifier '${arg.text}' for @provides decorator.`);
                    }
                    return null;
                }).filter((c): c is string => c !== null);

                const staticProperty = ts.factory.createPropertyDeclaration(
                    [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
                    'provides',
                    undefined,
                    undefined,
                    ts.factory.createArrayLiteralExpression(
                        capabilities.map(c => ts.factory.createStringLiteral(c)),
                        true
                    )
                );
                newMembers.push(staticProperty);
            }
            
            const remainingModifiers = allModifiers.filter(m => m !== providesDecorator);

            return ts.factory.updateClassDeclaration(
                node,
                remainingModifiers,
                node.name,
                node.typeParameters,
                node.heritageClauses,
                newMembers
            );
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };
        return (sourceFile: ts.SourceFile) => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
}
