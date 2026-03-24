export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await wpFetch('home/get_home_info', { params: query })
})
