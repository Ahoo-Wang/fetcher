#!/usr/bin/env node

/**
 * Mermaid syntax validator and fixer using mermaid-cli (mmdc).
 *
 * Strategy:
 * 1. Extract mermaid blocks from each .md file
 * 2. Validate each block with `mmdc` (renders to temp SVG)
 * 3. If validation fails, apply common fixes and re-validate
 * 4. Report results and rewrite files with fixes applied
 */

import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, mkdtempSync } from 'fs'
import { join, extname } from 'path'
import { execSync } from 'child_process'
import { tmpdir } from 'os'

const MD_EXTENSIONS = new Set(['.md'])
const tempDir = mkdtempSync(join(tmpdir(), 'mermaid-validate-'))

// Use system Chrome for Puppeteer (mermaid-cli)
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
process.env.PUPPETEER_EXECUTABLE_PATH = CHROME_PATH

function walkDir(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      files.push(...walkDir(fullPath))
    } else if (MD_EXTENSIONS.has(extname(entry))) {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Validate a single mermaid block using mmdc.
 * Returns { valid: boolean, error: string | null }
 */
function validateBlock(block, index) {
  const tempFile = join(tempDir, `block_${index}.mmd`)
  const tempSvg = join(tempDir, `block_${index}.svg`)

  writeFileSync(tempFile, block, 'utf-8')

  try {
    execSync(`mmdc -i "${tempFile}" -o "${tempSvg}" -q -t dark -b transparent`, {
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { valid: true, error: null }
  } catch (err) {
    const stderr = err.stderr?.toString() || ''
    const stdout = err.stdout?.toString() || ''
    return { valid: false, error: stderr || stdout || 'Unknown validation error' }
  } finally {
    try { unlinkSync(tempSvg) } catch {}
  }
}

/**
 * Apply common syntax fixes to a mermaid block.
 * Returns { fixed: string, changes: string[] }
 */
function applyFixes(block) {
  let fixed = block
  const changes = []

  // Fix 0: HTML entities → backtick-wrapped angle brackets
  // Mermaid can't parse &lt;T&gt; — wrap in backticks for generic types
  const htmlEntityCount = (fixed.match(/&lt;|&gt;/g) || []).length
  if (htmlEntityCount > 0) {
    // Replace &lt;...&gt; patterns that look like generic types with backtick-wrapped versions
    fixed = fixed.replace(/(\w+)&lt;([^&]+)&gt;/g, '`$1<$2>`')
    changes.push(`Fixed ${htmlEntityCount}x HTML entities in generic types`)
  }

  // Fix 1: <br/> → <br> (Vue compiler compatibility)
  const brCount = (fixed.match(/<br\/>/g) || []).length
  if (brCount > 0) {
    fixed = fixed.replace(/<br\/>/g, '<br>')
    changes.push(`Replaced ${brCount}x <br/> with <br>`)
  }

  // Fix 2: Convert quoted subgraph names to ID-based syntax
  // subgraph "Some Name" → subgraph sg_N ["Some Name"]
  let counter = 0
  const subgraphRegex = /subgraph\s+"([^"]+)"/g
  let subMatch
  let tempFixed = fixed
  const subMatches = []
  while ((subMatch = subgraphRegex.exec(fixed)) !== null) {
    subMatches.push({ full: subMatch[0], name: subMatch[1] })
  }
  for (const m of subMatches) {
    const id = 'sg_' + (++counter)
    tempFixed = tempFixed.replace(m.full, `subgraph ${id} ["${m.name}"]`)
  }
  if (subMatches.length > 0) {
    fixed = tempFixed
    changes.push(`Fixed ${subMatches.length}x quoted subgraph names`)
  }

  // Fix 3: Remove style directives inside sequenceDiagram (not supported)
  const firstLine = fixed.trim().split('\n')[0].trim()
  if (firstLine === 'sequenceDiagram') {
    const styleRegex = /^\s*style\s+\S+\s+fill:.*$/gm
    const styleCount = (fixed.match(styleRegex) || []).length
    if (styleCount > 0) {
      fixed = fixed.replace(styleRegex, '')
      changes.push(`Removed ${styleCount}x style directives from sequenceDiagram`)
    }
  }

  // Fix 4: Remove linkStyle directives (index out of bounds errors)
  const linkStyleRegex = /^\s*linkStyle\s+.*$/gm
  const linkStyleCount = (fixed.match(linkStyleRegex) || []).length
  if (linkStyleCount > 0) {
    fixed = fixed.replace(linkStyleRegex, '')
    changes.push(`Removed ${linkStyleCount}x linkStyle directives`)
  }

  // Fix 5: Remove "quoted name" style directives (parse errors)
  const quotedStyleRegex = /^\s*style\s+"[^"]+"\s+fill:.*$/gm
  const quotedStyleCount = (fixed.match(quotedStyleRegex) || []).length
  if (quotedStyleCount > 0) {
    fixed = fixed.replace(quotedStyleRegex, '')
    changes.push(`Removed ${quotedStyleCount}x style "quoted name" directives`)
  }

  // Fix 6: sequenceDiagram autonumber — ensure single autonumber
  if (firstLine === 'sequenceDiagram') {
    const hasAutonumber = /^\s*autonumber\s*$/m.test(fixed)
    if (hasAutonumber) {
      // Remove all, then add one after sequenceDiagram
      fixed = fixed.replace(/^\s*autonumber\s*$/gm, '')
      fixed = fixed.replace(/^(sequenceDiagram)\n/, '$1\nautonumber\n')
      changes.push('Normalized autonumber in sequenceDiagram')
    }
  }

  // Fix 7: quadrantChart — remove parentheses from labels
  if (firstLine === 'quadrantChart') {
    const parenRegex = /^(\s+[\w\s]+)\(([^)]+)\)(:\s*\[[\d., ]+])$/gm
    let parenMatch
    let parenFixed = fixed
    let parenCount = 0
    while ((parenMatch = parenRegex.exec(fixed)) !== null) {
      parenFixed = parenFixed.replace(parenMatch[0], parenMatch[1] + parenMatch[2] + parenMatch[3])
      parenCount++
    }
    if (parenCount > 0) {
      fixed = parenFixed
      changes.push(`Removed ${parenCount}x parentheses from quadrantChart labels`)
    }
  }

  // Clean up excessive blank lines
  fixed = fixed.replace(/\n{3,}/g, '\n\n')

  return { fixed, changes }
}

/**
 * Process a single mermaid block: validate, fix if needed, re-validate.
 * Returns { block: string, wasFixed: boolean, changes: string[], stillBroken: boolean, error: string | null }
 */
function processBlock(block, index) {
  // First validate as-is
  const result = validateBlock(block, index)
  if (result.valid) {
    return { block, wasFixed: false, changes: [], stillBroken: false, error: null }
  }

  // Apply fixes
  const { fixed, changes } = applyFixes(block)
  if (changes.length === 0) {
    return { block, wasFixed: false, changes: [], stillBroken: true, error: result.error }
  }

  // Re-validate after fixes
  const reResult = validateBlock(fixed, index + 10000)
  if (reResult.valid) {
    return { block: fixed, wasFixed: true, changes, stillBroken: false, error: null }
  }

  // Still broken after fixes
  return { block: fixed, wasFixed: true, changes, stillBroken: true, error: reResult.error }
}

// Main execution
const wikiDir = join(import.meta.dirname, '..')
const files = walkDir(wikiDir)

let totalBlocks = 0
let totalFixed = 0
let totalStillBroken = 0
let filesModified = 0

console.log(`Scanning ${files.length} markdown files for Mermaid blocks...\n`)

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  let match
  let blockIndex = 0
  let newContent = content
  let fileChanged = false
  const fileIssues = []

  while ((match = mermaidRegex.exec(content)) !== null) {
    const block = match[1]
    const fullMatch = match[0]
    totalBlocks++

    const result = processBlock(block, blockIndex)

    if (result.wasFixed) {
      fileChanged = true
      const newBlock = '```mermaid\n' + result.block + '```'
      newContent = newContent.replace(fullMatch, newBlock)

      if (result.stillBroken) {
        totalStillBroken++
        fileIssues.push({
          block: blockIndex,
          status: 'FIXED but still has errors',
          changes: result.changes,
          error: result.error,
        })
      } else {
        totalFixed++
        fileIssues.push({
          block: blockIndex,
          status: 'FIXED and now valid',
          changes: result.changes,
        })
      }
    } else if (result.stillBroken) {
      totalStillBroken++
      fileIssues.push({
        block: blockIndex,
        status: 'BROKEN (no fix available)',
        error: result.error,
      })
    }

    blockIndex++
  }

  if (fileChanged) {
    writeFileSync(file, newContent, 'utf-8')
    filesModified++
  }

  if (fileIssues.length > 0) {
    const relPath = file.replace(wikiDir, '.')
    console.log(`${relPath}:`)
    for (const issue of fileIssues) {
      console.log(`  Block ${issue.block}: ${issue.status}`)
      if (issue.changes) {
        for (const c of issue.changes) {
          console.log(`    - ${c}`)
        }
      }
      if (issue.error) {
        // Truncate long errors
        const errLine = issue.error.split('\n').filter(l => l.trim()).slice(0, 3).join(' | ')
        console.log(`    Error: ${errLine.substring(0, 200)}`)
      }
    }
    console.log('')
  }
}

console.log(`\n--- Summary ---`)
console.log(`Files scanned: ${files.length}`)
console.log(`Mermaid blocks found: ${totalBlocks}`)
console.log(`Blocks fixed: ${totalFixed}`)
console.log(`Blocks still broken: ${totalStillBroken}`)
console.log(`Files modified: ${filesModified}`)

if (totalBlocks === 0) {
  console.log('No Mermaid blocks found.')
} else if (totalStillBroken === 0 && totalFixed === 0) {
  console.log('All Mermaid blocks are valid!')
} else if (totalStillBroken > 0) {
  console.log(`\n⚠️  ${totalStillBroken} block(s) still have syntax errors after fixes.`)
  process.exit(1)
}

process.exit(0)
