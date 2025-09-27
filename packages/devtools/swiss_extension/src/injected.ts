/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Injected into the page context. Talks directly to the Swiss app (if present)

// Minimal bridge API contract expected on the page in dev builds
// window.__SWISS_DEVTOOLS_BRIDGE__?: {
//   ping(): string | Promise<string>
//   getPlugins(): { name: string; services?: string[] }[] | Promise<any[]>
// }

type Bridge = {
  ping?: () => unknown
  getPlugins?: () => unknown
}

function isBridge(x: unknown): x is Bridge {
  return !!x && typeof x === 'object'
}

function toPanel(type: string, result: unknown) {
  window.postMessage({ source: 'swiss-devtools', direction: 'to-panel', type, result }, '*')
}

function toPanelError(message: string) {
  window.postMessage({ source: 'swiss-devtools', direction: 'to-panel', type: 'error', message }, '*')
}

async function handle(type: string) {
  const w = window as unknown as { __SWISS_DEVTOOLS_BRIDGE__?: Bridge }
  const bridge = w.__SWISS_DEVTOOLS_BRIDGE__
  if (!isBridge(bridge)) {
    toPanelError('No Swiss bridge detected on page. Ensure dev build exposes __SWISS_DEVTOOLS_BRIDGE__.')
    return
  }
  try {
    if (type === 'ping') {
      const r = await Promise.resolve(bridge.ping?.())
      toPanel('pong', typeof r === 'string' ? r : 'ok')
    } else if (type === 'list-plugins') {
      const r = await Promise.resolve(bridge.getPlugins?.())
      const arr = Array.isArray(r) ? r : []
      toPanel('list-plugins:result', arr)
    }
  } catch (e) {
    toPanelError(e instanceof Error ? e.message : 'Unknown error')
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  const data = event.data
  if (!data || data.source !== 'swiss-devtools' || data.direction !== 'to-page') return
  const type = data.type
  if (typeof type !== 'string') return
  void handle(type)
})
