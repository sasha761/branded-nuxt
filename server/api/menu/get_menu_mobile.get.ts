export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await wpFetch('menu/get_menu_mobile', { params: query })
})
