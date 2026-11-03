import { expect, test, type Page } from '@playwright/test'

/** Первый товар, который можно купить: в архиве бывают распроданные. */
async function openBuyableProduct(page: Page) {
  const archive = page.url()
  const links = await page.locator('.c-product a[href*="/product/"]').evaluateAll(
    anchors => [...new Set(anchors.map(anchor => anchor.getAttribute('href')))].slice(0, 5),
  )

  for (const href of links) {
    await page.goto(href!)
    if (await page.locator('.c-product-form__btn .u-btn.is-black').isVisible()) {
      return
    }
  }

  throw new Error(`В ${archive} среди первых ${links.length} товаров нет доступного для покупки`)
}

test('главная → категория → фильтр → товар → корзина → checkout с ошибкой поля', async ({ page }) => {
  const pageErrors: string[] = []
  const orderRequests: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('/api/cart/create_order')) {
      orderRequests.push(request.url())
    }
  })

  await page.goto('/')
  await expect(page.locator('h1').first()).toBeAttached()

  // Категория из меню шапки (клиентский переход)
  const categoryLink = page.locator('header a[href*="/product-category/"]').first()
  const categoryPath = await categoryLink.getAttribute('href')
  await categoryLink.click()
  await page.waitForURL(`**${categoryPath}`)
  await expect(page.locator('.c-product').first()).toBeVisible()
  // Подменю шапки открывается по hover и после клика остаётся над страницей, пока курсор на нём
  await page.mouse.move(10, 600)

  // Фильтр: первый вариант первого атрибута → параметр в адресе, товары на месте
  await page.locator('.l-filter-block__desktop-filters .v-select').first().click()
  await page.locator('.vs__dropdown-option').first().click()
  await page.waitForURL(/\?\w+=/)
  await expect(page.locator('.c-product').first()).toBeVisible()

  await openBuyableProduct(page)
  await expect(page.locator('h1.l-product__name')).toBeVisible()

  // Цвет (если есть) и размер
  const color = page.locator('.c-product-form__color:not([disabled])').last()
  if (await color.count()) {
    await color.click()
    await expect(color).toHaveClass(/is-active/)
  }

  const sizeSelect = page.locator('.c-product-form .v-select').first()
  if (await sizeSelect.count()) {
    await sizeSelect.click()
    await page.locator('.vs__dropdown-option:not(.vs__dropdown-option--disabled)').first().click()
  }

  await page.locator('.c-product-form__btn .u-btn.is-black').click()

  // Корзина после полной перезагрузки: позиция из localStorage, цены из api/cart/quote
  const quote = page.waitForResponse(response => response.url().includes('/api/cart/quote'))
  await page.goto('/cart/')
  expect((await quote).ok()).toBe(true)
  await expect(page.locator('.c-product-cart')).toHaveCount(1)

  // Та же ссылка есть в скрытой мини-корзине шапки
  await page.locator('a[href$="/checkout/"]').filter({ visible: true }).first().click()
  await page.waitForURL('**/checkout/')

  await page.fill('input[name="billing_first_name"]', 'Тест')
  await page.fill('input[name="billing_last_name"]', 'Тестов')
  await page.fill('input[name="billing_address_1"]', 'ул. Тестовая, 1')
  await page.fill('input[name="billing_city"]', 'Киев')
  await page.fill('input[name="billing_phone"]', '123')
  await page.fill('input[name="billing_email"]', 'test@example.com')

  const submit = page.locator('button[type="submit"].alt')
  await expect(submit).toBeEnabled()
  await submit.click()

  // Ошибка у телефона, заказ не отправлен
  await expect(page.locator('input[name="billing_phone"] ~ .error-msg')).toBeVisible()
  await expect(page.locator('input[name="billing_phone"]')).toHaveClass(/invalid/)
  await page.waitForTimeout(1000)
  expect(orderRequests).toEqual([])
  expect(pageErrors).toEqual([])
})
