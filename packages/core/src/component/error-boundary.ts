/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { type SwissErrorInfo, type ErrorBoundaryProps, type ErrorBoundaryState, type BaseComponentProps, type BaseComponentState } from './types/index.js';
import { type VNode } from '../vdom/vdom.js';
import { SwissComponent } from './component.js';


export const ErrorBoundaryContext = Symbol('ErrorBoundaryContext');

export class ErrorBoundary extends SwissComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  static isErrorBoundary = true;
  state: ErrorBoundaryState = { error: null };
  constructor(props: ErrorBoundaryProps) {
    super(props, { errorBoundary: true });
  }
  captureChildError(child: SwissComponent, errorInfo: SwissErrorInfo): boolean {
    this.setState(() => ({ error: errorInfo.error }));
    return true;
  }
  resetErrorBoundary(): void {
    this.setState(() => ({ error: null }));
    super.resetErrorBoundary();
  }
  render(): VNode {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.resetErrorBoundary());
    }
    return this.renderWithBoundary(this.props.children);
  }
}

export function withErrorBoundary<P extends BaseComponentProps = BaseComponentProps, S extends BaseComponentState = BaseComponentState>(
  WrappedComponent: typeof SwissComponent<P, S>,
  fallback: (error: unknown, reset: () => void) => VNode
): typeof SwissComponent<P, S> {
  return class extends WrappedComponent {
    render() {
      const rendered = super.render();
      return new ErrorBoundary({
        fallback,
        children: rendered ? [rendered] : []
      }).render();
    }
  } as unknown as typeof SwissComponent<P, S>;
}

export function useErrorBoundary<P extends BaseComponentProps = BaseComponentProps, S extends BaseComponentState = BaseComponentState>(
  fallback: (error: unknown, reset: () => void) => VNode
) {
  return function(Component: typeof SwissComponent<P, S>) {
    return withErrorBoundary<P, S>(Component, fallback);
  };
}
 