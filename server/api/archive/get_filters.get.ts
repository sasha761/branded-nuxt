export default defineEventHandler((event) => {
  const query = getQuery(event)

  return wpFetch('archive/get_filters', {
    params: {
      lang: wpLang(query.lang),
      slug: wpString(query.slug, 200) || undefined,
      taxonomy: wpString(query.taxonomy, 50) || undefined,
    },
  })
})
