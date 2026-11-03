/**
 * Постоянные редиректы со старых URL WordPress и на канонический вид URL.
 * Правила — в server/utils/redirects.ts (redirectTarget).
 * Редиректы, для которых нужно знать объект (слаг другого языка, лишние родители, /shop/),
 * делают страницы по полю `redirect` из api/route.
 */
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    return
  }

  const url = getRequestURL(event)
  const target = redirectTarget(url.pathname, url.search)

  if (target) {
    return sendRedirect(event, target, 301)
  }
})
