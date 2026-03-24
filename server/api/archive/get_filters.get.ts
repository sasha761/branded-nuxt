export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await wpFetch('archive/get_filters', { params: query })
})
