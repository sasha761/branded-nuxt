export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await wpFetch('page/page', {
    method: 'POST',
    body,
  })
})
