<template>
  <div>
    <!-- <C-Spinner v-if="requestInProgress"></C-Spinner> -->

    <!-- <div v-if="products.length && !requestInProgress" class="l-shop__product"> -->
    <div v-if="products.length" class="l-shop__product">  
      <div class="row">
        <div
          v-for="product in products"
          :key="product.id"
          class="col-lg-3 col-md-4 col-sm-6 col-6 u-col"
        >
          <C-Product :product="product" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CProduct from '@/templates/components/C-Product.vue'
// import CSpinner from '@/templates/components/C-Spinner.vue'
// import waitRequest from '@/mixins/waitRequest';

export default {
  data() {
    return {

    }
  },

  // mixins: [waitRequest],

  components: {
    CProduct,
    // CSpinner
  },

  props: {
    products: {
      type: Array
    },
    // callback: {
    //   type: Function
    // }
  },

  methods: {
    // callbackInit() {
    //   this.waitRequest(this.callback)
    // }
  }
}
</script>