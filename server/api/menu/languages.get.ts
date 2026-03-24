export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await wpFetch('menu/languages', { params: query })
})
