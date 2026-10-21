/**
 * Итоги корзины и купон для страниц корзины и checkout.
 * Цены, скидку и наличие считает WP (cart/quote); до ответа — по ценам из корзины.
 */
export function useCartSummary() {
  const { t } = useI18n()
  const cartStore = useCartStore()
  const { quote, status, refresh, applyCoupon, removeCoupon, hasItemErrors } = useCartQuote()

  const couponInput = ref('')
  const couponError = ref('')

  const appliedCoupon = computed(() => (quote.value?.coupon?.valid ? quote.value.coupon.code : ''))

  // Купон, который WP не принял (истёк, не подходит к товарам), из корзины убирается
  function checkCoupon() {
    const coupon = quote.value?.coupon
    if (coupon && !coupon.valid) {
      couponError.value = coupon.message || t('coupon.invalid')
      cartStore.setCoupon('')
    }
  }

  async function submitCoupon() {
    const code = couponInput.value.trim()
    if (!code) return

    couponError.value = ''
    await applyCoupon(code)
    checkCoupon()

    if (appliedCoupon.value) {
      couponInput.value = ''
    }
  }

  async function clearCoupon() {
    couponError.value = ''
    await removeCoupon()
  }

  const summaryItems = computed(() => {
    const currency = t('currency')
    const subtotal = quote.value ? Number(quote.value.subtotal) : cartStore.totalAmount
    const discount = quote.value ? Number(quote.value.discount) : 0
    const total = quote.value ? Number(quote.value.total) : cartStore.totalAmount

    return [
      { label: t('cart_summary.subtotal'), value: `${subtotal} ${currency}`, valueClass: 'c-price' },
      ...(discount > 0
        ? [{ label: t('cart_summary.discount'), value: `−${discount} ${currency}`, valueClass: 'c-price' }]
        : []),
      { label: t('cart_summary.delivery'), value: `0 ${currency}` },
      { label: t('cart_summary.total'), value: `${total} ${currency}` },
    ]
  })

  let timer: ReturnType<typeof setTimeout> | undefined

  function scheduleRefresh() {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      await refresh()
      checkCoupon()
    }, 300)
  }

  onMounted(async () => {
    await refresh()
    checkCoupon()
  })

  watch(() => cartStore.products, scheduleRefresh, { deep: true })

  onBeforeUnmount(() => clearTimeout(timer))

  return {
    quote,
    quoteStatus: status,
    hasItemErrors,
    couponInput,
    couponError,
    appliedCoupon,
    submitCoupon,
    clearCoupon,
    summaryItems,
  }
}
