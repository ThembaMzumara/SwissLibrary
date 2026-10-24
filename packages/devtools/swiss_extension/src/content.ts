/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Content script: injects page script and bridges messages

// Inject page-level script to access the page context
(function inject() {
  const s = document.createElement('script')
  s.src = chrome.runtime.getURL('injected.js')
  s.type = 'module'
  s.onload = () => s.remove()
  ;(document.head || document.documentElement).appendChild(s)
})()

type WindowToExtensionMsg = {
  source: 'swiss-devtools'
  direction: 'to-extension'
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

function isWindowToExtensionMsg(x: unknown): x is WindowToExtensionMsg {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return o.source === 'swiss-devtools' && o.direction === 'to-extension' && typeof o.type === 'string'
}

type PanelToPageMsg = {
  source: 'swiss-devtools'
  direction: 'to-page'
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

function isPanelToPageMsg(x: unknown): x is PanelToPageMsg {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return o.source === 'swiss-devtools' && o.direction === 'to-page' && typeof o.type === 'string'
}

// Relay messages between page (window) and extension background
window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return
  const data = event.data as unknown
  if (!isWindowToExtensionMsg(data)) return
  // Forward to background (which will forward to panel)
  chrome.runtime.sendMessage(data)
})

chrome.runtime.onMessage.addListener((msg: unknown) => {
  // Messages from panel -> forward to page via window
  if (!isPanelToPageMsg(msg)) return
  window.postMessage(msg, '*')
})
