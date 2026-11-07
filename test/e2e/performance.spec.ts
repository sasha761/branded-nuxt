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
  const banners = home.querySelectorAll('.l-hero .swiper-wrapper img')
  expect(banners.length).toBeGreaterThan(1)
  expect(banners[0]?.getAttribute('src')).toBeTruthy()
  for (const banner of banners.slice(1)) {
    expect(banner.hasAttribute('src')).toBe(false)
    expect(banner.getAttribute('data-src')).toBeTruthy()
    expect(banner.getAttribute('loading')).toBe('lazy')
  }
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

for (const width of [390, 1440]) {
  test(`слайдер ${width}px: не скачивает скрытые баннеры до переключения`, async ({ page, request }) => {
    const homeResponse = await request.get('/')
    expect(homeResponse.status()).toBe(200)
    const html = parse(await homeResponse.text())
    const bannerUrls = html.querySelectorAll('.l-hero .swiper-wrapper img')
      .map(image => new URL(image.getAttribute('src') || image.getAttribute('data-src')!, homeResponse.url()).href)
    expect(bannerUrls.length).toBeGreaterThan(2)
    expect(new Set(bannerUrls).size).toBe(bannerUrls.length)

    // Перехватываем только баннеры: проверяем реальные запросы браузера без зависимости от CDN.
    const requested: string[] = []
    await page.route(url => bannerUrls.includes(url.href), async (route) => {
      requested.push(route.request().url())
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="616"/>',
      })
    })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const slider = page.locator('.l-hero .swiper')
    await expect(slider).toHaveClass(/swiper-initialized/)
    await page.evaluate(() => document.fonts.ready)
    expect(requested).toEqual([bannerUrls[0]])

    // Реальный жест мышью проверяет обработку slideChange, а не только атрибут loading.
    const box = (await slider.boundingBox())!
    const firstImageBox = (await slider.locator('img').first().boundingBox())!
    expect(Math.abs(box.height - firstImageBox.height), 'скрытые баннеры не растягивают слайдер').toBeLessThan(8)
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 12 })
    await page.mouse.up()
    const images = slider.locator('img')
    await expect(images.nth(1)).toHaveAttribute('src', bannerUrls[1]!)
    await expect.poll(() => [...requested]).toEqual(bannerUrls.slice(0, 2))
    await expect.poll(() => images.nth(1).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)

    // Прямой переход к последнему слайду не должен скачивать пропущенные баннеры.
    await slider.evaluate((element, index) => {
      const swiper = (element as HTMLElement & { swiper: { slideTo: (index: number, speed: number) => void } }).swiper
      swiper.slideTo(index, 0)
    }, bannerUrls.length - 1)
    await expect(images.last()).toHaveAttribute('src', bannerUrls.at(-1)!)
    await expect.poll(() => [...requested]).toEqual([bannerUrls[0], bannerUrls[1], bannerUrls.at(-1)])

    await slider.evaluate((element) => {
      const swiper = (element as HTMLElement & { swiper: { slideTo: (index: number, speed: number) => void } }).swiper
      swiper.slideTo(0, 0)
    })
    await expect(slider.locator('.swiper-slide-active img')).toHaveAttribute('src', bannerUrls[0]!)
    expect(requested).toHaveLength(3)
    expect(errors).toEqual([])
  })
}
