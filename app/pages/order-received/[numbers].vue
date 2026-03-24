<template>
  <main class="p-thank">
    <UiCPageLoader v-if="requestInProgress"/>
    <div class="u-container">
      <div class="row">
        <div class="col-lg-6">
          <div class="l-checkout__form">
            <h1 class="u-h3">Спасибо. Ваш заказ принят</h1>
            <ul class="p-thank__list">
              <li>Номер заказа: <b>{{ orderData.order_number }}</b></li>
              <li>Дата: <b>{{ orderData.order_date }}</b></li>
              <li>Email: <b>{{ orderData.billing_email }}</b></li>
              <li>Город: <b>{{ orderData.billing_city }}</b></li>
              <li>Отделение почты: <b>{{ orderData.billing_address_1 }}</b></li>
              <li>Способ оплаты: <b>{{ orderData.payment_method_title }}</b></li>
              <li>ФИО: <b>{{ orderData.billing_first_name }} {{ orderData.billing_last_name }}</b></li>
              <li>Телефон: <b>{{ orderData.billing_phone }}</b></li>
            </ul>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="l-checkout__form">
            <h2 class="u-h3">Информация о заказе</h2>
            <ul class="p-thank__list">
              <li
                v-for="product in products"
                :key="product.variation_id"
                class="p-thank__list-product js-order-item"
                :data-name="product.name"
                :data-id="product.id"
                :data-quantity="product.qty"
                :data-price="product.total"
                :data-brand="product.brand?.[0]?.name"
                :data-categories="product.cats?.join(', ')"
              >
                <p><b>{{ product.name }}</b></p>
                <p>Количество: <b>{{ product.qty }}</b></p>
                <p>Цена: <b>{{ product.total }} {{ orderData.order_currency }}</b></p>
              </li>
              <li :data-total="orderData.order_total">
                Итого: <b>{{ orderData.order_total }} {{ orderData.order_currency }}</b>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
const route = useRoute()
const cartStore = useCartStore()
const { requestInProgress, waitRequest } = useWaitRequest()

const orderData = ref({})
const products = ref([])

onMounted(() => {
  waitRequest(async () => {
    try {
      const result = await $fetch('/api/cart/get_order_info', {
        params: {
          order_id: route.params.numbers,
        },
      })
      orderData.value = result.order_data
      products.value = result.products
      cartStore.setProductToCart([])
    } catch (error) {
      console.error(error)
    }
  })
})
</script>

<style lang="scss">
  @import "~/assets/scss/page/thank.scss";
  @import "~/assets/scss/layout/checkout.scss";
</style>
