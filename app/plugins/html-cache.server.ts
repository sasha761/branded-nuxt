/**
 * Страница из кеша HTML отрисована по адресу без меток рекламы (server/plugins/html-cache.ts).
 * Nuxt кладёт адрес рендера в payload.path. Если он не совпадает с адресом в браузере (а с query
 * не совпадает никогда), клиентский роутер стартует с адреса рендера и переписывает строку адреса
 * через history.replaceState. Тогда gclid и utm_* пропали бы до того, как их прочитают GA и пиксель.
 *
 * Оставляем в payload.path только путь: при том же пути роутер берёт полный адрес из браузера,
 * с метками и теми же параметрами каталога, по которым отрисован HTML.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const context = useRequestEvent()?.context as { htmlCache?: unknown } | undefined

  if (context?.htmlCache && nuxtApp.payload.path) {
    nuxtApp.payload.path = nuxtApp.payload.path.split('?')[0]
  }
})
