<!--
Copyright (c) 2024 Themba Mzumara
This file is part of SwissJS Framework. All rights reserved.
Licensed under the MIT License. See LICENSE in the project root for license information.
-->

---
title: Security API
---

# Security API

## Capabilities

### Built-in Capabilities

```typescript
const CAPABILITIES = {
  // Data access
  ACCESS_USER_DATA: 'access:user-data',
  ACCESS_SESSION_DATA: 'access:session-data',
  
  // DOM manipulation
  MODIFY_DOM: 'modify:dom',
  MODIFY_STYLES: 'modify:styles',
  
  // Network and storage
  NETWORK_REQUESTS: 'make:network-requests',
  LOCAL_STORAGE: 'access:local-storage',
  SESSION_STORAGE: 'access:session-storage',
  COOKIES: 'access:cookies',
  
  // System access
  FILE_SYSTEM: 'access:file-system',
  CAMERA: 'access:camera',
  MICROPHONE: 'access:microphone',
  GEOLOCATION: 'access:geolocation',
  
  // Framework features
  DIRECTIVE: 'directive:*',
  PLUGIN: 'plugin:*',
  ROUTE: 'route:*'
} as const
```

### Capability Type

```typescript
type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES]
```

## Capability Manager

### CapabilityManager Class

```typescript
class CapabilityManager {
  static has(capability: string, component?: SwissComponent): boolean
  static hasAll(capabilities: string[], component?: SwissComponent): boolean
  static grant(capability: string, component?: SwissComponent): void
  static revoke(capability: string, component?: SwissComponent): void
  static check(capability: string, context?: SecurityContext): boolean
}
```

### Capability Checking

```typescript
function checkCapabilities(component: SwissComponent, required: string[]): boolean
```

**Example:**
```typescript
@requires([CAPABILITIES.ACCESS_USER_DATA])
class UserProfile extends SwissComponent {
  userData = null
  
  @onMount()
  loadUserData() {
    // This will only execute if component has required capabilities
    this.userData = fetchUserData()
  }
}
```

### Directive Capability Validation

```typescript
function validateDirectiveCapability(
  component: SwissComponent,
  directive: string
): boolean
```

**Example:**
```typescript
// Automatic capability checking for directives
@component({ selector: 'app-secure' })
class SecureComponent extends SwissComponent {
  @onClick('submit-button') // Requires MODIFY_DOM capability
  handleSubmit() {
    // This directive will only work if component has MODIFY_DOM capability
  }
}
```

## Security Gateway

### SecurityGateway Interface

```typescript
interface SecurityGateway {
  // Capability evaluation
  evaluate(target: string, context: SecurityContext): boolean
  
  // Auditing
  audit(entry: CapabilityAuditLog): void
  
  // Rate limiting
  checkRateLimit(target: string, context: SecurityContext): boolean
  
  // Plugin validation
  validatePlugin(plugin: Plugin): ValidationResult
}
```

### Security Context

```typescript
interface SecurityContext {
  component?: SwissComponent
  user?: string
  session?: string
  permissions?: Set<string>
  metadata?: Record<string, unknown>
}
```

### Gateway Functions

```typescript
function setSecurityGateway(gw: SecurityGateway): void
function getSecurityGateway(): SecurityGateway | null
function evaluateCapability(target: string, ctx: SecurityContext): boolean
```

**Example:**
```typescript
// Custom security gateway
const customGateway: SecurityGateway = {
  evaluate(target: string, context: SecurityContext): boolean {
    // Custom evaluation logic
    return context.permissions?.has(target) ?? false
  },
  
  audit(entry: CapabilityAuditLog): void {
    console.log('Security audit:', entry)
  },
  
  checkRateLimit(target: string, context: SecurityContext): boolean {
    // Rate limiting logic
    return true
  },
  
  validatePlugin(plugin: Plugin): ValidationResult {
    return { valid: true, errors: [] }
  }
}

setSecurityGateway(customGateway)
```

## Auditing

### Audit Functions

```typescript
function audit(entry: Omit<CapabilityAuditLog, 'timestamp' | 'id'>): void
function auditPlugin(plugin: { name: string; version?: string; requiredCapabilities?: string[] }): ValidationResult
```

### Audit Log

```typescript
interface CapabilityAuditLog {
  id: string
  timestamp: number
  target: string
  capability: string
  granted: boolean
  context: SecurityContext
  error?: string
}
```

**Example:**
```typescript
// Manual audit entry
audit({
  target: 'user-profile',
  capability: CAPABILITIES.ACCESS_USER_DATA,
  granted: true,
  context: { user: 'user123', permissions: new Set([CAPABILITIES.ACCESS_USER_DATA]) }
})

// Plugin audit
const result = auditPlugin({
  name: 'analytics-plugin',
  version: '1.0.0',
  requiredCapabilities: [CAPABILITIES.NETWORK_REQUESTS]
})

if (!result.valid) {
  console.error('Plugin validation failed:', result.errors)
}
```

## Validation Results

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
  metadata?: Record<string, unknown>
}
```

## Capability Registration

### Directive Capabilities

```typescript
function registerDirectiveCapability(directive: string, capability: string): void
function getDirectiveCapability(directive: string): string | undefined
```

**Example:**
```typescript
// Register capability for custom directive
registerDirectiveCapability('track-analytics', CAPABILITIES.NETWORK_REQUESTS)

// Check directive capability
const requiredCap = getDirectiveCapability('track-analytics')
console.log(requiredCap) // 'make:network-requests'
```

## Types

### Capability Types

```typescript
type CapabilityService = (...args: unknown[]) => unknown
type AsyncCapabilityService<T> = (...args: unknown[]) => Promise<T>

interface CapabilityContext {
  target: string
  capability: string
  context: SecurityContext
  granted: boolean
}

interface CapabilityAuditLog {
  id: string
  timestamp: number
  target: string
  capability: string
  granted: boolean
  context: SecurityContext
  error?: string
  duration?: number
}

interface RateLimitEntry {
  target: string
  count: number
  lastAccess: number
  windowMs: number
}

type CapabilityScope = 'global' | 'component' | 'plugin'
```

## Security Best Practices

### Component Security

```typescript
@component({
  selector: 'secure-component',
  capabilities: [CAPABILITIES.ACCESS_USER_DATA] // Component provides
})
@requires([CAPABILITIES.MODIFY_DOM]) // Component requires
class SecureComponent extends SwissComponent {
  userData = null
  
  @capability(CAPABILITIES.ACCESS_USER_DATA)
  async loadUserData() {
    // Explicit capability check
    if (checkCapabilities(this, [CAPABILITIES.ACCESS_USER_DATA])) {
      this.userData = await fetchUserData()
    }
  }
  
  @onClick('save-button')
  saveData() {
    // This directive requires MODIFY_DOM capability
    this.saveUserData()
  }
}
```

### Plugin Security

```typescript
const securePlugin: Plugin = {
  name: 'secure-plugin',
  version: '1.0.0',
  capabilities: [CAPABILITIES.NETWORK_REQUESTS],
  requiredCapabilities: [CAPABILITIES.MODIFY_DOM],
  
  async install(context: PluginContext) {
    // Verify required capabilities
    if (!checkCapabilities(context.component, this.requiredCapabilities)) {
      throw new Error('Required capabilities not available')
    }
    
    // Audit plugin installation
    auditPlugin(this)
  }
}
```

### Runtime Security

```typescript
// Custom security evaluation
function customSecurityCheck(target: string, context: SecurityContext): boolean {
  // Check user permissions
  if (!context.permissions?.has(target)) {
    return false
  }
  
  // Check rate limits
  if (!checkRateLimit(target, context)) {
    return false
  }
  
  // Audit the access attempt
  audit({
    target,
    capability: target,
    granted: true,
    context
  })
  
  return true
}
```
