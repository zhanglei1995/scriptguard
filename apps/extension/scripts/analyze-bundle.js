#!/usr/bin/env node

/**
 * Bundle analysis script for ScriptGuard extension
 * Uses source-map-explorer to visualize bundle composition
 *
 * Usage: node scripts/analyze-bundle.js [build-dir]
 * Default build dir: build/chrome-mv3-prod
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const defaultBuildDir = path.join(rootDir, 'build', 'chrome-mv3-prod')

const buildDir = process.argv[2] || defaultBuildDir

console.log(`\n📦 ScriptGuard Bundle Analyzer`)
console.log(`${'='.repeat(50)}`)
console.log(`Build dir: ${buildDir}`)

if (!existsSync(buildDir)) {
  console.error(`\n❌ Build directory not found: ${buildDir}`)
  console.error(`Run "pnpm build" first to generate the build output.`)
  process.exit(1)
}

const jsFiles = readdirSync(buildDir).filter((f) => f.endsWith('.js'))
if (jsFiles.length === 0) {
  console.error(`\n❌ No .js files found in ${buildDir}`)
  process.exit(1)
}

console.log(`\nFound ${jsFiles.length} JS bundles:\n`)

const sizeTargets = {
  'background': { maxKB: 50, label: 'Background SW' },
  'content': { maxKB: 30, label: 'Content Script' },
  'popup': { maxKB: 50, label: 'Popup' },
  'options': { maxKB: 200, label: 'Options' },
}

const results = []

for (const file of jsFiles) {
  const filePath = path.join(buildDir, file)
  const { statSync } = await import('node:fs')
  const sizeKB = Math.round(statSync(filePath).size / 1024)

  let target = null
  for (const [key, cfg] of Object.entries(sizeTargets)) {
    if (file.toLowerCase().includes(key)) {
      target = { ...cfg, key }
      break
    }
  }

  const status = target
    ? (sizeKB <= target.maxKB ? '✅' : '❌')
    : 'ℹ️'

  const targetStr = target ? ` (target: <${target.maxKB}KB)` : ''

  results.push({ file, sizeKB, target, status })

  console.log(`  ${status} ${file} — ${sizeKB}KB${targetStr}`)
}

console.log(`\n${'='.repeat(50)}`)

const failures = results.filter((r) => r.status === '❌')
if (failures.length > 0) {
  console.log(`\n⚠️  ${failures.length} bundle(s) exceed size targets:`)
  for (const f of failures) {
    console.log(`   - ${f.file}: ${f.sizeKB}KB > ${f.target!.maxKB}KB (${f.target!.label})`)
  }
  process.exit(1)
} else {
  console.log(`\n✅ All bundles within size targets`)
}

try {
  console.log(`\n🔍 Running source-map-explorer...\n`)
  const glob = jsFiles.map((f) => path.join(buildDir, f)).join(' ')
  execSync(`npx source-map-explorer ${glob} --html report.html`, {
    cwd: buildDir,
    stdio: 'inherit',
  })
  console.log(`\n📄 Report saved to ${path.join(buildDir, 'report.html')}`)
} catch {
  console.log(`\n⚠️  source-map-explorer skipped (install with: npm i -g source-map-explorer)`)
}
