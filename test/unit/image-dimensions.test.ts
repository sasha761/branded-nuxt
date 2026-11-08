import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createImageDimensionsReader } from '../../server/utils/imageDimensions'

const options = { wpSiteUrl: 'http://127.0.0.1:8081', siteUrl: 'https://branded.com.ua', uploadsDir: '' }
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64')

describe('размеры баннеров без скачивания полного изображения', () => {
  it('читает заголовок локального uploads и не обращается к сети', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
    const read = createImageDimensionsReader({ ...options, uploadsDir: resolve('app/assets/img'), fetch })
    expect(await read('https://branded.com.ua/wp-content/uploads/accessory1.jpg')).toEqual({ width: 824, height: 829 })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('объединяет одинаковые запросы, кеширует результат и отменяет чтение тела после заголовка', async () => {
    let cancelled = false
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(new ReadableStream({
      start(controller) { controller.enqueue(png); },
      cancel() { cancelled = true },
    })))
    const read = createImageDimensionsReader({ ...options, fetch })
    const url = 'https://branded.com.ua/wp-content/uploads/2026/banner.png'
    expect(await Promise.all([read(url), read(url)])).toEqual([{ width: 1, height: 1 }, { width: 1, height: 1 }])
    expect(await read(url)).toEqual({ width: 1, height: 1 })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(String(fetch.mock.calls[0]![0])).toBe('http://127.0.0.1:8081/wp-content/uploads/2026/banner.png')
    expect(fetch.mock.calls[0]![1]).toMatchObject({ headers: { Range: 'bytes=0-65535' }, redirect: 'error' })
    expect(cancelled).toBe(true)
  })

  it('не запрашивает чужие хосты, служебные пути и выход за каталог uploads', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
    const read = createImageDimensionsReader({ ...options, fetch })
    for (const url of [null, 'https://evil.example/wp-content/uploads/a.jpg', 'https://branded.com.ua/wp-config.php', 'https://branded.com.ua/wp-content/uploads/%2e%2e%2fsecret.png', 'file:///tmp/image.png']) {
      expect(await read(url)).toBeUndefined()
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('ограничивает чтение, даже если сервер игнорирует Range, и переносит недоступность файла', async () => {
    let cancelled = false
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(128 * 1024)); },
      cancel() { cancelled = true },
    })))
    const read = createImageDimensionsReader({ ...options, fetch })
    expect(await read('https://branded.com.ua/wp-content/uploads/large.jpg')).toBeUndefined()
    expect(cancelled).toBe(true)
    const failed = createImageDimensionsReader({ ...options, fetch: vi.fn(async () => { throw new Error('offline') }) })
    expect(await failed('https://branded.com.ua/wp-content/uploads/missing.jpg')).toBeUndefined()
  })
})
