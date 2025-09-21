#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const ROOTS = ['app', 'components', 'lib']
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js'])

const issues = []

async function walk(dir) {
  let entries = []
  try {
    entries = await readdir(dir)
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue
    if (entry === 'node_modules') continue

    const fullPath = path.join(dir, entry)
    let entryStat
    try {
      entryStat = await stat(fullPath)
    } catch {
      continue
    }

    if (entryStat.isDirectory()) {
      await walk(fullPath)
    } else if (EXTENSIONS.has(path.extname(entry))) {
      await inspectFile(fullPath)
    }
  }
}

const classRegex = /className\s*=\s*"([^"]+)"/g

function appliesToMobile(prefixes) {
  if (prefixes.length === 0) return true
  return prefixes.some((prefix) =>
    ['max-md', 'mobile', 'sm', 'xs'].includes(prefix)
  )
}

function parseHeightToken(token) {
  const base = token.split(':').pop() || token

  const exactMatch = base.match(/^h-(\d+)$/)
  if (exactMatch) {
    const value = Number(exactMatch[1])
    return Number.isFinite(value) ? value * 4 : null // tailwind spacing uses 0.25rem increments
  }

  const pxMatch = base.match(/^h-\[(\d+)px\]$/)
  if (pxMatch) {
    return Number(pxMatch[1])
  }

  const minPxMatch = base.match(/^min-h-\[(\d+)px\]$/)
  if (minPxMatch) {
    return Number(minPxMatch[1])
  }

  const minExactMatch = base.match(/^min-h-(\d+)$/)
  if (minExactMatch) {
    const value = Number(minExactMatch[1])
    return Number.isFinite(value) ? value * 4 : null
  }

  return null
}

async function inspectFile(filePath) {
  let content
  try {
    content = await readFile(filePath, 'utf8')
  } catch {
    return
  }

  let match
  while ((match = classRegex.exec(content)) !== null) {
    const classes = match[1].split(/\s+/).filter(Boolean)
    const line = content.slice(0, match.index).split('\n').length

    const flagged = []

    for (const cls of classes) {
      const parts = cls.split(':')
      const base = parts[parts.length - 1]
      const prefixes = parts.slice(0, -1)

      if (!appliesToMobile(prefixes)) continue

      const value = parseHeightToken(base)
      if (value !== null && value < 44) {
        flagged.push({ token: cls, computed: value })
      }
    }

    if (flagged.length > 0) {
      issues.push({
        file: filePath,
        line,
        tokens: flagged.map((item) => `${item.token} (~${item.computed}px)`),
        context: match[1].trim(),
      })
    }
  }
}

async function run() {
  const root = process.cwd()
  await Promise.all(ROOTS.map((dir) => walk(path.join(root, dir))))

  if (issues.length === 0) {
    console.log('✅ Touch target audit: no issues detected (>= 44px on mobile variants).')
    return
  }

  console.log('⚠️ Touch target audit found potential small targets:')
  for (const issue of issues) {
    const relative = path.relative(root, issue.file)
    console.log(` - ${relative}:${issue.line} → ${issue.tokens.join(', ')}`)
  }
  console.log('\nReview these elements to ensure a 44px minimum for mobile touch targets.')
}

run().catch((error) => {
  console.error('Touch target audit failed:', error)
  process.exitCode = 1
})
