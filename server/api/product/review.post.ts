export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return wpFetch('product/review', {
    method: 'POST',
    headers: wpClientHeaders(event),
    body: {
      id: wpInt(body?.id, 1, Number.MAX_SAFE_INTEGER),
      author: wpString(body?.author, 100),
      email: wpString(body?.email, 200),
      rating: wpInt(body?.rating, 0, 5),
      content: wpString(body?.content, 2000),
      website: wpString(body?.website, 200),
    },
  })
})
