import { expect, test } from '@playwright/test'

/**
 * Кеш HTML страниц (server/plugins/html-cache.ts) и заголовки безопасности.
 * Кеш есть только в production-сборке: против `nuxt dev` тесты кеша не имеют смысла.
 */
let category = ''

test.beforeAll(async ({ request }) => {
  const home = await (await request.get('/')).text()
  category = home.match(/href="(\/product-category\/[^"?#]+\/)"/)?.[1] ?? ''
  expect(category, 'категория в меню главной').not.toBe('')
})

test('разные метки рекламы — одна запись кеша, меток в HTML нет', async ({ request }) => {
  const first = await request.get(`${category}?page=2&gclid=e2eAAA&utm_source=e2e`)
  expect(first.status()).toBe(200)
  expect(first.headers()['x-html-cache']).toMatch(/^(MISS|HIT|STALE)$/)

  // Запись сохраняется после ответа (gzip и хранилище не задерживают первого посетителя)
  const tagged = () => request.get(`${category}?utm_campaign=e2e&page=2&fbclid=e2eBBB`)
  await expect.poll(async () => (await tagged()).headers()['x-html-cache'], { timeout: 5_000 }).toMatch(/^(HIT|STALE)$/)

  // Другие метки — та же запись: то же время рендера
  const second = await tagged()
  const third = await request.get(`${category}?page=2&gclid=e2eCCC`)
  expect(third.status()).toBe(200)
  expect(third.headers()['last-modified']).toBe(second.headers()['last-modified'])

  const html = await second.text()
  for (const value of ['e2eAAA', 'e2eBBB', 'utm_source', 'utm_campaign']) {
    expect(html, value).not.toContain(value)
  }
})

test('корзина, checkout, заказ и поиск не кешируются', async ({ request }) => {
  for (const path of ['/cart/', '/uk/cart/', '/checkout/', '/CHECKOUT/', '/search/?s=test', '/order-received/1/?key=x']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.headers()['x-html-cache'], path).toBeUndefined()
  }
})

test('метки остаются в адресе браузера после гидрации', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))

  const query = 'page=2&utm_source=e2e&gclid=e2eCCC'
  await page.goto(`${category}?${query}`)
  await expect(page.locator('.c-product').first()).toBeVisible()
  // Роутер переписал бы адрес при старте, после гидрации
  await page.waitForLoadState('networkidle')

  expect(new URL(page.url()).search).toBe(`?${query}`)
  expect(pageErrors).toEqual([])
})

test('заголовки безопасности', async ({ request }) => {
  for (const path of ['/', category, '/cart/']) {
    const headers = (await request.get(path)).headers()
    expect(headers['x-content-type-options'], path).toBe('nosniff')
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin')
    expect(headers['x-frame-options'], path).toBe('SAMEORIGIN')
    expect(headers['content-security-policy'], path).toBe('frame-ancestors \'self\'')
  }
})
