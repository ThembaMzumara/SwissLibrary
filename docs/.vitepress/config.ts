/*
 * Copyright (c) 2024 Themba Mzumara
 * This file is part of SwissJS Framework. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/// <reference types="node" />
import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

function toTitleCase(id: string): string {
  return id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function genSectionSidebar(section: string) {
  const sectionDir = path.resolve(__dirname, '..', section)
  let items: { text: string; link: string }[] = []

  try {
    const files = fs
      .readdirSync(sectionDir)
      .filter((f) => f.endsWith('.md') && f !== 'index.md')
      .sort((a, b) => a.localeCompare(b))

    items = [
      { text: 'Overview', link: `/${section}/` },
      ...files.map((file) => {
        const name = file.replace(/\.md$/, '')
        return {
          text: toTitleCase(name),
          link: `/${section}/${name}`
        }
      })
    ]
  } catch {
    // If the directory doesn't exist or can't be read, fall back to Overview only
    items = [{ text: 'Overview', link: `/${section}/` }]
  }

  return [
    {
      text: toTitleCase(section.replace(/-/g, ' ')),
      items
    }
  ]
}

export default defineConfig({
  title: 'SwissJS',
  description: 'Capability-based web framework',
  // Enable dead link checking, but ignore:
  // - generated API docs under /api/
  // - relative './index' links produced by TypeDoc inside API pages
  ignoreDeadLinks: [/^\/api\//, /^\.\/index$/],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Concepts', link: '/concepts/' },
      { text: 'Compiler', link: '/compiler/' },
      { text: 'Core', link: '/core/' },
      { text: 'CLI', link: '/cli/' },
      { text: 'Devtools', link: '/devtools/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Development', link: '/development/' },
      { text: 'Quickstart', link: '/DEVELOPER_QUICKSTART' },
      { text: 'How-To', link: '/how-to/' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Developer Quickstart', link: '/DEVELOPER_QUICKSTART' }
          ]
        }
      ],
      '/guide/': genSectionSidebar('guide'),
      '/concepts/': genSectionSidebar('concepts'),
      '/compiler/': genSectionSidebar('compiler'),
      '/core/': genSectionSidebar('core'),
      '/cli/': genSectionSidebar('cli'),
      '/devtools/': genSectionSidebar('devtools'),
      '/plugins/': genSectionSidebar('plugins'),
      '/development/': genSectionSidebar('development'),
      '/how-to/': genSectionSidebar('how-to'),
      '/api/': [
        { text: 'API Reference', items: [
          { text: '@swissjs/core', link: '/api/core/' },
          { text: '@swissjs/compiler', link: '/api/compiler/' },
          { text: '@swissjs/cli', link: '/api/cli/' },
          { text: '@swissjs/utils', link: '/api/utils/' },
          { text: '@swissjs/vite-plugin-swiss', link: '/api/vite-plugin-swiss/' },
          { text: '@swissjs/plugin-file-router', link: '/api/plugin-file-router/' },
          { text: '@swissjs/plugin-web-storage', link: '/api/plugin-web-storage/' }
        ]}
      ]
    }
  }
})
