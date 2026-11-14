/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

export * from './component.js';
export * from './lifecycle.js';
export * from './error-boundary.js';
export * from './context.js';
export * from './portals.js';
export * from './ssr.js';
export * from './types.js';
export * from './event-system.js';
export * from './ComponentRegistry.js';
export * from './base-component.js';

// Export all decorators but rename computed to avoid conflict
export { 
  component,
  template,
  style,
  requires,
  provides,
  capability,
  render,
  bind,
  plugin,
  service,
  getComponentMetadata,
  getTemplateMetadata,
  getStyleMetadata,
  getCapabilityMetadata,
  getLifecycleMetadata,
  getRenderMetadata,
  getBindingMetadata,
  getPluginMetadata,
  getEventHandlerMetadata,
  applyDecoratorMetadata,
  collectComponentMetadata,
  validateComponent,
  computed as computedProperty
} from './decorators.js';

// Export lifecycle decorators
export { 
  onMount,
  onUpdate,
  onDestroy,
  onError
} from './decorators.js';

// Export event decorators
export { 
  onClick,
  onChange,
  onInput,
  onSubmit,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  onMouseOver,
  onMouseOut,
  onMouseEnter,
  onMouseLeave
} from './decorators.js';
