export default defineEventHandler((event) => {
  const query = getQuery(event)

  return wpFetch('archive/get_sidebar', {
    params: {
      lang: wpLang(query.lang),
      slug: wpString(query.slug, 200) || undefined,
    },
  })
})
