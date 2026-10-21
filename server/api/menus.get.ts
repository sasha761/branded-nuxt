// Шапка, подвал и мобильное меню одним запросом.
export default defineEventHandler((event) => {
  const query = getQuery(event)
  return wpFetch('menus', { params: { lang: wpLang(query.lang) } })
})
