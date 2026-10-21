/**
 * Карты сайта Yoast отдаёт WordPress. На VPS их проксирует nginx (раздел 5.1 плана),
 * этот обработчик нужен для dev и как запасной путь.
 */
const WP_FILES = /^\/(?:sitemap_index\.xml|[a-z0-9_-]+-sitemap\d*\.xml|main-sitemap\.xsl)$/

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  if (!WP_FILES.test(path)) {
    return
  }

  const { wpSiteUrl } = useRuntimeConfig()
  return proxyRequest(event, `${wpSiteUrl}${path}`)
})
