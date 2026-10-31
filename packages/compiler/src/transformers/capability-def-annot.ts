/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import * as ts from 'typescript';
import { resolveIdentifierValue } from './utils.js';

export function capabilityDefTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const visitor = (node: ts.Node): ts.Node => {
      const sourceFile = node.getSourceFile();
      if (ts.isClassDeclaration(node)) {
        const allModifiers = node.modifiers ? [...node.modifiers] : [];
        
        const capabilityDecorator = allModifiers.find(
          (modifier) => ts.isDecorator(modifier) && ts.isCallExpression(modifier.expression) && modifier.expression.expression.getText() === 'capability'
        ) as ts.Decorator | undefined;

        if (capabilityDecorator) {
            const newMembers = [...node.members];
            const decoratorArgs = (capabilityDecorator.expression as ts.CallExpression).arguments;
            if (decoratorArgs.length > 0) {
                const capabilityNameExpr = decoratorArgs[0];
                let capabilityName: string | undefined;

                if (ts.isStringLiteral(capabilityNameExpr)) {
                    capabilityName = capabilityNameExpr.text;
                } else if (ts.isIdentifier(capabilityNameExpr)) {
                    capabilityName = resolveIdentifierValue(capabilityNameExpr, sourceFile);
                }

                if (!capabilityName) {
                    throw new Error(`[SwissJS Compiler] Could not resolve identifier for @capability decorator.`);
                }

                const staticProperty = ts.factory.createPropertyDeclaration(
                    [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
                    'capabilityName',
                    undefined,
                    undefined,
                    ts.factory.createStringLiteral(capabilityName)
                );
                newMembers.push(staticProperty);
            }
            
            const remainingModifiers = allModifiers.filter(m => m !== capabilityDecorator);

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
