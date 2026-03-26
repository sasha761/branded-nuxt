export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await wpFetch('reviews/reviews', { method: 'POST', body })
})
