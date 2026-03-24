<template>
  <div>
    <div class="l-filter">
      <div class="widget">
        <select-filter
          @select-filter="sortHendler" 
          :options="filterBrand" 
          :show-all="showAll"
          filter-param="brand"  
          :current-option="brandSelect"
        />
      </div>
      <div class="widget">
        <select-filter
          @select-filter="sortHendler" 
          :options="filterSize" 
          :show-all="showAll"
          filter-param="size"  
          :current-option="sizeSelect"
        />
      </div>
    </div>
    <div class="l-shop__result">
      <div class="l-shop__result-count">
        <p class="woocommerce-result-count" v-if="products.length">Отображение {{productCurrentCount}} из {{productsLength}}</p>
      </div>
      <select-filter
        @select-filter="sortHendler" 
        :options="filterOrderby" 
        :show-all="showAll"
        filter-param="orderby"  
        :current-option="orderbySelect"
      />
    </div>
  </div>
</template>

<script>
import selectFilter from '@/templates/forms/SelectFilter.vue'

import ProductFiltersData from '@/config/productFilterNew'
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      currentFilters: [],
      filterOrderby: ProductFiltersData.orderby,
      filterBrand: ProductFiltersData.brand,
      filterSize: ProductFiltersData.size, 
      filterTypes: ProductFiltersData.types,
      showAll: ProductFiltersData.showAll
    }
  },

  components: {
    selectFilter,
  },

  computed: {
    ...mapGetters({
      products: 'catalog/products',
      productsLength: 'catalog/productsCount',
      currentLang: 'lang/getCurrentLang',
    }),

    brandSelect() { return this.getFilterByKey('brand', this.$route.query.brand)},
    sizeSelect() { return this.getFilterByKey('size', this.$route.query.size)},
    orderbySelect() { return this.getFilterByKey('orderby', this.$route.query.orderby)},
    currentPage() {
      const queryPage = this.$route?.query?.page;
      const currentPageNumber = Number(queryPage) || 1;

      return currentPageNumber;
    },

    productCurrentCount() {
      let maxProductsItems = this.products.length ? 16 : 0;
      let sliceFirstIndex = this.products.length ? 1 : 0;

      return `${maxProductsItems * this.currentPage - (maxProductsItems - sliceFirstIndex)}-${maxProductsItems * this.currentPage - (maxProductsItems - this.products.length)}`;
    }
  },

  methods: {
    getFilterByKey(filterKey, searchParam) {
      return ProductFiltersData[filterKey].find(filter => filter.key === searchParam) || this.showAll || ProductFiltersData[filterKey][ProductFiltersData[filterKey][0]]
    },

    sortHendler(selectedOption) {
      this.$emit('filtering', selectedOption);
    },
  },
}
</script>