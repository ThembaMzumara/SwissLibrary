/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

// Devtools panel script

const port = chrome.runtime.connect({ name: 'swiss-devtools' })
const tabId = chrome.devtools.inspectedWindow.tabId

const out = document.getElementById('out') as HTMLPreElement
const pingBtn = document.getElementById('ping') as HTMLButtonElement
const listBtn = document.getElementById('list') as HTMLButtonElement

function println(msg: string) {
  out.textContent = msg
}

function send(type: string, payload?: unknown) {
  port.postMessage({ source: 'swiss-devtools', direction: 'to-page', type, payload, tabId })
}

pingBtn.onclick = () => {
  println('Pinging...')
  send('ping')
}

listBtn.onclick = () => {
  println('Listing plugins...')
  send('list-plugins')
}

type PanelInbound = { tabId?: number; payload?: unknown }
type PageToPanelMsg = {
  source: 'swiss-devtools'
  direction: 'to-panel'
  type: string
  result?: unknown
  message?: unknown
  [k: string]: unknown
}

function isPanelInbound(x: unknown): x is PanelInbound {
  return !!x && typeof x === 'object'
}

function isPageToPanelMsg(x: unknown): x is PageToPanelMsg {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return o.source === 'swiss-devtools' && o.direction === 'to-panel' && typeof o.type === 'string'
}

port.onMessage.addListener((message: unknown) => {
  // Expect shape: { tabId, payload }
  if (!isPanelInbound(message)) return
  const p = (message as Record<string, unknown>).payload
  if (!isPageToPanelMsg(p)) return

  if (p.type === 'pong') {
    println(`[ping] ${String(p.result)}`)
  } else if (p.type === 'list-plugins:result') {
    const list = Array.isArray(p.result) ? (p.result as unknown[]) : []
    const names = list
      .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>).name : undefined))
      .map((n) => (typeof n === 'string' ? n : 'unknown'))
      .join(', ')
    println(`[list-plugins] ${list.length} plugin(s): ${names}`)
  } else if (p.type === 'error') {
    println(`[error] ${String(p.message ?? 'Unknown error')}`)
  }
})
