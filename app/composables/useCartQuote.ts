import type { CartQuote } from '~/types/wp-api'

/**
 * Актуальные цены, наличие и купон из WP (POST /api/cart/quote).
 * Корзина в localStorage может хранить устаревшие цены, итог считает WP.
 */
export function useCartQuote() {
  const cartStore = useCartStore()
  const { locale } = useI18n()
  const quote = useState<CartQuote | null>('cart-quote', () => null)
  const status = useState<'idle' | 'pending' | 'error'>('cart-quote-status', () => 'idle')
  // Что уже посчитано: позиции, количества и купон
  const quotedKey = useState('cart-quote-key', () => '')

  async function refresh() {
    const products = cartStore.cartProducts

    if (!products.length) {
      quote.value = null
      quotedKey.value = ''
      status.value = 'idle'
      return
    }

    const key = JSON.stringify([
      products.map(item => [cartLineKey(item), item.quantity]),
      cartStore.cartCoupon,
    ])

    if (key === quotedKey.value && quote.value) {
      return
    }

    quotedKey.value = key
    status.value = 'pending'

    try {
      quote.value = await $fetch<CartQuote>('/api/cart/quote', {
        method: 'POST',
        body: {
          products,
          coupon: cartStore.cartCoupon || undefined,
          lang: locale.value,
        },
      })
      status.value = 'idle'
    } catch (error) {
      console.error(error)
      quotedKey.value = ''
      status.value = 'error'
    }
  }

  async function applyCoupon(code: string) {
    cartStore.setCoupon(code.trim())
    await refresh()
  }

  async function removeCoupon() {
    cartStore.setCoupon('')
    await refresh()
  }

  /** Ошибка позиции корзины по её индексу: out_of_stock, unavailable… */
  function itemError(index: number) {
    return quote.value?.items.find(item => item.index === index)?.error ?? null
  }

  const hasItemErrors = computed(() => Boolean(quote.value?.items.some(item => item.error)))

  return { quote, status, refresh, applyCoupon, removeCoupon, itemError, hasItemErrors }
}
