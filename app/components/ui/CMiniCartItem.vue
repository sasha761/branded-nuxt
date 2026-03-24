<template>
  <div class="c-minicart-product">
    <div class="c-minicart-product__img">
      <NuxtLink :to="productLink">
        <img :src="product.post_img_m">
      </NuxtLink>
    </div>

    <div class="c-minicart-product__info">
      <div v-if="product.post_attr_brand" class="is-brand">{{ product.post_attr_brand }}</div>
      <NuxtLink :to="productLink" class="is-name">
        {{ product.name }}
      </NuxtLink>
      <p class="is-quantity" v-if="product.quantity >= 2">Количество: <b>{{ product.quantity }}</b></p>

      <div class="c-minicart-product__attr">
        <div v-if="product.size_selected" class="is-size">
          <span>Размер: </span>
          <span class="is-bold">{{ product.size_selected[0].name }}</span>
        </div>
      </div>

      <p class="c-price">
        {{ product.price }}
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
  },
})

const { stripDomain } = useProductUtils()

const productLink = computed(() => {
  return stripDomain(props.product?.permalink || '')
})
</script>
