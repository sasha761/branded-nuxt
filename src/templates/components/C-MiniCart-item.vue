<template>
  <div class="c-minicart-product">
    <div class="c-minicart-product__img">
      <router-link
        :to="{
          name: 'product',
          params: {
            lang: stripLang(product.permalink) || null,
            productName: stripSlug(product.permalink),
            productData: product,
          },
        }"
      >
        <img :src="product.post_img_m"> 
      </router-link>
    </div>

    <div class="c-minicart-product__info">
      <div v-if="product.post_attr_brand" class="is-brand">{{product.post_attr_brand}}</div>
      <router-link
        :to="{
          name: 'product',
          params: {
            lang: stripLang(product.permalink) || null,
            productName: stripSlug(product.permalink),
            productData: product,
          },
        }"
        class="is-name"
      >
        {{product.name}}
      </router-link>
      <p class="is-quantity" v-if="product.quantity >= 2">Количество: <b>{{product.quantity}}</b></p>

      <div class="c-minicart-product__attr">
        <div v-if="product.size_selected" class="is-size">
          <span>Размер: </span>
          <span class="is-bold">{{product.size_selected[0].name}}</span>
        </div>
      </div>

      <p class="c-price">
        {{ product.price }}
      </p>

    </div>
  </div>
</template>

<script>
import { stripSlug, stripLang } from '@/assets/js/utils.js';

export default {
  props: {
    product: {
      type: Object,
    },
  },

  methods: {
    stripSlug, 
    stripLang
  }
}
</script>
