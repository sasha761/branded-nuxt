#!/usr/bin/env node
/**
 * Сверка SEO двух сайтов по одним и тем же путям: эталон (--base, живой сайт на теме WP)
 * против проверяемого (--target, Nuxt на staging или локальная prod-сборка).
 * Шаг 7 чек-листа docs/project-review-2026-10-20.md.
 *
 * Пути берутся из sitemap эталона (Yoast, оба языка в одном индексе) и/или из файла (--urls:
 * экспорт «Страницы» из GSC — CSV, первый столбец с адресом, или просто по адресу на строку).
 * Только GET-запросы, редиректы не проходятся: сравнивается сам ответ (статус и Location).
 *
 * Сравнивается:
 * - важное (расхождение = код выхода 1): статус, Location, X-Robots-Tag, title, description,
 *   robots, canonical, hreflang, prev/next, H1;
 * - справочно: картинки из /wp-content/uploads/ (набор путей, alt), og:image, JSON-LD
 *   (типы из @graph, крошки, название и цена товара).
 *
 * Примеры:
 *   node scripts/compare-urls.mjs --target http://127.0.0.1:3100 --sample 100
 *   node scripts/compare-urls.mjs --target https://staging.branded.com.ua --urls gsc-top.csv
 *   COMPARE_TARGET_AUTH=user:pass node scripts/compare-urls.mjs --target https://staging… --concurrency 8
 *
 * Отчёт: <out>/report.json (все расхождения) и <out>/report.md (сводка и примеры).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { parse } from 'node-html-parser'

const HELP = `node scripts/compare-urls.mjs --target <url> [опции]

  --base <url>         эталон, по умолчанию https://branded.com.ua
  --target <url>       проверяемый сайт (обязательно)
  --sitemap <url>      индекс sitemap, по умолчанию <base>/sitemap_index.xml
  --urls <file>        список адресов или путей (CSV из GSC тоже), вместо sitemap;
                       вместе с --sitemap — оба источника
  --sample <n>         взять n путей равномерно из каждого sitemap (пропорционально размеру)
  --limit <n>          первые n путей
  --concurrency <n>    параллельных путей, по умолчанию 4 (запросы к base и target идут одновременно)
  --timeout <ms>       таймаут запроса, по умолчанию 30000
  --out <dir>          папка отчёта, по умолчанию test-results/compare-urls

Basic-auth (staging): COMPARE_BASE_AUTH=user:pass, COMPARE_TARGET_AUTH=user:pass.`

// Прод отвечает 403 на User-Agent с HeadlessChrome, поэтому — обычный браузер.
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

const CRITICAL_FIELDS = ['status', 'location', 'xRobotsTag', 'title', 'description', 'robots', 'canonical', 'hreflang', 'prevNext', 'h1']
const INFO_FIELDS = ['imagesMissing', 'imagesExtra', 'imagesWithoutAlt', 'ogImage', 'jsonLdTypes', 'breadcrumbs', 'product']

const { values: args } = parseArgs({
  options: {
    base: { type: 'string', default: 'https://branded.com.ua' },
    target: { type: 'string' },
    sitemap: { type: 'string' },
    urls: { type: 'string' },
    sample: { type: 'string' },
    limit: { type: 'string' },
    concurrency: { type: 'string', default: '4' },
    timeout: { type: 'string', default: '30000' },
    out: { type: 'string', default: 'test-results/compare-urls' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (args.help || !args.target) {
  console.log(HELP)
  process.exit(args.help ? 0 : 2)
}

const base = args.base.replace(/\/+$/, '')
const target = args.target.replace(/\/+$/, '')
const timeout = Number(args.timeout)
const authHeaders = {
  base: basicAuth(process.env.COMPARE_BASE_AUTH),
  target: basicAuth(process.env.COMPARE_TARGET_AUTH),
}

// node-html-parser, а не happy-dom: тот обрывает разбор HTML Nuxt на одном из <style> в <head>.
// Текст <script> сохраняется (нужен JSON-LD), <style> и комментарии отбрасываются.
const parseHtml = html => parse(html, { comment: false, blockTextElements: { script: true, pre: true } })

function basicAuth(credentials) {
  return credentials ? { authorization: `Basic ${Buffer.from(credentials).toString('base64')}` } : {}
}

async function request(url, headers = {}) {
  let lastError
  // Одна повторная попытка: на длинном прогоне сетевые сбои случаются, а это не расхождение.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(timeout),
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml', ...headers },
      })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

// --- Источник путей ---

async function sitemapUrls(indexUrl) {
  const response = await request(indexUrl, authHeaders.base)
  if (!response.ok) {
    throw new Error(`${indexUrl}: ${response.status}`)
  }

  const locs = [...(await response.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(match => decodeXml(match[1]))
  // Индекс ссылается на другие sitemap, обычный sitemap — на страницы.
  if (!locs.every(loc => /\.xml(\?|$)/.test(loc))) {
    return [{ source: indexUrl, urls: locs }]
  }

  const groups = []
  for (const loc of locs) {
    groups.push(...await sitemapUrls(loc))
  }
  return groups
}

function decodeXml(text) {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, '\'')
}

async function fileUrls(file) {
  const text = await readFile(file, 'utf8')
  const urls = text.split(/\r?\n/)
    .map(line => line.split(/[,;\t]/)[0]?.trim().replace(/^"|"$/g, '') ?? '')
    .filter(value => /^(https?:\/\/|\/)/.test(value))
  return [{ source: file, urls }]
}

function toPath(url) {
  const { pathname, search } = new URL(url, base)
  return pathname + search
}

// Равномерно по каждому sitemap: в выборку попадают и товары, и категории, и страницы.
function sampleGroups(groups, size) {
  const total = groups.reduce((sum, group) => sum + group.urls.length, 0)
  return groups.flatMap(({ urls }) => {
    const count = Math.min(urls.length, Math.max(1, Math.round(size * urls.length / total)))
    const step = urls.length / count
    return Array.from({ length: count }, (_, index) => urls[Math.floor(index * step)])
  })
}

// --- Разбор страницы ---

const collapse = text => (text ?? '').replace(/\s+/g, ' ').trim()

function readableUrl(url) {
  if (!url) {
    return url
  }
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}

// Location относительно своего сайта: у base и target разные хосты.
function relativeLocation(location, origin) {
  if (!location) {
    return null
  }
  const url = new URL(location, origin)
  return url.origin === new URL(origin).origin ? readableUrl(url.pathname + url.search) : readableUrl(url.href)
}

// Исходный файл картинки без размера и формата: тема отдаёт ресайзы Timber (photo-200x250-c-default.webp),
// Nuxt — размеры WP (photo-371x504.jpg). Сравнивается, какие картинки на странице, а не их нарезка.
function imageKey(pathname) {
  let key = pathname.replace(/\.(jpe?g|png|webp|avif|gif)$/i, '')
  let previous
  do {
    previous = key
    // -c-default, -c-center — режим обрезки Timber
    key = key.replace(/-(c-[a-z]+|scaled|\d+x\d+)$/i, '')
  } while (key !== previous)
  return key
}

function uploadPaths(document) {
  const paths = new Set()
  const add = (value) => {
    for (const candidate of (value || '').split(',')) {
      const src = candidate.trim().split(/\s+/)[0]
      if (src && src.includes('/wp-content/uploads/')) {
        paths.add(imageKey(readableUrl(new URL(src, base).pathname)))
      }
    }
  }

  for (const element of document.querySelectorAll('img, source')) {
    for (const name of ['src', 'data-src', 'srcset', 'data-srcset']) {
      add(element.getAttribute(name))
    }
  }
  return paths
}

function imagesWithoutAlt(document) {
  return [...document.querySelectorAll('img')]
    .filter(img => /\/wp-content\/uploads\//.test(img.getAttribute('src') || img.getAttribute('data-src') || ''))
    .filter(img => !collapse(img.getAttribute('alt')))
    .length
}

function jsonLd(document) {
  const nodes = []
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.rawText)
      for (const item of [data].flat()) {
        nodes.push(...(item?.['@graph'] ?? [item]))
      }
    } catch {
      nodes.push({ '@type': 'INVALID_JSON' })
    }
  }

  const types = [...new Set(nodes.flatMap(node => [node?.['@type']].flat()).filter(Boolean))].sort()
  const breadcrumbs = nodes.find(node => node?.['@type'] === 'BreadcrumbList')?.itemListElement
    ?.map(item => collapse(item.name ?? item.item?.name)) ?? []
  const product = nodes.find(node => [node?.['@type']].flat().includes('Product'))
  const offer = [product?.offers].flat()[0]
  const lowestPrice = offer?.lowPrice ?? offer?.price ?? offer?.priceSpecification?.[0]?.price ?? null

  return {
    jsonLdTypes: types.join(', '),
    breadcrumbs: breadcrumbs.join(' › '),
    product: product ? `${collapse(product.name)} | ${lowestPrice ?? '—'} | ${String(offer?.availability ?? '—').replace(/^https?:\/\/schema\.org\//, '')}` : '',
  }
}

async function snapshot(origin, path, headers) {
  // path уже закодирован: toPath() пропускает его через new URL
  const response = await request(origin + path, headers)
  const page = {
    status: response.status,
    location: relativeLocation(response.headers.get('location'), origin),
    xRobotsTag: response.headers.get('x-robots-tag') ?? '',
  }

  const type = response.headers.get('content-type') || ''
  if (!type.includes('text/html') || response.status >= 300) {
    await response.body?.cancel()
    return page
  }

  const document = parseHtml(await response.text())
  const meta = name => collapse(document.querySelector(`meta[name="${name}"]`)?.getAttribute('content'))
  const links = rel => [...document.querySelectorAll(`link[rel="${rel}"]`)].map(link => readableUrl(link.getAttribute('href')))

  return {
    ...page,
    title: collapse(document.querySelector('title')?.text),
    description: meta('description'),
    // Порядок директив у Yoast и у нас может отличаться — смысл тот же.
    robots: meta('robots').toLowerCase().split(',').map(token => token.trim()).filter(Boolean).sort().join(', '),
    canonical: links('canonical').join(' '),
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
      .map(link => `${link.getAttribute('hreflang')}=${readableUrl(link.getAttribute('href'))}`)
      .sort()
      .join(' '),
    prevNext: [...links('prev').map(href => `prev=${href}`), ...links('next').map(href => `next=${href}`)].join(' '),
    h1: [...document.querySelectorAll('h1')].map(h1 => collapse(h1.text)).join(' | '),
    images: uploadPaths(document),
    imagesWithoutAlt: imagesWithoutAlt(document),
    ogImage: readableUrl(document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? ''),
    ...jsonLd(document),
  }
}

function compare(path, basePage, targetPage) {
  const diffs = []
  const push = (field, expected, actual) => diffs.push({
    field,
    critical: CRITICAL_FIELDS.includes(field),
    base: expected,
    target: actual,
  })

  for (const field of CRITICAL_FIELDS) {
    if ((basePage[field] ?? '') !== (targetPage[field] ?? '')) {
      push(field, basePage[field] ?? '', targetPage[field] ?? '')
    }
  }

  if (basePage.images && targetPage.images) {
    const missing = [...basePage.images].filter(src => !targetPage.images.has(src))
    const extra = [...targetPage.images].filter(src => !basePage.images.has(src))
    if (missing.length) push('imagesMissing', missing.length, missing.slice(0, 5).join(' '))
    if (extra.length) push('imagesExtra', extra.length, extra.slice(0, 5).join(' '))
  }
  if (targetPage.imagesWithoutAlt) {
    push('imagesWithoutAlt', basePage.imagesWithoutAlt ?? 0, targetPage.imagesWithoutAlt)
  }

  for (const field of ['ogImage', 'jsonLdTypes', 'breadcrumbs', 'product']) {
    if ((basePage[field] ?? '') !== (targetPage[field] ?? '')) {
      push(field, basePage[field] ?? '', targetPage[field] ?? '')
    }
  }

  return { path: readableUrl(path), diffs }
}

// --- Прогон ---

async function pool(items, size, worker) {
  let next = 0
  let done = 0
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      await worker(items[index], index)
      done++
      if (done % 25 === 0 || done === items.length) {
        process.stdout.write(`\r${done}/${items.length}`)
      }
    }
  })
  await Promise.all(runners)
  process.stdout.write('\n')
}

function markdown(report) {
  const lines = [
    `# Сверка URL: ${report.base} → ${report.target}`,
    '',
    `${report.date}. Путей: ${report.total}, совпали полностью: ${report.identical}, с важными расхождениями: ${report.withCritical}, ошибок запроса: ${report.errors.length}.`,
    '',
    '| Поле | Важное | Путей |',
    '|---|---|---|',
    ...Object.entries(report.byField)
      .sort(([, a], [, b]) => b - a)
      .map(([field, count]) => `| ${field} | ${CRITICAL_FIELDS.includes(field) ? 'да' : ''} | ${count} |`),
    '',
  ]

  for (const field of [...CRITICAL_FIELDS, ...INFO_FIELDS]) {
    const examples = report.results.filter(result => result.diffs.some(diff => diff.field === field)).slice(0, 10)
    if (!examples.length) {
      continue
    }
    lines.push(`## ${field}`, '')
    for (const result of examples) {
      const diff = result.diffs.find(item => item.field === field)
      lines.push(`- \`${result.path}\``, `  - base: ${String(diff.base) || '—'}`, `  - target: ${String(diff.target) || '—'}`)
    }
    lines.push('')
  }

  if (report.errors.length) {
    lines.push('## Ошибки запроса', '', ...report.errors.map(({ path, error }) => `- \`${path}\`: ${error}`), '')
  }
  return lines.join('\n')
}

async function main() {
  const groups = []
  if (args.urls) {
    groups.push(...await fileUrls(args.urls))
  }
  if (args.sitemap || !args.urls) {
    groups.push(...await sitemapUrls(args.sitemap || `${base}/sitemap_index.xml`))
  }

  let urls = args.sample ? sampleGroups(groups, Number(args.sample)) : groups.flatMap(group => group.urls)
  urls = [...new Set(urls.map(toPath))]
  if (args.limit) {
    urls = urls.slice(0, Number(args.limit))
  }

  console.log(`${base} → ${target}: ${urls.length} путей (источники: ${groups.map(group => `${group.source.split('/').pop()} ${group.urls.length}`).join(', ')})`)

  const results = []
  const errors = []
  await pool(urls, Number(args.concurrency), async (path) => {
    try {
      const [basePage, targetPage] = await Promise.all([
        snapshot(base, path, authHeaders.base),
        snapshot(target, path, authHeaders.target),
      ])
      results.push(compare(path, basePage, targetPage))
    } catch (error) {
      errors.push({ path: readableUrl(path), error: error.cause?.code || error.message })
    }
  })

  results.sort((a, b) => a.path.localeCompare(b.path))
  const byField = {}
  for (const diff of results.flatMap(result => result.diffs)) {
    byField[diff.field] = (byField[diff.field] ?? 0) + 1
  }

  const report = {
    date: new Date().toISOString(),
    base,
    target,
    total: urls.length,
    identical: results.filter(result => !result.diffs.length).length,
    withCritical: results.filter(result => result.diffs.some(diff => diff.critical)).length,
    byField,
    errors,
    results: results.filter(result => result.diffs.length),
  }

  await mkdir(args.out, { recursive: true })
  await writeFile(join(args.out, 'report.json'), JSON.stringify(report, null, 2))
  await writeFile(join(args.out, 'report.md'), markdown(report))

  console.log(`Совпали полностью: ${report.identical}/${report.total}; с важными расхождениями: ${report.withCritical}; ошибок: ${errors.length}`)
  for (const [field, count] of Object.entries(byField).sort(([, a], [, b]) => b - a)) {
    console.log(`  ${CRITICAL_FIELDS.includes(field) ? '!' : ' '} ${field}: ${count}`)
  }
  console.log(`Отчёт: ${join(args.out, 'report.md')}`)

  process.exitCode = report.withCritical || errors.length ? 1 : 0
}

main().catch((error) => {
  console.error(error)
  process.exit(2)
})
