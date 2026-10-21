<template>
  <main class="p-checkout">
    <UiCPageLoader v-if="requestInProgress"/>
    <div class="u-container">
      <div class="row">
        <div class="col-lg-6">
          <form @submit.prevent="submitForm" method="post" class="l-checkout" novalidate>
            <div class="l-checkout__form">
              <h1 class="u-h3">{{ t('checkout.title') }}</h1>

              <div v-for="field in fields" :key="field.name" class="c-input">
                <span>{{ field.label }}</span>
                <input
                  :type="field.type"
                  v-model.trim="v$.formData[field.name].$model"
                  :class="{ invalid: fieldError(field.name) }"
                  :name="field.htmlName"
                  :placeholder="field.placeholder"
                  :autocomplete="field.autocomplete"
                  :inputmode="field.inputmode"
                  :maxlength="field.maxlength"
                />
                <div class="error-msg" v-if="fieldError(field.name)">{{ fieldError(field.name) }}</div>
              </div>

              <div class="c-input">
                <span>{{ t('checkout.comment') }}</span>
                <textarea
                  v-model.trim="formData.comments"
                  name="order_comments"
                  rows="4"
                  maxlength="2000"
                  :placeholder="t('checkout.comment_placeholder')"
                ></textarea>
              </div>

              <input v-model="formData.website" class="u-honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">

              <div id="payment" class="woocommerce-checkout-payment">
                <ul class="wc_payment_methods payment_methods methods">
                  <li
                    v-for="method in paymentMethods"
                    :key="method.id"
                    class="wc_payment_method"
                    :class="`payment_method_${method.id}`"
                  >
                    <input
                      :id="`payment_method_${method.id}`"
                      v-model="paymentMethod"
                      type="radio"
                      class="input-radio"
                      name="payment_method"
                      :value="method.id"
                    />
                    <label :for="`payment_method_${method.id}`">{{ method.title }}</label>
                    <div v-show="paymentMethod === method.id" class="payment_box" :class="`payment_method_${method.id}`">
                      <p>{{ method.description }}</p>
                    </div>
                  </li>
                </ul>

                <p v-if="formError" class="c-form-error">{{ formError }}</p>
                <p v-else-if="hasItemErrors" class="c-form-error">{{ t('checkout.fix_cart') }}</p>

                <div class="form-row place-order">
                  <button
                    type="submit"
                    class="button alt"
                    :disabled="requestInProgress || !cartStore.cartProducts.length || hasItemErrors"
                  >
                    {{ t('checkout.submit') }}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="col-lg-6">
          <ClientOnly>
            <LayoutLCart
              :show-empty="true"
              heading-tag="h2"
              :quote="quote"
            />

            <LayoutLSidebarCart
              v-if="cartStore.cartProducts.length"
              v-model:coupon-code="couponInput"
              coupon-input-id="checkout_coupon_code"
              :applied-coupon="appliedCoupon"
              :coupon-error="couponError"
              :coupon-disabled="quoteStatus === 'pending'"
              :summary-items="summaryItems"
              @submit-coupon="submitCoupon"
              @remove-coupon="clearCoupon"
            />
          </ClientOnly>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
const localePath = useLocalePath()
const router = useRouter()
const { t } = useI18n()
const cartStore = useCartStore()

useServicePageHead(() => t('checkout.title'))

const {
  quote,
  quoteStatus,
  hasItemErrors,
  couponInput,
  couponError,
  appliedCoupon,
  submitCoupon,
  clearCoupon,
  summaryItems,
} = useCartSummary()

const { formData, v$, fieldError, formError, submit, requestInProgress } = useOrderForm(() => cartStore.cartProducts)

// Способы оплаты WooCommerce, которые принимает create_order
const paymentMethod = ref('bacs')
const paymentMethods = computed(() => [
  { id: 'bacs', title: t('payment.bacs'), description: t('payment.bacs_description') },
  { id: 'cod', title: t('payment.cod'), description: t('payment.cod_description') },
])

const fields = computed(() => [
  { name: 'firstName', htmlName: 'billing_first_name', label: t('form_fields.first_name'), type: 'text', autocomplete: 'given-name', maxlength: 50 },
  { name: 'lastName', htmlName: 'billing_last_name', label: t('form_fields.last_name'), type: 'text', autocomplete: 'family-name', maxlength: 50 },
  { name: 'address', htmlName: 'billing_address_1', label: t('form_fields.address'), type: 'text', maxlength: 200 },
  { name: 'city', htmlName: 'billing_city', label: t('form_fields.city'), type: 'text', autocomplete: 'address-level2', maxlength: 100 },
  // без maxlength: вставленный «+38 (050) 123-45-67» браузер обрезал бы до нормализации, длину ограничивает normalizePhone
  { name: 'phone', htmlName: 'billing_phone', label: t('form_fields.phone'), type: 'tel', placeholder: '+380XXXXXXXXX', autocomplete: 'tel', inputmode: 'tel' },
  { name: 'email', htmlName: 'billing_email', label: 'Email', type: 'email', autocomplete: 'email', maxlength: 200 },
])

async function submitForm() {
  const order = await submit({
    payment_method: paymentMethod.value,
    // только купон, который WP уже принял в котировке
    coupon: appliedCoupon.value || undefined,
  })

  if (!order) return

  cartStore.clear()
  await router.push(localePath({ path: `/order-received/${order.id}/`, query: { key: order.key } }))
}
</script>

<style lang="scss">
  @import "~/assets/scss/page/checkout.scss";
  @import "~/assets/scss/layout/checkout.scss";
</style>
