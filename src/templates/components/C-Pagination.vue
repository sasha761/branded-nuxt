<template>
  <div v-if="maxPages > 0" class="c-pagination">
    <pagination 
      v-model="page" 
      :records="countProducts" 
      :per-page="16"
      @paginate="paginationCallback"
      :options="{texts: null}"
    />
  </div>
</template>

<script>
import Pagination from 'vue-pagination-2';
import waitRequest from '@/mixins/waitRequest';
import { mapActions } from 'vuex';

export default {
  components: {
    Pagination
  },

  mixins: [waitRequest],

  data() {
    return {
      page: 1,
      maxPages: 1,
      offset: null,
    }
  },

  beforeMount() {
    this.page = this.currentPage
  },

  props: {
    countProducts: {
      type: Number,
      default: 16
    },
    categorySlugFromRoute: {
      type: String
    },
    currentPage: {
      type: Number,
      default: 1
    }
  },

  computed: {
    ...mapGetters({
      currentLang: 'lang/getCurrentLang',
    }),
  },
 
  methods: {
    ...mapActions({
      fetchProducts: 'catalog/fetchProducts'
    }),
    

    paginationCallback(changedPage) {
      this.addQueryParams(changedPage);

      this.offset = this.productsLength * this.page;

      this.waitRequest(() => {
        return this.fetchProducts({
          url: this.$route.fullPath, 
          page: this.page, 
          slug: this.categorySlugFromRoute,
          offset: this.offset, 
          lang: this.currentLang
        })
      })

      this.$emit('paginationRequestInProgress', this.requestInProgress);
    },

    addQueryParams(currentPage) {
      const query = { ...this.$route.query };
      query['page'] = currentPage;
      this.$router.push({ path: '', query });
    },

    removeQueryParams() {
      const query = { ...this.$route.query };
      delete query['page'];
      this.$router.push({ path: '', query });
    },
  }
}
</script>

<style>
  .VuePagination__count {
    display: none;
  }
</style>