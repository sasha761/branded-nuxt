import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`${width}px: нижние картинки ждут приближения на 200px`, async ({ page }) => {
    const requested: string[] = []
    const errors: string[] = []
    page.on('request', request => { if (request.resourceType() === 'image') requested.push(request.url()) })
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /hydration/i.test(message.text())) errors.push(message.text()) })
    await page.setViewportSize({ width, height: 600 })
    await page.goto('/')
    await expect(page.locator('.l-hero .swiper')).toHaveClass(/swiper-initialized/)
    for (const selector of ['.l-products-row .swiper', '.l-brand .swiper', '.l-outlet .swiper']) {
      await expect(page.locator(selector)).toHaveClass(/swiper-initialized/)
    }
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('networkidle')

    // Эти картинки находятся далеко от первого экрана и не должны иметь URL запроса.
    const early = await page.locator('.l-brand img, .l-outlet img, .l-branded img, .l-subs img').evaluateAll(images => images
      .filter(image => image.getClientRects().length && image.getBoundingClientRect().top > innerHeight + 700)
      .filter(image => image.hasAttribute('src'))
      .map(image => image.getAttribute('src')))
    expect(early).toEqual([])

    const image = page.locator('.l-subs > img')
    const src = await image.getAttribute('data-src')
    expect(src).toBeTruthy()
    const url = new URL(src!, page.url()).href
    const top = await image.evaluate(element => element.getBoundingClientRect().top + scrollY)
    expect(requested).not.toContain(url)
    expect(await image.getAttribute('src')).toBeNull()

    await page.evaluate(y => window.scrollTo(0, y), top - 600 - 200 - 1000)
    await page.waitForLoadState('networkidle')
    const settledTop = await image.evaluate(element => element.getBoundingClientRect().top + scrollY)
    await page.evaluate(y => window.scrollTo(0, y), settledTop - 600 - 200 - 80)
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const distance = await image.evaluate(element => element.getBoundingClientRect().top - innerHeight)
    expect(distance).toBeGreaterThan(200)
    expect(await image.getAttribute('src')).toBeNull()
    expect(requested).not.toContain(url)

    const currentTop = await image.evaluate(element => element.getBoundingClientRect().top + scrollY)
    await page.evaluate(y => window.scrollTo(0, y), currentTop - 600 - 200 + 20)
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).src)).toBe(url)
    await expect.poll(() => requested.filter(value => value === url).length).toBe(1)
    expect((await image.boundingBox())!.y, 'загрузка начинается до появления на экране').toBeGreaterThanOrEqual(600)
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)

    await page.evaluate(() => window.scrollTo(0, 0))
    expect(requested.filter(value => value === url)).toHaveLength(1)
    expect(errors).toEqual([])
  })
}
