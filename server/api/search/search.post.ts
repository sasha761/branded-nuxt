export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await wpFetch('search/search', { method: 'POST', body })
})
