type SeoResponse = {
  title?: string
  description?: string
  canonical?: string
  schema?: unknown
  og_title?: string
  og_description?: string
  og_image?: string
  og_locale?: string
  og_type?: string
  og_site_name?: string
  og_url?: string
  og_image_width?: number | string
  og_image_height?: number | string
  og_image_type?: string
  twitter_card?: string
}

export function useSeo(data: Ref<SeoResponse | null>) {
  useHead(() => {
    const seo = data.value

    if (!seo) {
      return {}
    }

    const meta = []

    if (seo.description) {
      meta.push({ name: 'description', content: seo.description, key: 'description' })
    }

    if (seo.og_title || seo.title) {
      meta.push({ property: 'og:title', content: seo.og_title || seo.title, key: 'og:title' })
    }

    if (seo.og_description || seo.description) {
      meta.push({
        property: 'og:description',
        content: seo.og_description || seo.description,
        key: 'og:description',
      })
    }

    if (seo.og_image) {
      meta.push({ property: 'og:image', content: seo.og_image, key: 'og:image' })
    }

    if (seo.og_locale) {
      meta.push({ property: 'og:locale', content: seo.og_locale, key: 'og:locale' })
    }

    if (seo.og_type) {
      meta.push({ property: 'og:type', content: seo.og_type, key: 'og:type' })
    }

    if (seo.og_site_name) {
      meta.push({ property: 'og:site_name', content: seo.og_site_name, key: 'og:site_name' })
    }

    if (seo.og_url || seo.canonical) {
      meta.push({ property: 'og:url', content: seo.og_url || seo.canonical, key: 'og:url' })
    }

    if (seo.og_image_width !== undefined && seo.og_image_width !== null) {
      meta.push({
        property: 'og:image:width',
        content: String(seo.og_image_width),
        key: 'og:image:width',
      })
    }

    if (seo.og_image_height !== undefined && seo.og_image_height !== null) {
      meta.push({
        property: 'og:image:height',
        content: String(seo.og_image_height),
        key: 'og:image:height',
      })
    }

    if (seo.og_image_type) {
      meta.push({
        property: 'og:image:type',
        content: seo.og_image_type,
        key: 'og:image:type',
      })
    }

    if (seo.twitter_card) {
      meta.push({
        name: 'twitter:card',
        content: seo.twitter_card,
        key: 'twitter:card',
      })
    }

    return {
      title: seo.title,
      meta,
      link: seo.canonical
        ? [{ rel: 'canonical', href: seo.canonical, key: 'canonical' }]
        : [],
      script: seo.schema
        ? [{
            type: 'application/ld+json',
            innerHTML: JSON.stringify(seo.schema),
            key: 'seo-schema',
          }]
        : [],
    }
  })
}
