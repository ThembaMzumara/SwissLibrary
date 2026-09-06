/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Background service worker (MV3)
// Routes messages between devtools panel and content scripts per tab

chrome.runtime.onConnect.addListener((port: unknown) => {
  const p = port as { name?: string; onMessage: { addListener(fn: (msg: unknown) => void): void }; onDisconnect: { addListener(fn: () => void): void }; postMessage?: (msg: unknown) => void }
  if (p?.name !== 'swiss-devtools') return

  type PanelMsg = {
    source: 'swiss-devtools'
    direction: 'to-page'
    type: string
    payload?: unknown
    tabId: number
  }

  function isPanelMsg(x: unknown): x is PanelMsg {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    return (
      o.source === 'swiss-devtools' &&
      o.direction === 'to-page' &&
      typeof o.type === 'string' &&
      typeof o.tabId === 'number'
    )
  }

  p.onMessage.addListener((msg: unknown) => {
    // Messages from devtools panel should include tabId
    if (!isPanelMsg(msg)) return
    const targetTabId = msg.tabId
    if (targetTabId >= 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chrome as any).tabs?.sendMessage?.(targetTabId, msg)
    }
  })

  const onTabMessage = (message: unknown, sender: unknown) => {
    const s = sender as { tab?: { id?: number } }
    // Forward messages coming from content (has sender.tab)
    if (s.tab && typeof s.tab.id === 'number') {
      p.postMessage?.({ tabId: s.tab.id, payload: message })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chrome as any).runtime?.onMessage?.addListener?.(onTabMessage)

  p.onDisconnect.addListener(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome as any).runtime?.onMessage?.removeListener?.(onTabMessage)
  })
})
