<template>
  <div class="c-minicart-product">
    <div class="c-minicart-product__img">
      <NuxtLink :to="product.path">
        <img :src="imageSrc" :alt="product.name" width="70" height="84" loading="lazy">
      </NuxtLink>
    </div>

    <div class="c-minicart-product__info">
      <div v-if="product.post_attr_brand" class="is-brand">{{ product.post_attr_brand }}</div>
      <NuxtLink :to="product.path" class="is-name">
        {{ product.name }}
      </NuxtLink>
      <p class="is-quantity" v-if="product.quantity >= 2">{{ t('quantity') }}: <b>{{ product.quantity }}</b></p>

      <div class="c-minicart-product__attr">
        <template v-if="product.attributes?.length">
          <div v-for="attribute in product.attributes" :key="attribute.label" class="is-size">
            <span>{{ attribute.label }}: </span>
            <span class="is-bold">{{ attribute.value }}</span>
          </div>
        </template>
        <div v-else-if="sizeName" class="is-size">
          <span>{{ t('size') }}: </span>
          <span class="is-bold">{{ sizeName }}</span>
        </div>
      </div>

      <p class="c-price">
        {{ product.price }} {{ t('currency') }}
      </p>
    </div>
  </div>
</template>

<script setup>
// Строка товара в мини-корзине и в подсказках поиска (там size_selected нет)
const props = defineProps({
  product: {
    type: Object,
  },
})

const { t } = useI18n()

const imageSrc = computed(() => props.product?.image?.sizes?.archive_md?.src || props.product?.post_img_m || '')
const sizeName = computed(() => {
  const name = props.product?.size_selected?.[0]?.name
  return name && name !== 'one size' ? name : ''
})
</script>

<style lang="scss">
@import '~/assets/scss/layout/mini-cart.scss';
</style>
