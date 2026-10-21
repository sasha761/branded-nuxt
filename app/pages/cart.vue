<template>
  <main class="p-cart">
    <div class="u-container">
      <div class="p-cart__flex">
        <ClientOnly>
          <LayoutLCart
            :title="t('cart')"
            :show-empty="true"
            :quote="quote"
          />

          <LayoutLSidebarCart
            v-if="cartStore.cartProducts.length"
            v-model:coupon-code="couponInput"
            coupon-input-id="cart_coupon_code"
            :applied-coupon="appliedCoupon"
            :coupon-error="couponError"
            :coupon-disabled="quoteStatus === 'pending'"
            :summary-items="summaryItems"
            :checkout-link="localePath('/checkout/')"
            :checkout-label="t('checkout.go')"
            @submit-coupon="submitCoupon"
            @remove-coupon="clearCoupon"
          />
        </ClientOnly>
      </div>
    </div>
  </main>
</template>

<script setup>
const localePath = useLocalePath()
const { t } = useI18n()
const cartStore = useCartStore()

useServicePageHead(() => t('cart'))

const {
  quote,
  quoteStatus,
  couponInput,
  couponError,
  appliedCoupon,
  submitCoupon,
  clearCoupon,
  summaryItems,
} = useCartSummary()
</script>

<style lang="scss">
  @import "~/assets/scss/page/cart.scss";
</style>
