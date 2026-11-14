/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Mock } from 'vitest'
import { PluginManager } from '../plugins/pluginManager.js'
import { CapabilityManager } from '../security/capability-manager.js'
import { setSecurityGateway, type SecurityGateway } from '../security/gateway.js'
import type { Plugin, PluginContext } from '../plugins/pluginInterface.js'

function makeTestPlugin(name: string, services: Record<string, unknown> = {}, requiredCapabilities: string[] = []): Plugin {
  const initSpy = vi.fn()
  const loadSpy = vi.fn()
  const unloadSpy = vi.fn()
  const regSvcSpy = vi.fn()

  const plugin: Plugin = {
    name,
    version: '0.0.1-test',
    requiredCapabilities,
    providesService: (svc: string) => Object.prototype.hasOwnProperty.call(services, svc),
    getService: (svc: string) => services[svc],
    init: (ctx: PluginContext) => { initSpy(ctx) },
    onLoad: (ctx: PluginContext) => { loadSpy(ctx) },
    onUnload: (ctx: PluginContext) => { unloadSpy(ctx) },
    onRegisterServices: (ctx: PluginContext) => { regSvcSpy(ctx) },
  }

  // attach spies for assertions
  type Spies = { initSpy: Mock; loadSpy: Mock; unloadSpy: Mock; regSvcSpy: Mock }
  type SpyCarrier = { __spies: Spies }
  ;(plugin as unknown as SpyCarrier).__spies = { initSpy, loadSpy, unloadSpy, regSvcSpy }
  return plugin
}

describe('PluginManager (registry, lifecycle, services)', () => {
  let pm: PluginManager

  beforeEach(() => {
    pm = new PluginManager()
  })

  it('registers a plugin and triggers lifecycle hooks', () => {
    const p = makeTestPlugin('alpha')
    pm.registerPlugin(p)

    type Spies = { initSpy: Mock; loadSpy: Mock; unloadSpy: Mock; regSvcSpy: Mock }
    type SpyCarrier = { __spies: Spies }
    const spies = (p as unknown as SpyCarrier).__spies
    expect(spies.initSpy).toHaveBeenCalledTimes(1)
    expect(spies.loadSpy).toHaveBeenCalledTimes(1)
    expect(spies.regSvcSpy).toHaveBeenCalledTimes(1)

    // after register, plugin should be listed
    expect(pm.listPlugins()).toContain('alpha')
  })

  it('prevents duplicate plugin names', () => {
    const p1 = makeTestPlugin('dup')
    const p2 = makeTestPlugin('dup')
    pm.registerPlugin(p1)
    expect(() => pm.registerPlugin(p2)).toThrowError(/already registered/)
  })

  it('enforces required capabilities', () => {
    const p = makeTestPlugin('needs-cap', {}, ['cap:x'])
    // no capability granted yet => should throw
    expect(() => pm.registerPlugin(p)).toThrowError(/requires missing capability/i)

    pm.grantCapability('cap:x')
    expect(() => pm.registerPlugin(p)).not.toThrow()
  })

  it('registers and resolves services from plugins', () => {
    const svc = { hello: () => 'world' }
    const p = makeTestPlugin('svc-plugin', { 'helloService': svc })
    pm.registerPlugin(p)

    // instance method resolution
    const resolved = pm.getService<typeof svc>('helloService')
    expect(resolved).toBe(svc)

    // static/global resolution
    // ensure global has our plugin as well
    PluginManager.globalRegistry().register(p)
    const resolvedStatic = PluginManager.getService('helloService') as typeof svc | null
    expect(resolvedStatic).toBe(svc)

    // hasService should reflect availability
    expect(pm.hasService('helloService')).toBe(true)
    expect(pm.hasService('missingService')).toBe(false)
  })

  it('unregisters plugin and triggers unload', () => {
    const p = makeTestPlugin('to-remove')
    pm.registerPlugin(p)

    pm.unregisterPlugin('to-remove')

    type Spies = { initSpy: Mock; loadSpy: Mock; unloadSpy: Mock }
    type SpyCarrier = { __spies: Spies }
    const spies = (p as unknown as SpyCarrier).__spies
    expect(spies.unloadSpy).toHaveBeenCalledTimes(1)
    expect(pm.listPlugins()).not.toContain('to-remove')
  })

  it('fails registration when security gateway audit fails', () => {
    const p = makeTestPlugin('insecure')

    const gw: SecurityGateway = {
      evaluate: vi.fn().mockReturnValue(true),
      audit: vi.fn(),
      auditPlugin: vi.fn().mockReturnValue({ ok: false, reasons: ['blocked'] }),
    }
    setSecurityGateway(gw)

    expect(() => pm.registerPlugin(p)).toThrowError(/Security audit failed/)
  })

  it('emits duplicate service warning and keeps the first registration', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const svcA = { route: () => 'A' }
    const svcB = { route: () => 'B' }
    const p1 = makeTestPlugin('svc-a', { router: svcA })
    const p2 = makeTestPlugin('svc-b', { router: svcB })
    // Configure gateway to allow plugins
    const gw: SecurityGateway = {
      evaluate: vi.fn().mockReturnValue(true),
      audit: vi.fn(),
      auditPlugin: vi.fn().mockReturnValue({ ok: true, reasons: [] }),
    }
    setSecurityGateway(gw)
    const capSpy = vi.spyOn(CapabilityManager, 'autoRegisterPluginCapabilities').mockImplementation(() => {})
    pm.registerPlugin(p1)
    pm.registerPlugin(p2)
    const resolved = pm.getService<typeof svcA>('router')
    expect(resolved).toBe(svcA)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
    capSpy.mockRestore()
  })

  it('runCapabilityAudit aggregates missing capabilities and exposes result', () => {
    // Allow registration for all plugins
    const gw: SecurityGateway = {
      evaluate: vi.fn().mockReturnValue(true),
      audit: vi.fn(),
      auditPlugin: vi.fn().mockReturnValue({ ok: true, reasons: [] }),
    }
    setSecurityGateway(gw)
    const old = process.env.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE
    process.env.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE = '1'
    const base = makeTestPlugin('base', {}, [])
    pm.registerPlugin(base)
    // consumer needs cap:z which is not granted or announced
    const consumer = makeTestPlugin('consumer', {}, ['cap:z'])
    pm.registerPlugin(consumer)
    // provider announces cap:y, not cap:z
    const provider: Plugin = { name: 'provider', announcedCapabilities: ['cap:y'] }
    pm.registerPlugin(provider)
    const audit = pm.runCapabilityAudit()
    expect(audit.ok).toBe(false)
    expect(audit.errors.some(e => e.capability === 'cap:z')).toBe(true)
    expect(pm.getAudit()).toEqual(audit)
    process.env.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE = old
  })

  it('rolls back on failure when experimental lifecycle is enabled', () => {
    const old = process.env.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE
    process.env.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE = '1'
    const unloadSpy = vi.fn()
    const boom: Plugin = {
      name: 'boom',
      init: () => {},
      onLoad: () => { throw new Error('load-fail') },
      onUnload: () => { unloadSpy() },
    }
    const gw: SecurityGateway = {
      evaluate: vi.fn().mockReturnValue(true),
      audit: vi.fn(),
      auditPlugin: vi.fn().mockReturnValue({ ok: true, reasons: [] }),
    }
    setSecurityGateway(gw)
    expect(() => pm.registerPlugin(boom)).toThrowError(/load-fail/)
    expect(pm.listPlugins()).not.toContain('boom')
    expect(unloadSpy).toHaveBeenCalledTimes(1)
    process.env.SWISS_EXPERIMENTAL_PLUGIN_LIFECYCLE = old
  })
})
