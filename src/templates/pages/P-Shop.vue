<template>
  <main class="p-shop">
    <C-PageLoader v-if="requestInProgress"/>
    <div class="u-container">
      <C-Breadcrumb />
      <div class="p-shop__flex">
        <div class="p-shop__sidebar">
          
        </div>
        <div class="p-shop__catalog">
          
          <section class="l-shop" :data-categories="categoryTitle" >
            <h1 class="u-h2">{{categoryTitle}}</h1>
            <L-Filter-Block @filtering="filterCallback"/>
            
            <C-Product-list 
              :products="products"
              ref="productsList"
            ></C-Product-list>
            
            <div v-if="maxPages > 0" class="c-pagination">
              <pagination 
                v-model="page" 
                :records="productsCount" 
                :per-page="16"
                @paginate="paginationCallback"
                :options="{texts: null}"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
    <L-Subscribe />
  </main>
</template>
<script>

import LSubscribe from '@/templates/layout/L-Subscribe.vue'
import LFilterBlock from '@/templates/layout/L-Filter-block.vue'

import CPageLoader from '@/templates/components/C-PageLoader.vue'
import CBreadcrumb from '@/templates/components/C-Breadcrumbs.vue'

import CProductList from '@/templates/components/C-Product-list.vue'

import { mapActions, mapMutations, mapGetters } from 'vuex';
import waitRequest from '@/mixins/waitRequest';
import Pagination from 'v-pagination-3';


export default {
  name: "App",

  mixins: [waitRequest],

  data() {
    return {
      currentFullPath: this.$route.fullPath,
      isReplacingRoute: false,
      page: 1,
      maxPages: 1,
      // offset: null,
    }
  },

  components: {
    LFilterBlock,
    LSubscribe,
    CPageLoader,
    CProductList,
    CBreadcrumb,
    Pagination
  },

  beforeMount() {
    this.page = this.currentPage
  },

  mounted() {
    this.fetchProductsData();
  },

  watch: {
    currentLang() {
      this.fetchProductsData();
    }, 
    '$route.query.page': {
      immediate: true,
      handler(newPage) {
        console.log("Изменился параметр `page` в URL:", newPage);
        this.page = Number(newPage) || 1;
      }
    }
  },

  computed: {
    ...mapGetters({
      products: 'catalog/products',
      productsCount: 'catalog/productsCount',
      categoryInfo: 'catalog/categoryInfo',
      currentLang: 'lang/getCurrentLang',
    }),

    categorySlugFromRoute() { return this.$route.params.subcategorySlug || this.$route.params.categorySlug },
    currentPage() { 
      return this.page;
    },

    offset() {
      console.log('offset: ', 16 * (this.currentPage - 1));
      return 16 * (this.currentPage - 1);
    },

    categoryTitle() {
      let title = '';
      if (this.categoryInfo.parent) { 
        title = this.categoryInfo?.parent + '. ' + this.categoryInfo.name 
      } else {
        title = this.categoryInfo.name 
      } 
      return title;
    }
  },

  methods: {
    ...mapMutations({
      setProductsList: 'catalog/setProductsList',
      setApiUrl: 'lang/setApiUrl'
    }),

    ...mapActions({
      fetchProducts: 'catalog/fetchProducts'
    }),

    paginationCallback(changedPage) {
      this.addQueryParams('page', changedPage);
      // const offset = this.productsLength * this.page;
      this.fetchProductsData({page: changedPage});
    },

    async filterCallback(selectedOption) {
      if (!selectedOption) return;  

      if(selectedOption.key !== 'all') {
        await this.addQueryParams(selectedOption.type, selectedOption.key);
      } else {
        await this.removeQueryParams(selectedOption.type);
      }

      if(this.$route.query.page) {
        await this.removeQueryParams('page');
      }

      this.fetchProductsData({url: this.$route.fullPath, page: 1, offset: 0});

      // console.log("После-После обновления маршрута:", this.$route.fullPath);
    },

    async addQueryParams(queryKey, queryVal) {
      const query = { ...this.$route.query };
      query[queryKey] = queryVal;
      await this.$router.push({ path: '', query });
    },

    async removeQueryParams(param) {
      const query = { ...this.$route.query };
      delete query[param];
      await this.$router.push({ path: '', query });
    },

    fetchProductsData({ 
      url = this.currentFullPath, 
      page = this.currentPage, 
      slug = this.categorySlugFromRoute, 
      offset = this.offset, 
      lang = this.currentLang 
    } = {}) {

      console.log('currentPage: ', this.currentPage);
      this.waitRequest(() => {
        return this.fetchProducts({
          url, 
          page, 
          slug, 
          offset, 
          lang,
        }).then(result => {
          console.log(result);
          // this.setApiUrl(result?.product_cat?.url);
        });
      });
    },
  }
}
</script>

<style>
.VuePagination .VuePagination__count {
  display: none;
}

.VuePagination button {
  color: white;
}
  
</style>