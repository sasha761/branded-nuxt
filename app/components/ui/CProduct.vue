<template>
  <div
    class="c-product js-product-item"
    :data-id="product.id"
    :data-brand="product.post_attr_brand"
    :data-size="product.post_attr_size"
  >
    <NuxtLink
      :to="product.path"
      class="c-product__img"
    >
      <picture>
        <source
          :srcset="product.post_img_l"
          media="(min-width: 426px)"
        />
        <source
          :srcset="product.post_img_m"
          media="(max-width: 425px)"
        />
        <img
          src="data:image/gif;base64,R0lGODlhBAAFAIAAAP///wAAACH5BAEAAAEALAAAAAAEAAUAAAIEjI+ZBQA7"
          :alt="product.name"
          :title="product.name"
          width="342"
          height="435"
          class="lazy entered loaded"
        />
        <span v-if="product.percent" class="c-product__sale">-{{ product.percent }}%</span>
        <span v-if="product.stockStatus === 'outofstock'" class="c-product__stock">{{ te('out_of_stock') ? t('out_of_stock') : 'Out of stock' }}</span>
      </picture>
    </NuxtLink>

    <div v-if="isBrand" class="c-product__brand">
      <svg width="61px" height="19px" class="c-product__arrow">
        <use xlink:href="#small-arrow"></use>
      </svg>
      <p>{{ product.post_attr_brand }}</p>
    </div>

    <div v-else class="c-product__text">
      <p class="c-product__text-title">{{ product.name }}</p>
      <p class="c-price" v-html="product.price_html"></p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  product: { type: Object, required: true },
  isBrand: { type: Boolean, default: false },
})

const { t, te } = useI18n()
</script>

<style lang="scss">
  @import "~/assets/scss/components/product.scss";
</style>