export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return wpFetch<string>('cart/create_order', {
    method: 'POST',
    headers: wpClientHeaders(event),
    body: {
      products: cartProducts(body?.products),
      firstName: wpString(body?.firstName, 100),
      lastName: wpString(body?.lastName, 100),
      phone: wpString(body?.phone, 30),
      email: wpString(body?.email, 200),
      city: wpString(body?.city, 200),
      address: wpString(body?.address, 300),
      comments: wpString(body?.comments, 2000),
      payment_method: wpString(body?.payment_method, 20) || undefined,
      coupon: wpString(body?.coupon, 100) || undefined,
      lang: wpLang(body?.lang),
      // Поле-ловушка для ботов: передаём как есть, WP отклонит заполненное.
      website: wpString(body?.website, 200),
    },
  })
})
