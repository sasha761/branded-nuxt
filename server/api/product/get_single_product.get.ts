export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await wpFetch('product/get_single_product', { params: query })
})
