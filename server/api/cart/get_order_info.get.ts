export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await wpFetch('cart/get_order_info', { params: query })
})
