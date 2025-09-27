<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# CapabilityManager Impact Analysis

## Overview
This document analyzes the impact of extending the CapabilityManager with runtime registry and resolution capabilities while maintaining backward compatibility.

## Current Usage Points

### 1. Security System (`packages/core/src/security/index.ts`)
- **Functions**: `checkCapabilities()`, `validateDirectiveCapability()`
- **Impact**: These are wrapper functions that directly call `CapabilityManager.has()` and `CapabilityManager.hasAll()`
- **Compatibility**: Low risk - these functions should continue to work unchanged

### 2. Component Decorators (`packages/core/src/component/decorators.ts`)
- **Decorators**: `@requires`, `@provides`, `@capability`
- **Functions**: `applyDecoratorMetadata()`, `validateCapability()`
- **Impact**: 
  - Decorators register metadata that is later used by `applyDecoratorMetadata()`
  - `applyDecoratorMetadata()` calls `CapabilityManager.hasAll()` to validate requirements
  - `@capability` decorator wraps methods with runtime capability checks
- **Compatibility**: Low risk - decorator system is well-established and should continue to work

### 3. Component Base Class (`packages/core/src/component/component.ts`)
- **Properties**: `requires` static array
- **Methods**: `checkCapabilities()` instance method, constructor calls `applyDecoratorMetadata()`
- **Impact**: 
  - Constructor calls `applyDecoratorMetadata()` which validates capabilities
  - `checkCapabilities()` currently returns `true` for backward compatibility
- **Compatibility**: Low risk - existing components should continue to work

### 4. Event System (`packages/core/src/component/event-system.ts`)
- **Classes**: `SwissEvent`, `SwissEventHub`
- **Methods**: Event emission and listener registration with capability options
- **Impact**: 
  - Capability checks were previously implemented but have been commented out
  - This suggests there were issues with the previous implementation
  - Event system represents an opportunity to reintroduce capability checking
- **Compatibility**: Low risk - capability checks are currently disabled, so adding them back should not break existing code

## Extension Impact Analysis

### Adding Runtime Registry
- **New Methods**: `registerService()`, `unregisterService()`, `resolve()`
- **New Properties**: Private registry map for capability-to-service mapping
- **Impact**: No impact on existing code as these are additive

### Adding Resolution System
- **New Method**: `resolve()` to get executable functions for capabilities
- **Impact**: 
  - Existing code uses `has()` and `hasAll()` for boolean checks
  - New `resolve()` method would be used for actual service execution
  - No conflict with existing methods

### Integration with Plugin System
- **Integration Point**: Connect CapabilityManager registry with PluginManager services
- **Impact**: 
  - PluginManager already has service registration capabilities
  - Integration should be additive and not break existing plugin functionality

## Backward Compatibility Considerations

### Maintaining Existing API
1. **`has()` method**: Must continue to work exactly as before
2. **`hasAll()` method**: Must continue to work exactly as before
3. **`registerGlobal()` method**: Must continue to work exactly as before
4. **`registerForComponent()` method**: Must continue to work exactly as before

### Component Decorator System
1. **`@requires` decorator**: Must continue to validate component requirements
2. **`@provides` decorator**: Must continue to register component capabilities
3. **`@capability` decorator**: Must continue to wrap methods with capability checks

### Event System
1. **Capability options**: Should be able to reintroduce capability checking without breaking existing event usage
2. **Global event hub**: Should be able to add capability checking to global events

## Risk Assessment

### Low Risk Changes
- Adding new methods and properties to CapabilityManager
- Integrating with PluginManager services
- Reintroducing capability checking in event system

### Medium Risk Changes
- Extending the `@capability` decorator with new features
- Modifying the behavior of `checkCapabilities()` in SwissComponent

### High Risk Changes
- Modifying the behavior of existing `has()` or `hasAll()` methods
- Changing the signature of existing public methods
- Removing or significantly altering existing functionality

## Implementation Strategy

### Phase 1: Core Extensions
1. Add private registry map for capability-to-service mapping
2. Implement `registerService()` and `unregisterService()` methods
3. Implement `resolve()` method for capability resolution
4. Ensure all existing methods continue to work unchanged

### Phase 2: Plugin Integration
1. Connect CapabilityManager registry with PluginManager services
2. Implement automatic capability registration from plugins
3. Add capability discovery mechanisms

### Phase 3: Event System Reintegration
1. Reintroduce capability checking in event emission
2. Reintroduce capability checking in event listeners
3. Add capability checking to global event hub

### Phase 4: Component System Enhancement
1. Extend `checkCapabilities()` method with actual implementation
2. Add caching for resolved capabilities
3. Add security features and validation
