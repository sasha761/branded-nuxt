export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await wpFetch('seo/get_seo', { method: 'POST', body })
})
