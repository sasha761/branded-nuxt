<template>
  <main class="p-thank">
    <UiCPageLoader v-if="status === 'pending' || status === 'idle'"/>
    <div class="u-container">
      <div v-if="status === 'error'" class="row">
        <div class="col-lg-6">
          <div class="l-checkout__form">
            <h1 class="u-h3">{{ t('order.not_found') }}</h1>
            <p>{{ t('order.not_found_text') }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="orderData.order_number" class="row">
        <div class="col-lg-6">
          <div class="l-checkout__form" :transaction-id="orderData.order_number">
            <h1 class="u-h3">{{ t('order.thanks') }}</h1>
            <ul class="p-thank__list">
              <li>{{ t('order.number') }}: <b>{{ orderData.order_number }}</b></li>
              <li>{{ t('order.date') }}: <b>{{ orderData.order_date }}</b></li>
              <li>Email: <b>{{ orderData.billing_email }}</b></li>
              <li>{{ t('form_fields.city') }}: <b>{{ orderData.billing_city }}</b></li>
              <li>{{ t('form_fields.address') }}: <b>{{ orderData.billing_address_1 }}</b></li>
              <li>{{ t('payment_method') }}: <b>{{ orderData.payment_method_title }}</b></li>
              <li>{{ t('order.full_name') }}: <b>{{ orderData.billing_first_name }} {{ orderData.billing_last_name }}</b></li>
              <li>{{ t('form_fields.phone') }}: <b>{{ orderData.billing_phone }}</b></li>
            </ul>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="l-checkout__form">
            <h2 class="u-h3">{{ t('order.details') }}</h2>
            <ul class="p-thank__list">
              <li
                v-for="(product, index) in products"
                :key="`${product.id}-${product.variation_id}-${index}`"
                class="p-thank__list-product js-order-item"
                :data-name="product.name"
                :data-id="product.id"
                :data-quantity="product.qty"
                :data-price="product.total"
                :data-brand="product.brand?.[0]?.name"
                :data-categories="product.cats?.join(', ')"
              >
                <p><b>{{ product.name }}</b></p>
                <!-- Атрибуты, которых нет в названии позиции (цвет у вариации «любой цвет») -->
                <p v-for="attribute in product.attributes || []" :key="attribute.label">
                  {{ attribute.label }}: <b>{{ attribute.value }}</b>
                </p>
                <p>{{ t('quantity') }}: <b>{{ product.qty }}</b></p>
                <p>{{ t('price') }}: <b>{{ product.total }} {{ orderData.order_currency }}</b></p>
              </li>
              <li v-if="Number(orderData.discount_total) > 0">
                {{ t('cart_summary.discount') }}: <b>−{{ orderData.discount_total }} {{ orderData.order_currency }}</b>
              </li>
              <li :data-total="orderData.order_total">
                {{ t('cart_summary.total') }}: <b>{{ orderData.order_total }} {{ orderData.order_currency }}</b>
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
const { locale, t } = useI18n()
const analytics = useAnalytics()

const orderId = computed(() => {
  const param = route.params.numbers
  return Array.isArray(param) ? param[0] : param
})
const orderKey = computed(() => {
  const key = Array.isArray(route.query.key) ? route.query.key[0] : route.query.key
  return typeof key === 'string' ? key : ''
})

useServicePageHead(() => t('order.thanks'))

// Данные заказа только по ключу из ответа create_order (без него WP отвечает 404).
const { status, data: orderInfo } = useFetch('/api/cart/get_order_info', {
  params: {
    order_id: orderId,
    key: orderKey,
    lang: locale,
  },
  key: () => `order-info-${orderId.value}`,
  lazy: true,
  server: false,
  default: () => ({
    order_data: {},
    products: [],
  }),
})

const orderData = computed(() => orderInfo.value?.order_data || {})
const products = computed(() => orderInfo.value?.products || [])

// purchase — один раз на заказ, даже если страницу обновили
watch(orderData, (order) => {
  if (!order?.order_number) return

  const sentKey = `purchase-sent-${order.order_id || order.order_number}`
  try {
    if (sessionStorage.getItem(sentKey)) return
    sessionStorage.setItem(sentKey, '1')
  } catch {
    // без sessionStorage событие может уйти повторно — не критично
  }

  analytics.purchase(order, products.value)
}, { immediate: true })
</script>

<style lang="scss">
  @import "~/assets/scss/page/thank.scss";
  @import "~/assets/scss/layout/checkout.scss";
</style>
