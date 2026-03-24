<template>
  <div>
    <div v-if="products.length" class="l-shop__product">
      <div class="row">
        <div
          v-for="product in products"
          :key="product.id"
          class="col-lg-3 col-md-4 col-sm-6 col-6 u-col"
        >
          <UiCProduct :product="product" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  products: { type: Array, default: () => [] },
})
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/shop.scss";
</style>