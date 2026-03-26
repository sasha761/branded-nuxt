<template>
  <main class="p-cart">
    <div class="u-container">
      <div class="p-cart__flex">
        <LayoutLCart
          :title="$t('cart')"
          :show-empty="true"
        />

        <LayoutLSidebarCart
          v-model:coupon-code="couponCode"
          coupon-input-id="cart_coupon_code"
          :summary-items="summaryItems"
          :checkout-link="localePath('/checkout')"
          checkout-label="Оформить заказ"
          @submit-coupon="submitCoupon"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
const localePath = useLocalePath()
const { t } = useI18n()
const cartStore = useCartStore()

const couponCode = ref('')

const summaryItems = computed(() => [
  {
    label: 'Сумма заказа',
    value: `${cartStore.totalAmount} ${t('currency')}`,
    valueClass: 'c-price',
  },
  {
    label: 'Доставка',
    value: `0 ${t('currency')}`,
    valueClass: 'c-price',
  },
  {
    label: 'Всего',
    value: `${cartStore.totalAmount} ${t('currency')}`,
  },
])

function submitCoupon() {}
</script>

<style lang="scss">
  @import "~/assets/scss/page/cart.scss";
</style>
