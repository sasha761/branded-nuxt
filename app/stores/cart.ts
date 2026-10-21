import type { SelectedAttribute, SelectedVariation, SizeOption } from '~/types/wp-api'

export interface CartItem {
  id: number
  name: string
  path: string
  price: string
  quantity: number
  // [вариация] — у простого товара { id: ID товара, name: 'one size' }
  size_selected: SizeOption[]
  // Выбранные атрибуты для показа (размер, цвет); в позициях, добавленных до выбора цвета, их нет
  attributes?: SelectedAttribute[]
  // Слаги атрибутов для заказа: WP берёт отсюда значения для атрибутов вариации «любое»
  variation?: Record<string, string>
  post_img_m: string | false
  post_attr_brand: string
  post_brand_path: string
  categories?: string[]
}

const PRODUCTS_KEY = 'cartProducts'
const COUPON_KEY = 'cartCoupon'

function readStorage(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: string) {
  try {
    if (value) {
      localStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // приватный режим или переполнено
  }
}

/**
 * Позиция корзины: вариация + выбранные значения атрибутов. Одна вариация с «любым» цветом
 * в двух цветах — две позиции.
 */
export function cartLineKey(item: Pick<CartItem, 'id' | 'size_selected' | 'variation'>) {
  return `${item.size_selected?.[0]?.id ?? item.id}|${JSON.stringify(item.variation || {})}`
}

/** Только то, что нужно корзине: без галереи, похожих товаров и отзывов. */
export function toCartItem(product: Record<string, any>, size: SizeOption | SelectedVariation | null | undefined, quantity = 1): CartItem {
  const selected = size?.id
    ? { id: size.id, name: size.name, availability: size.availability }
    : { id: product.id, name: 'one size', availability: true }
  const variation = size && 'variation' in size ? size : null

  return {
    id: product.id,
    name: product.name,
    path: product.path,
    // Цена вариации, если у вариаций разные цены; итог всё равно пересчитывает WP (api/cart/quote)
    price: variation?.price || product.price,
    quantity,
    size_selected: [selected],
    ...(variation ? { attributes: variation.attributes, variation: variation.variation } : {}),
    post_img_m: product.image?.sizes?.archive_md?.src || product.post_img_m || false,
    post_attr_brand: product.post_attr_brand || '',
    post_brand_path: product.post_brand_path || '',
    categories: product.specs?.categories || [],
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    products: [] as CartItem[],
    totalAmount: 0,
    coupon: null as string | null,
  }),

  // Только состояние стора: до hydrate() корзина пустая и на сервере, и на клиенте,
  // иначе разметка гидрации расходится с SSR (атрибуты вроде disabled в prod не исправляются).
  getters: {
    cartProducts(state): CartItem[] {
      return state.products
    },

    cartCoupon(state): string {
      return state.coupon || ''
    },
  },

  actions: {
    /**
     * Корзина из localStorage в состояние стора. Вызывается после гидрации (plugins/cart.client.ts):
     * сервер рендерит пустую корзину, и всё, что от неё зависит, должно перерисоваться на клиенте.
     */
    hydrate() {
      if (!import.meta.client || this.coupon !== null) return

      try {
        const products = JSON.parse(readStorage(PRODUCTS_KEY, '[]'))
        this.products = Array.isArray(products) ? products : []
      } catch {
        this.products = []
      }

      this.coupon = readStorage(COUPON_KEY, '')
      this.setTotalAmount()
    },

    setProductToCart(products: CartItem[]) {
      this.products = products
      if (import.meta.client) {
        writeStorage(PRODUCTS_KEY, products.length ? JSON.stringify(products) : '')
      }
    },

    setTotalAmount() {
      const products = this.cartProducts
      this.totalAmount = products.reduce(
        (acc: number, item: CartItem) => acc + (parseInt(item.price) || 0) * item.quantity,
        0
      )
    },

    addProduct(product: Record<string, any>, size: SizeOption | SelectedVariation | null | undefined, quantity = 1) {
      const item = toCartItem(product, size, quantity)
      const key = cartLineKey(item)
      const products = [...this.cartProducts]
      const index = products.findIndex(existing => cartLineKey(existing) === key)

      if (index !== -1) {
        products[index] = { ...products[index]!, quantity: products[index]!.quantity + quantity }
      } else {
        products.push(item)
      }

      this.setProductToCart(products)
      this.setTotalAmount()
    },

    clear() {
      this.setProductToCart([])
      this.setCoupon('')
      this.setTotalAmount()
    },

    setCoupon(code: string) {
      this.coupon = code
      if (import.meta.client) {
        writeStorage(COUPON_KEY, code)
      }
    },
  },
})
