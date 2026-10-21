export default defineEventHandler((event) => {
  const query = getQuery(event)

  return wpFetch('reviews/reviews', {
    params: {
      lang: wpLang(query.lang),
      page: wpInt(query.page),
      per_page: wpInt(query.per_page, 1, 48),
    },
  })
})
