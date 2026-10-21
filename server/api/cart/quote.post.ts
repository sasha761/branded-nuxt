// Пересчёт корзины по ценам и остаткам WP, с купоном. Заказ не создаётся.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return wpFetch('cart/quote', {
    method: 'POST',
    body: {
      products: cartProducts(body?.products),
      coupon: wpString(body?.coupon, 100) || undefined,
      lang: wpLang(body?.lang),
    },
  })
})
