import type { MaybeRefOrGetter } from 'vue'
import type { PageRoute } from '~/types/wp-api'

interface PageSeoOptions {
  // Число страниц архива: для rel="next"
  totalPages?: MaybeRefOrGetter<number | undefined>
}

/**
 * `<head>` страницы из api/route: мета Yoast как на живом сайте, hreflang из alternates,
 * полный граф schema. Хост canonical, og:url и hreflang приводится к siteUrl.
 * На ?page=N canonical указывает на саму страницу, hreflang не выводится (как в WP).
 */
export function usePageSeo(pageRoute: MaybeRefOrGetter<PageRoute | null | undefined>, options: PageSeoOptions = {}) {
  const config = useRuntimeConfig()
  const currentPage = useCurrentPage()
  const alternates = usePageAlternates()
  const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')

  watch(
    () => toValue(pageRoute),
    (info) => {
      // info.path — путь, по которому WP искал объект (тот же, что запросила страница)
      if (info?.path) {
        alternates.value[normalizePath(info.path)] = info.alternates || []
      }
    },
    { immediate: true },
  )

  function absolute(pathOrUrl: string) {
    try {
      const url = new URL(pathOrUrl, `${siteUrl}/`)
      return `${siteUrl}${url.pathname}${url.search}`
    } catch {
      return ''
    }
  }

  function withPage(url: string, page: number) {
    return page > 1 ? `${url}?page=${page}` : url
  }

  useHead(() => {
    const info = toValue(pageRoute)
    const seo = info?.seo

    if (!info || !seo) {
      return {}
    }

    const page = currentPage.value
    const totalPages = Number(toValue(options.totalPages) || 0)
    const baseCanonical = seo.canonical ? absolute(seo.canonical) : ''

    const meta: Record<string, string>[] = []
    const addMeta = (attr: 'name' | 'property', key: string, content: unknown) => {
      if (content !== undefined && content !== null && content !== '') {
        meta.push({ [attr]: key, content: String(content), key })
      }
    }

    addMeta('name', 'description', seo.description)
    addMeta('name', 'robots', seo.robots)
    addMeta('property', 'og:locale', seo.og_locale)
    addMeta('property', 'og:type', seo.og_type)
    addMeta('property', 'og:title', seo.og_title || seo.title)
    addMeta('property', 'og:description', seo.og_description || seo.description)
    addMeta('property', 'og:url', seo.og_url ? absolute(seo.og_url) : baseCanonical)
    addMeta('property', 'og:site_name', seo.og_site_name)
    addMeta('property', 'article:modified_time', seo.article_modified_time)
    addMeta('property', 'og:image', seo.og_image)
    addMeta('property', 'og:image:width', seo.og_image_width)
    addMeta('property', 'og:image:height', seo.og_image_height)
    addMeta('property', 'og:image:type', seo.og_image_type)
    addMeta('name', 'twitter:card', seo.twitter_card)

    const link: Record<string, string>[] = []

    if (baseCanonical) {
      link.push({ rel: 'canonical', href: withPage(baseCanonical, page), key: 'canonical' })

      if (page > 1) {
        link.push({ rel: 'prev', href: withPage(baseCanonical, page - 1), key: 'prev' })
      }

      if (totalPages > page) {
        link.push({ rel: 'next', href: withPage(baseCanonical, page + 1), key: 'next' })
      }
    }

    if (page <= 1) {
      for (const alternate of info.alternates || []) {
        link.push({
          rel: 'alternate',
          hreflang: alternate.lang,
          href: absolute(alternate.path),
          key: `hreflang-${alternate.lang}`,
        })
      }
    }

    return {
      title: seo.title,
      meta,
      link,
      script: seo.schema
        ? [{
            type: 'application/ld+json',
            // `<` экранируется, чтобы текст из WP не мог закрыть тег script
            innerHTML: JSON.stringify(seo.schema).replace(/</g, '\\u003c'),
            key: 'seo-schema',
          }]
        : [],
    }
  })
}

/** Служебные страницы фронта (корзина, checkout, поиск): заголовок и noindex. */
export function useServicePageHead(title: MaybeRefOrGetter<string>, robots = 'noindex, nofollow') {
  useHead(() => ({
    title: toValue(title),
    meta: [{ name: 'robots', content: robots, key: 'robots' }],
  }))
}
