<template>
  <div class="l-mini-cart">
    <p class="u-h3" v-if="cartTitle">Корзина</p>
    <span class="l-mini-cart__count" v-if="cartProducts.length">{{ cartProducts.length }} товар</span>
    <div v-if="cartProducts.length">
      <ul class="l-mini-cart__list">
        <li v-for="(product, index) in cartProducts" :key="index" class="l-mini-cart__item">
          <UiCMiniCartItem :product="product" v-if="(index == 0) || product.size_selected[0].id != cartProducts[index-1].size_selected[0].id" />
        </li>
      </ul>
      <div v-if="totalAmount" class="l-mini-cart__total">
        <span>Сумма заказа</span>
        <span class="is-bold">{{ totalAmount }}</span>
      </div>

      <div class="l-mini-cart__btn" v-if="cartButtons">
        <NuxtLink :to="localePath('/checkout-2')" class="u-btn is-black">Оформление заказа</NuxtLink>
        <NuxtLink :to="localePath('/cart')" class="is-cart">В корзину</NuxtLink>
      </div>
    </div>
    <div v-else>
      <p>Корзина пуста</p>
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

const localePath = useLocalePath()
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/mini-cart.scss";
</style>