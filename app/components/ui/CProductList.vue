<template>
  <div>
    <div v-if="products.length" class="l-shop__product">
      <div class="row">
        <div
          v-for="(product, index) in products"
          :key="product.id"
          class="col-lg-3 col-md-4 col-sm-6 col-6 u-col"
        >
          <UiCProduct
            :product="product"
            :eager="index < 4"
            @select="analytics.selectItem(product, index, listContext)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  products: { type: Array, default: () => [] },
  // Для GA4: item_list_name, item_list_id, категории списка
  listContext: { type: Object, default: () => ({}) },
})

const analytics = useAnalytics()

onMounted(() => {
  analytics.viewItemList(props.products, props.listContext)
})

watch(() => props.products, (products) => {
  analytics.viewItemList(products, props.listContext)
})
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/shop.scss";
</style>
