import { open } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { imageMeta } from 'image-meta'
import { LRUCache } from 'lru-cache'

interface Dimensions { width: number; height: number }
interface ReaderOptions {
  wpSiteUrl: string
  siteUrl: string
  uploadsDir: string
  fetch?: typeof globalThis.fetch
}

const MAX_HEADER_BYTES = 64 * 1024
const UPLOADS = '/wp-content/uploads/'

function dimensions(bytes: Uint8Array): Dimensions | undefined {
  try {
    const meta = imageMeta(bytes)
    if (!(meta.width > 0 && meta.height > 0)) return
    return meta.orientation && meta.orientation >= 5
      ? { width: meta.height, height: meta.width }
      : { width: meta.width, height: meta.height }
  } catch { return }
}

// Отдельная фабрика позволяет проверять ограничения чтения без Nuxt и реальной сети.
export function createImageDimensionsReader(options: ReaderOptions) {
  const cache = new LRUCache<string, { value?: Dimensions }>({ max: 256, ttl: 86400_000 })
  const pending = new Map<string, Promise<Dimensions | undefined>>()
  const allowed = new Set([new URL(options.wpSiteUrl).host, new URL(options.siteUrl).host])

  async function read(url: URL, relative: string): Promise<Dimensions | undefined> {
    if (options.uploadsDir) {
      const root = resolve(options.uploadsDir)
      const file = resolve(root, relative)
      if (!file.startsWith(root + sep)) return
      try {
        const handle = await open(file, 'r')
        try {
          const bytes = Buffer.alloc(MAX_HEADER_BYTES)
          const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0)
          const size = dimensions(bytes.subarray(0, bytesRead))
          if (size) return size
        } finally { await handle.close() }
      } catch { /* В dev или на другом хосте uploads могут быть недоступны на диске. */ }
    }

    try {
      // Только известный WP origin и uploads, без переходов на сторонние хосты.
      const source = new URL(url.pathname + url.search, options.wpSiteUrl)
      const response = await (options.fetch || globalThis.fetch)(source, {
        headers: { Range: `bytes=0-${MAX_HEADER_BYTES - 1}` },
        redirect: 'error',
        signal: AbortSignal.timeout(2000),
      })
      if (!response.ok || !response.body) {
        await response.body?.cancel()
        return
      }
      const reader = response.body.getReader()
      let bytes = Buffer.alloc(0)
      try {
        while (bytes.length < MAX_HEADER_BYTES) {
          const chunk = await reader.read()
          if (chunk.done) break
          bytes = Buffer.concat([bytes, chunk.value.subarray(0, MAX_HEADER_BYTES - bytes.length)])
          const size = dimensions(bytes)
          if (size) return size
        }
      } finally { await reader.cancel().catch(() => {}) }
    } catch { /* Метаданные не должны делать главную недоступной при сбое файла. */ }
  }

  return async (src: unknown): Promise<Dimensions | undefined> => {
    if (typeof src !== 'string' || !src) return
    let url: URL
    let relative: string
    try {
      url = new URL(src, options.siteUrl)
      if (!['http:', 'https:'].includes(url.protocol) || !allowed.has(url.host) || !url.pathname.startsWith(UPLOADS)) return
      relative = decodeURIComponent(url.pathname.slice(UPLOADS.length))
      if (!relative || relative.includes('\0') || relative.split(/[\\/]/).includes('..')) return
    } catch { return }
    if (cache.has(url.href)) return cache.get(url.href)?.value
    const existing = pending.get(url.href)
    if (existing) return existing
    const task = read(url, relative).then(value => {
      cache.set(url.href, { value }, { ttl: value ? 86400_000 : 60_000 })
      return value
    }).finally(() => pending.delete(url.href))
    pending.set(url.href, task)
    return task
  }
}

let uploadReader: ReturnType<typeof createImageDimensionsReader> | undefined
let readerKey = ''

export function getUploadImageDimensions(src: unknown) {
  const config = useRuntimeConfig()
  const key = `${config.wpSiteUrl}|${config.public.siteUrl}|${config.wpUploadsDir}`
  if (!uploadReader || readerKey !== key) {
    readerKey = key
    uploadReader = createImageDimensionsReader({
      wpSiteUrl: String(config.wpSiteUrl), siteUrl: String(config.public.siteUrl), uploadsDir: String(config.wpUploadsDir || ''),
    })
  }
  return uploadReader(src)
}
