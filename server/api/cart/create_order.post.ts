export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await wpFetch('cart/create_order', {
    method: 'POST',
    body,
  })
})
