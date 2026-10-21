export default defineEventHandler((event) => {
  const query = getQuery(event)
  const orderId = wpInt(query.order_id, 1, Number.MAX_SAFE_INTEGER)
  const key = wpString(query.key, 64)

  // Без ключа заказа WP отвечает 400, с чужим — 404.
  if (!orderId || !key) {
    throw createError({ statusCode: 404, statusMessage: 'order_not_found' })
  }

  return wpFetch('cart/get_order_info', {
    params: { order_id: orderId, key, lang: wpLang(query.lang) },
  })
})
