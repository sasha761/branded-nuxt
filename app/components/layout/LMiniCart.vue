<template>
  <div class="l-mini-cart">
    <p class="u-h3" v-if="cartTitle">{{ t('cart') }}</p>
    <span class="l-mini-cart__count" v-if="cartProducts.length">{{ t('items_count', { count: cartProducts.length }) }}</span>
    <div v-if="cartProducts.length">
      <ul class="l-mini-cart__list">
        <li v-for="(product, index) in cartProducts" :key="index" class="l-mini-cart__item">
          <UiCMiniCartItem :product="product" />
        </li>
      </ul>
      <div v-if="totalAmount" class="l-mini-cart__total">
        <span>{{ t('cart_summary.subtotal') }}</span>
        <span class="is-bold">{{ totalAmount }} {{ t('currency') }}</span>
      </div>

      <div class="l-mini-cart__btn" v-if="cartButtons">
        <NuxtLink :to="localePath('/checkout/')" class="u-btn is-black">{{ t('checkout.title') }}</NuxtLink>
        <NuxtLink :to="localePath('/cart/')" class="is-cart">{{ t('to_cart') }}</NuxtLink>
      </div>
    </div>
    <div v-else>
      <p>{{ t('cart_empty') }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cartButtons: { default: false, type: Boolean },
  cartTitle: { default: false, type: Boolean },
  cartProducts: { type: Array },
  totalAmount: { type: Number },
})

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/mini-cart.scss";
</style>
