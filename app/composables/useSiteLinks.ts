import type { Lang } from '~/types/wp-api'

/**
 * Пути WP-страниц, на которые ссылается вёрстка. uk-слаги другие
 * (/uk/vidguky/, а не /uk/reviews/), заменой префикса их не получить.
 * Проверить: GET /wp-json/api/route?path=… → alternates.
 */
const SITE_LINKS = {
  delivery: { ru: '/dostavka-i-oplata/', uk: '/uk/dostavka-ta-oplata/' },
  returns: { ru: '/vozvrat-i-obmen/', uk: '/uk/povernennya-ta-obmin/' },
  warranty: { ru: '/garantiya/', uk: '/uk/garantiya/' },
  reviews: { ru: '/reviews/', uk: '/uk/vidguky/' },
  about: { ru: '/about-us/', uk: '/uk/pro-nas/' },
  sales: { ru: '/sales/', uk: '/uk/sales/' },
  accessories: { ru: '/product-category/accessories/', uk: '/uk/product-category/aksesuari/' },
  brandWearme: { ru: '/brand/wearme/', uk: '/uk/brand/wearme-uk/' },
  brandBeom: { ru: '/brand/be-om/', uk: '/uk/brand/be-om-uk/' },
} satisfies Record<string, Record<Lang, string>>

export type SiteLink = keyof typeof SITE_LINKS

export function useSiteLink() {
  const { locale } = useI18n()
  return (name: SiteLink) => SITE_LINKS[name][locale.value as Lang] ?? SITE_LINKS[name].ru
}
