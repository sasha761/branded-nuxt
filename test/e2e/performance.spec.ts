import { expect, test } from '@playwright/test'
import { parse } from 'node-html-parser'

// Только GET: проверяем production SSR на реальных данных WP без изменения корзины/заказов.
test('lazy-load, вариативные шрифты и критический CSS в SSR', async ({ request }) => {
  const homeResponse = await request.get('/')
  expect(homeResponse.status()).toBe(200)
  const home = parse(await homeResponse.text())
  const category = home.querySelector('a[href^="/product-category/"]')?.getAttribute('href')
  expect(category).toBeTruthy()

  const archiveResponse = await request.get(category!)
  expect(archiveResponse.status()).toBe(200)
  const archive = parse(await archiveResponse.text())
  const product = archive.querySelector('.c-product a')?.getAttribute('href')
  expect(product).toBeTruthy()

  const productResponse = await request.get(product!)
  expect(productResponse.status()).toBe(200)
  const detail = parse(await productResponse.text())

  for (const document of [home, archive, detail]) {
    const images = document.querySelectorAll('img')
    expect(images.length).toBeGreaterThan(0)
    for (const image of images) {
      expect(['lazy', 'eager'], image.outerHTML).toContain(image.getAttribute('loading'))
    }

    const fontPreloads = document.querySelectorAll('link[rel="preload"][as="font"]')
    expect(fontPreloads).toHaveLength(2)
    for (const preload of fontPreloads) {
      expect(preload.getAttribute('href')).toMatch(/montserrat-(latin|cyrillic)-wght-normal.*\.woff2$/)
      expect(preload.getAttribute('crossorigin')).toBe('anonymous')
    }
    const inlineCss = document.querySelectorAll('style').map(style => style.innerHTML).join('\n')
    expect(inlineCss).toContain('font-weight:100 900')
    expect(inlineCss).toContain('.c-page-loader')
    expect(inlineCss).toContain('.loader-outter')
    expect(document.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  }

  expect(home.querySelector('.l-hero img')?.getAttribute('loading')).toBe('eager')
  expect(home.querySelector('.l-branded__img')?.getAttribute('loading')).toBe('lazy')
  for (const image of home.querySelectorAll('.l-accessory img, .l-outlet img, .l-branded img, .l-products-row img')) {
    expect(image.getAttribute('loading'), image.outerHTML).toBe('lazy')
  }
  const cards = archive.querySelectorAll('.c-product img')
  expect(cards.length).toBeGreaterThan(4)
  expect(cards[0]?.getAttribute('fetchpriority')).toBe('high')
  expect(cards.slice(0, 4).every(image => image.getAttribute('loading') === 'eager')).toBe(true)
  expect(cards.slice(4).every(image => image.getAttribute('loading') === 'lazy')).toBe(true)
  expect(detail.querySelector('.l-product__slider img')?.getAttribute('loading')).toBe('eager')
  expect(detail.querySelectorAll('.l-product__slide-extra img').every(image => image.getAttribute('loading') === 'lazy')).toBe(true)
})

test('lazy-изображения отображаются после прокрутки, каталог работает на мобильном', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.l-hero img').first()).toBeVisible()

  const background = page.locator('.l-branded__img')
  expect((await background.boundingBox())!.y).toBeGreaterThan(2400)
  // Браузер сам выбирает расстояние предварительной загрузки в зависимости от сети.
  expect(await background.getAttribute('loading')).toBe('lazy')
  await background.scrollIntoViewIfNeeded()
  await expect.poll(() => background.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await page.locator('.l-branded').screenshot({ path: '.data/performance-branded-desktop.png' })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/product-category/women/')
  const firstCard = page.locator('.c-product img').first()
  await expect(firstCard).toBeVisible()
  await expect.poll(() => firstCard.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: '.data/performance-catalog-mobile.png' })
  expect(await page.evaluate(() => document.fonts.check('400 16px Montserrat', 'ЖіЇ'))).toBe(true)
  expect(errors).toEqual([])
})
