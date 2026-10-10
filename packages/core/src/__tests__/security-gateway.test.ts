/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setSecurityGateway,
  getSecurityGateway,
  evaluateCapability,
  audit,
  auditPlugin,
  type SecurityGateway,
  type ValidationResult,
} from '../security/gateway.js'

describe('Security Gateway adapter (core/security/gateway.ts)', () => {
  beforeEach(() => {
    // reset between tests
    setSecurityGateway(null as unknown as SecurityGateway)
  })

  it('defaults to permissive behavior when no gateway is set', () => {
    expect(getSecurityGateway()).toBeNull()

    // evaluateCapability defaults to true
    expect(evaluateCapability('cap:any', { layer: 'component' })).toBe(true)

    // audit should not throw when no gateway is set
    expect(() => audit({ action: 'noop' })).not.toThrow()

    // auditPlugin returns ok:true by default
    const res: ValidationResult = auditPlugin({ name: 'test' })
    expect(res.ok).toBe(true)
  })

  it('delegates to a configured gateway', () => {
    const evaluate = vi.fn().mockReturnValue(false)
    const auditFn = vi.fn()
    const auditPluginFn = vi.fn().mockReturnValue({ ok: false, reasons: ['x'] } satisfies ValidationResult)

    const gw: SecurityGateway = {
      evaluate,
      audit: auditFn,
      auditPlugin: auditPluginFn,
    }

    setSecurityGateway(gw)
    expect(getSecurityGateway()).toBe(gw)

    // evaluateCapability should delegate
    const ok = evaluateCapability('cap:x', { layer: 'plugin', pluginName: 'p' })
    expect(ok).toBe(false)
    expect(evaluate).toHaveBeenCalledWith('cap:x', { layer: 'plugin', pluginName: 'p' })

    // audit should delegate
    audit({ action: 'test', success: true })
    expect(auditFn).toHaveBeenCalledWith({ action: 'test', success: true })

    // auditPlugin should delegate and return gateway response
    const res = auditPlugin({ name: 'alpha', requiredCapabilities: ['cap:x'] })
    expect(res.ok).toBe(false)
    expect(res.reasons).toEqual(['x'])
    expect(auditPluginFn).toHaveBeenCalledWith({ name: 'alpha', requiredCapabilities: ['cap:x'] })
  })
})
