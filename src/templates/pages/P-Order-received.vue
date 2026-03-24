<template>
  <main class="p-thank" >
    <C-PageLoader v-if="requestInProgress"/>
    <div class="u-container">
      <div class="row">
        <div class="col-lg-6">
          <div class="l-checkout__form">
            <h1 class="u-h3">Thank you. Your order has been accepted</h1>
            <ul class="p-thank__list">
              <li>Order number: <b>{{orderData.order_number}}</b> </li>
              <li>Date: <b>{{orderData.order_date}}</b></li>
              <li>Email: <b>{{orderData.billing_email}}</b></li>
              <li>City: <b>{{orderData.billing_city}}</b></li>
              <li>Post Office: <b>{{orderData.billing_address_1}}</b></li>
              <li>Payment method:	<b>{{orderData.payment_method_title}}</b></li>
              <li>Full name: <b>{{orderData.billing_first_name}} {{orderData.billing_last_name}}</b></li>
              <li>Phone: <b>{{orderData.billing_phone}}</b></li>
            </ul>
            <div class="p-thank__payment">
              <!-- {% do action("woocommerce_thankyou_" ~ orderData.payment_method, orderData.order_id) %} -->
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="l-checkout__form">
            <h2 class="u-h3">Ordering information</h2>
            <!-- <pre>{{products}}</pre> -->
            <ul class="p-thank__list">
              <li 
                v-for="product in products"
                :key="product.variation_id"
                class="p-thank__list-product js-order-item" 
                :data-name="product.name"
                :data-id="product.id"
                :data-quantity="product.qty"
                :data-price="product.total"
                :data-brand="product.brand[0].name"
                :data-categories="product.cats.join(', ')"
              >
                <p><b>{{product.name}}</b></p>
                <p>Quantity: <b>{{product.qty}}</b></p>
                <p>Price: <b>{{product.total}} {{orderData.order_currency}}</b></p>
              </li>
              <li :data-total="orderData.order_total">Total: <b>{{orderData.order_total}} {{orderData.order_currency}}</b></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import Api from "@/api/Axios";
import waitRequest from '@/mixins/waitRequest';
import CPageLoader from '@/templates/components/C-PageLoader.vue'

import { mapMutations } from 'vuex';

export default {
  data() {
    return {
      orderData: [],
      products: []
    };
  },

  components: {
    CPageLoader,
  },

  mixins: [waitRequest],

  methods: {
    ...mapMutations({
      setProductToCart: 'cart/setProductToCart'
    }),
  },

  created() {
    this.waitRequest(() => {
      return Api.get('cart/get_order_info', {
        params: {
          order_id: this.$route.params.numbers,
          query: this.$route.query,
          url:  this.$route.params
        }
      })
      .then((result) => {
        // console.log(result)
        this.orderData = result.data.order_data
        this.products = result.data.products

        this.setProductToCart([]);
      })
      .catch((error) => {
        console.log(error);
      })
    });
  },
}
</script>
