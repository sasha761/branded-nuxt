export default defineEventHandler((event) => {
  const query = getQuery(event)
  return wpFetch('home/get_home_info', { params: { lang: wpLang(query.lang) } })
})
