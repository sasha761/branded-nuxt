/**
 * GTM и Facebook Pixel, как в base.twig темы WP. ID задаются только на проде
 * (NUXT_PUBLIC_GTM_ID, NUXT_PUBLIC_FB_PIXEL_ID), чтобы dev-трафик не попадал в отчёты.
 *
 * Переходы внутри SPA не перезагружают страницу, поэтому:
 * - пиксель получает PageView на каждый переход;
 * - в dataLayer уходит событие `virtual_page_view` — в GTM на него нужен триггер
 *   (или встроенный триггер «History Change») для тегов просмотра страницы.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { gtmId, fbPixelId } = useRuntimeConfig().public
  const gtm = /^GTM-[A-Z0-9]+$/.test(String(gtmId)) ? String(gtmId) : ''
  const pixel = /^\d+$/.test(String(fbPixelId)) ? String(fbPixelId) : ''

  if (!gtm && !pixel) {
    return
  }

  const script = []
  const noscript = []

  if (gtm) {
    script.push({
      key: 'gtm',
      innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
    })
    noscript.push({
      key: 'gtm-noscript',
      tagPosition: 'bodyOpen',
      innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
    })
  }

  if (pixel) {
    script.push({
      key: 'fb-pixel',
      innerHTML: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`,
    })
    noscript.push({
      key: 'fb-pixel-noscript',
      tagPosition: 'bodyOpen',
      innerHTML: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1">`,
    })
  }

  useHead({ script, noscript })

  if (import.meta.server) {
    return
  }

  // Первый просмотр уже учтён скриптами выше
  let isInitialPage = true

  nuxtApp.hook('page:finish', () => {
    if (isInitialPage) {
      isInitialPage = false
      return
    }

    const w = window as any

    if (pixel) {
      w.fbq?.('track', 'PageView')
    }

    if (gtm) {
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push({
        event: 'virtual_page_view',
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      })
    }
  })
})
