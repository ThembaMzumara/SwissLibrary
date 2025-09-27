<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

# CapabilityManager Usage Audit

## Overview
The CapabilityManager is a static class that manages capability registration and checking in the SwissJS framework. It provides a simple but effective system for capability-based security.

## Current Implementation

### Core Methods
1. `registerGlobal(capabilities: string[])` - Registers capabilities globally
2. `registerForComponent(component: typeof SwissComponent, capabilities: string[])` - Registers capabilities for specific component types
3. `has(capability: string, component?: SwissComponent): boolean` - Checks if a capability exists (globally or for a specific component)
4. `hasAll(capabilities: string[], component?: SwissComponent): boolean` - Checks if all capabilities exist

### Usage Points

#### 1. Security Index (`packages/core/src/security/index.ts`)
- `checkCapabilities(component: SwissComponent, required: string[]): boolean` - Wrapper for `CapabilityManager.hasAll()`
- `validateDirectiveCapability(component: SwissComponent, directive: string): boolean` - Checks directive-specific capabilities

#### 2. Component Decorators (`packages/core/src/component/decorators.ts`)
- `requires(capabilities: string | string[], options: CapabilityOptions = {})` - Decorator for declaring required capabilities
- `provides(capabilities: string | string[], options: CapabilityOptions = {})` - Decorator for declaring provided capabilities
- `capability(capability: string, options: CapabilityOptions = {})` - Decorator for declaring a single capability
- `validateCapability(capability: string): boolean` - Validates capability format
- `applyDecoratorMetadata(component: SwissComponent)` - Applies capability requirements during component initialization

#### 3. Component Base Class (`packages/core/src/component/component.ts`)
- `SwissComponent.requires: string[]` - Static array for component requirements
- `SwissComponent.checkCapabilities(capabilities: CapabilitySet): boolean` - Instance method for checking capabilities (currently returns true for backward compatibility)
- Component constructor calls `applyDecoratorMetadata(this)` to apply decorator-based capabilities

#### 4. Event System (`packages/core/src/component/event-system.ts`)
- `EventOptions.capability?: string` - Optional capability for event emission
- `ListenerOptions.capability?: string` - Optional capability for event listeners
- Capability checks were previously implemented but have been commented out/removed:
  - `if (options.capability && target && true) { /* Removed CapabilityManager.resolve(options.capability) */ }`
  - `if (!options.capability || true) { /* Removed CapabilityManager.resolve(options.capability) */ }`

## Current Limitations

1. **No Runtime Registry** - Capabilities are only registered and checked, but there's no mapping to actual service functions
2. **No Resolution System** - No `resolve()` method to get executable functions for capabilities
3. **No Service Integration** - CapabilityManager is not integrated with the PluginManager service system
4. **Limited Scope** - Only supports global and component-specific capabilities, no plugin or dynamic capabilities
5. **No Advanced Features** - Missing validation, security features, caching, etc.

## Integration Points

1. **Plugin System** - Could integrate with PluginManager for service-based capabilities
2. **Component System** - Already integrated through decorators and component lifecycle
3. **Event System** - Previously had integration but was removed
4. **Security System** - Core integration point through security/index.ts

## Backward Compatibility Considerations

1. All existing methods must continue to work as before
2. The `has()` and `hasAll()` methods are used throughout the codebase and must maintain their current behavior
3. Component decorator system is already in use and must continue to function
4. Event system had capability integration that was removed, so we need to understand why and ensure our new implementation doesn't break anything
