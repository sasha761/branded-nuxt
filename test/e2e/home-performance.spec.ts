import { expect, test } from '@playwright/test'
import type Swiper from 'swiper'

type CarouselElement = HTMLElement & { swiper: Swiper }
const carouselSelectors = ['.l-products-row .swiper', '.l-brand .swiper', '.l-outlet .swiper']

for (const width of [390, 1440]) {
  test(`${width}px: размеры первого экрана сохраняются при задержанной загрузке изображений`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    let released = false
    await page.route('**/*', async route => {
      if (route.request().resourceType() === 'image' && !released) await gate
      await route.continue()
    })
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('.l-hero .swiper')).toHaveClass(/swiper-initialized/)
      await page.evaluate(() => document.fonts.ready)
      const geometry = () => page.evaluate(() => {
        const rect = (selector: string) => {
          const box = document.querySelector(selector)!.getBoundingClientRect()
          return { top: box.top + scrollY, height: box.height }
        }
        return { hero: rect('.l-hero'), accessory: rect('.l-accessory'), offers: rect('.l-products-row') }
      })
      const before = await geometry()
      const backgroundUrl = await page.locator('.l-products-row > img').getAttribute('src')
      released = true
      release()
      const images = page.locator('.l-hero .swiper-slide:first-child img, .l-hero__row-banners img, .l-accessory__bg > img')
      await expect.poll(() => images.evaluateAll(elements => elements
        .filter(image => image.getClientRects().length > 0)
        .every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
      const after = await geometry()
      for (const key of ['hero', 'accessory', 'offers'] as const) {
        expect(Math.abs(after[key].top - before[key].top), `${key}: top`).toBeLessThan(2)
        expect(Math.abs(after[key].height - before[key].height), `${key}: height`).toBeLessThan(2)
      }
      for (const image of await page.locator('.l-hero .swiper-slide:first-child img, .l-hero__row-banners img').all()) {
        const natural = await image.evaluate(element => ({ width: (element as HTMLImageElement).naturalWidth, height: (element as HTMLImageElement).naturalHeight }))
        expect(Number(await image.getAttribute('width'))).toBe(natural.width)
        expect(Number(await image.getAttribute('height'))).toBe(natural.height)
      }
      const resourceCount = await page.evaluate(url => performance.getEntriesByType('resource')
        .filter(entry => entry.name === new URL(url!, location.href).href).length, backgroundUrl)
      expect(resourceCount).toBe(1)
      await page.screenshot({ path: `.data/home-first-screen-${width}.png` })
    } finally {
      released = true
      release()
    }
  })

  test(`${width}px: autoplay и дальние фото работают только при просмотре карусели`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 600 })
    await page.goto('/')
    for (const selector of carouselSelectors) await expect(page.locator(selector)).toHaveClass(/swiper-initialized/)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    for (const selector of carouselSelectors) {
      const slider = page.locator(selector)
      const running = () => slider.evaluate(element => (element as CarouselElement).swiper.autoplay.running)
      await expect.poll(running).toBe(false)
      const lastImage = slider.locator('.swiper-slide img').last()
      expect(await lastImage.getAttribute('src')).toBeNull()
      await slider.evaluate(element => {
        const swiper = (element as CarouselElement).swiper
        if (typeof swiper.params.autoplay === 'object') swiper.params.autoplay.delay = 150
        swiper.params.speed = 50
      })
      await slider.scrollIntoViewIfNeeded()
      await expect.poll(running).toBe(true)
      const reservedHeight = (await slider.boundingBox())!.height
      await expect(lastImage).toHaveAttribute('src', /.+/)
      await expect.poll(async () => Math.abs((await slider.boundingBox())!.height - reservedHeight), 'высота не меняется при подключении дальних фото').toBeLessThan(2)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expect.poll(running).toBe(false)
      const active = await slider.evaluate(element => (element as CarouselElement).swiper.activeIndex)
      await page.waitForTimeout(350)
      expect(await slider.evaluate(element => (element as CarouselElement).swiper.activeIndex)).toBe(active)
      await slider.scrollIntoViewIfNeeded()
      await expect.poll(running).toBe(true)
      // Сохраняем disableOnInteraction: ручное переключение не отменяется новым входом в viewport.
      await slider.evaluate(element => {
        const swiper = (element as CarouselElement).swiper
        swiper.slideTo(swiper.activeIndex === 0 ? 1 : 0, 50)
      })
      await expect.poll(running).toBe(false)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await slider.scrollIntoViewIfNeeded()
      await expect.poll(running).toBe(false)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    }
    expect(errors).toEqual([])
  })
}
