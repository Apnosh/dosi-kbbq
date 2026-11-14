#!/usr/bin/env node
/**
 * npm run check: build the site and catch the mistakes a change most often makes, before it is pushed.
 * Apnosh AI runs this before every edit it pushes (SITE-EDITING.md); people can too.
 *
 *   1. the site builds
 *   2. every page has a title and a description (search results show them)
 *   3. every link and image inside the site points at something that exists
 *   4. the Apnosh wiring is still in the layout: the tag (analytics), the form endpoint and the form script
 *
 * Exits 1 and lists every problem when anything fails.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const out = join(root, '_site')
const problems = []

try {
  execSync('npx @11ty/eleventy --quiet', { stdio: ['ignore', 'inherit', 'inherit'] })
} catch {
  console.error('\n✗ The site did not build. Fix the error above first.')
  process.exit(1)
}

/* every built page */
const pages = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.html')) pages.push(p)
  }
}
walk(out)

/* redirects in vercel.json count as existing */
const redirects = new Set()
try {
  for (const r of JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).redirects ?? []) redirects.add(String(r.source).replace(/\/$/, ''))
} catch { /* no redirects */ }

const exists = (url) => {
  const path = decodeURIComponent(url.split(/[?#]/)[0])
  if (path === '' || path === '/') return true
  const clean = path.replace(/\/$/, '')
  if (redirects.has(clean)) return true
  const local = join(out, clean)
  return existsSync(local) && statSync(local).isFile() || existsSync(join(local, 'index.html')) || existsSync(`${local}.html`)
}

for (const page of pages) {
  const html = readFileSync(page, 'utf8')
  const name = '/' + relative(out, page)
  if (name.endsWith('/404.html')) continue
  if (!/<title>[^<]{3,}<\/title>/.test(html)) problems.push(`${name}: no page title`)
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) problems.push(`${name}: no description`)
  for (const m of html.matchAll(/(?:href|src)="(\/[^"/][^"]*)"/g)) {
    if (!exists(m[1])) problems.push(`${name}: broken link ${m[1]}`)
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0]
      if (url.startsWith('/') && !url.startsWith('//') && !exists(url)) problems.push(`${name}: missing image ${url}`)
    }
  }
}

const layout = readFileSync(join(root, 'src/_includes/base.njk'), 'utf8')
if (!layout.includes('/t/{{ apnosh.slug }}.js')) problems.push('src/_includes/base.njk: the Apnosh tag is missing (analytics and tap tracking)')
if (!layout.includes('DOSI_FORMS_ENDPOINT')) problems.push('src/_includes/base.njk: the form endpoint is missing (forms would stop reaching the portal)')
if (!layout.includes('/assets/js/forms.js')) problems.push('src/_includes/base.njk: the form script is missing')

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'}:`)
  for (const p of [...new Set(problems)].slice(0, 100)) console.error(`  - ${p}`)
  process.exit(1)
}
console.log(`✓ Built ${pages.length} pages: titles, descriptions, links, images and the Apnosh wiring all check out.`)
