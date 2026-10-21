// Ответы WP REST API (тема news, inc/rest-api-*.php). Подробности: docs/wp-api.md

export type Lang = 'ru' | 'uk'

export interface ImageSize {
  src: string
  width: number
  height: number
}

export interface WpImage {
  id: number
  alt: string
  src: string
  width: number
  height: number
  srcset: string
  // archive_md 420×504, archive_xl 532×665, single_xl 840×1080
  sizes: Partial<Record<'archive_md' | 'archive_xl' | 'single_xl' | 'large', ImageSize>>
}

export interface SizeOption {
  id: number
  name: string
  availability: boolean
}

// Атрибут вариаций товара: pa_size, pa_color… (type 'color' — квадратики цвета из Variation Swatches)
export interface VariationAttribute {
  name: string
  label: string
  type: 'select' | 'color' | 'button' | 'image' | 'radio' | string
  options: { slug: string; name: string; color: string | null }[]
}

export interface ProductVariation {
  id: number
  // слаги атрибутов; '' — «любое»: вариация подходит под любой вариант
  attributes: Record<string, string>
  in_stock: boolean
  price: string
}

// Выбранный атрибут для показа в корзине и заказе
export interface SelectedAttribute {
  name?: string
  label: string
  value: string
}

// Выбор на странице товара: совместим с SizeOption (size_selected) + атрибуты для показа и заказа
export interface SelectedVariation extends SizeOption {
  price?: string
  attributes: SelectedAttribute[]
  // слаги всех атрибутов; WP берёт отсюда значения для атрибутов «любое»
  variation: Record<string, string>
}

export interface ProductShort {
  id: number
  name: string
  path: string
  permalink: string
  price: string
  price_html: string
  is_sale: boolean
  percent: number | false
  is_stock: 'instock' | 'outofstock' | 'onbackorder'
  stockStatus: string
  size_attribute: SizeOption[]
  image: WpImage | null
  gallery?: WpImage[]
  post_img_l: string | false
  post_img_m: string | false
  post_img_xl: string | false
  post_attr_brand: string
  post_brand_path: string
  description: string
  video: unknown
}

export interface ProductComment {
  comment_ID: number
  comment_author: string
  comment_content: string
  comment_date: string
  comment_parent: number
  rating: number
}

export interface ProductSpecs {
  brand: string | null
  brand_path: string | null
  categories: string[]
  sku: string
  stock_status: 'instock' | 'outofstock' | 'onbackorder'
  in_stock: boolean
}

export interface SingleProduct extends ProductShort {
  gallery: WpImage[]
  // у простого товара — пустые массивы
  variation_attributes?: VariationAttribute[]
  variations?: ProductVariation[]
  canonical_path: string
  specs: ProductSpecs
  product_info: Record<string, string> | null
  categories_str: string
  rating: string
  count: number
  comments: ProductComment[]
  related_products: ProductShort[]
}

export interface MenuItem {
  title: string
  url: string
  path: string
  image: { url: string; title: string | null; alt: string | null } | null
  submenu: MenuItem[]
}

export interface Menus {
  header: MenuItem[]
  footer: MenuItem[]
  mobile: { man: MenuItem[]; woman: MenuItem[] }
}

export interface Crumb {
  text: string
  url: string | null
  path: string | null
}

export interface Alternate {
  lang: Lang | 'x-default'
  path: string
  url: string
}

export interface Seo {
  title: string
  description: string
  canonical: string
  robots: string
  og_title: string
  og_description: string
  og_url: string
  og_site_name: string
  og_type: string
  og_locale: string
  og_image: string
  og_image_width: number | null
  og_image_height: number | null
  og_image_type: string | null
  twitter_card: string
  article_modified_time: string | null
  schema: { '@context': string; '@graph': object[] } | null
}

export interface PageRoute {
  type: 'home' | 'product' | 'category' | 'brand' | 'attribute' | 'tag' | 'page'
  object: 'post' | 'term'
  id: number
  post_type?: 'product' | 'page'
  taxonomy?: string
  slug?: string
  default_id?: number
  template?: string
  lang: Lang
  path: string
  canonical_path: string
  redirect: string | null
  alternates: Alternate[]
  seo: Seo | null
  breadcrumbs: Crumb[]
}

export interface ArchiveTerm {
  id: number
  taxonomy: string
  slug: string
  name: string
  description: string
  path: string
}

export interface ArchiveProducts {
  products: ProductShort[]
  products_count: number
  total_pages: number
  page: number
  per_page: number
  term: ArchiveTerm | null
  canonical_path: string | null
  product_cat: { id: number; name: string; parent: string | null; url: string; path: string; description: string } | null
  brand?: { name: string; description: string }
}

export interface QuoteItem {
  index: number
  id: number | null
  product_id: number | null
  variation_id: number | null
  name: string | null
  size: string | null
  attributes?: Required<SelectedAttribute>[]
  quantity: number
  price: number
  line_total: number
  in_stock: boolean
  stock_quantity: number | null
  error: null | 'invalid' | 'invalid_quantity' | 'unavailable' | 'out_of_stock' | 'insufficient_stock'
}

export interface CartQuote {
  items: QuoteItem[]
  subtotal: string
  discount: string
  total: string
  currency: string
  coupon: { code: string; valid: boolean; error: string | null; message: string | null } | null
}
