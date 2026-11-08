export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const home = await wpFetch('home/get_home_info', { params: { lang: wpLang(query.lang) } })
  const group = home?.banners_group
  const images = [...(group?.banners || []), ...(home?.accesories || [])]
  await Promise.all([
    ...images.map(async item => {
      item.image_dimensions = await getUploadImageDimensions(item.img)
    }),
    ...['small_banner_1', 'small_banner_2'].map(async key => {
      if (group) group[`${key}_dimensions`] = await getUploadImageDimensions(group[key])
    }),
  ])
  return home
})
