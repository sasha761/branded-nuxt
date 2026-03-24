<template>
  <div class="l-mini-cart">
        
    <p class="u-h3" v-if="cartTitle">Корзина</p>
    <span class="l-mini-cart__count" v-if="cartProducts.length">{{cartProducts.length}} товар</span>
    <div v-if="cartProducts">
      <ul class="l-mini-cart__list">
        <li v-for="(product, index) in cartProducts" :key="index" class="l-mini-cart__item">
          <C-MiniCart-item :product="product" v-if="(index == 0) || product.size_selected[0].id != cartProducts[index-1].size_selected[0].id" />
        </li>
      </ul>
      <div v-if="totalAmount" class="l-mini-cart__total">
        <span>Сумма заказа</span>
        <span class="is-bold">{{totalAmount}}</span>
      </div>

      <div class="l-mini-cart__btn" v-if="cartButtons">
        <router-link :to="{
          name: 'checkout', 
          params: { 
            lang: stripLang(checkoutUrl) || null,
            checkout: stripSlug(checkoutUrl) 
          } 
        }" 
        class="u-btn is-black">Оформление заказа</router-link>
        <router-link :to="{
          name: 'cart', 
          params: { 
            lang: stripLang(cartUrl) || null,
            cart: stripSlug(cartUrl)
          } 
        }" 
        class="is-cart">В корзину</router-link>
      </div>
    </div>
    <div v-else>
      <p>Корзина пуста</p>
    </div>
  </div>
</template>

<script>
import { stripSlug, stripLang } from '@/assets/js/utils.js';

import CMiniCartItem from '@/templates/components/C-MiniCart-item.vue'

export default {
  components: {
    CMiniCartItem
  },
  props: {
    cartButtons: {
      default: false,
      type: Boolean
    },
    cartTitle: {
      default: false,
      type: Boolean
    },
    cartProducts: {
      type: Array 
    },
    totalAmount: {
      type: Number
    },
    cartUrl: {
      type: String
    },
    checkoutUrl: {
      type: String
    }
  },

  methods: {
    stripSlug, 
    stripLang
  }
}
</script>
