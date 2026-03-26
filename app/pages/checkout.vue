<template>
  <main class="p-checkout">
    <UiCPageLoader v-if="requestInProgress"/>
    <div class="u-container">
      <div class="row">
        <div class="col-lg-6">
          <form @submit.prevent="submitForm" method="post" class="l-checkout">
            <div class="l-checkout__form">
              <h1 class="u-h3">Оформление заказа</h1>
              <div class="c-input">
                <span>Имя</span>
                <input
                  type="text"
                  v-model.trim="v$.formData.firstName.$model"
                  :class="{ invalid: v$.formData.firstName.$error }"
                  name="billing_first_name"
                  maxlength="20"
                />
                <div class="error-msg" v-if="v$.formData.firstName.required.$invalid && v$.formData.firstName.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="v$.formData.firstName.minLength.$invalid">
                  Минимальная длина 2 символа
                </div>
              </div>
              <div class="c-input">
                <span>Фамилия</span>
                <input
                  type="text"
                  v-model.trim="v$.formData.lastName.$model"
                  :class="{ invalid: v$.formData.lastName.$error }"
                  name="billing_last_name"
                  maxlength="20"
                />
                <div class="error-msg" v-if="v$.formData.lastName.required.$invalid && v$.formData.lastName.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="v$.formData.lastName.minLength.$invalid">
                  Минимальная длина 2 символа
                </div>
              </div>
              <div class="c-input">
                <span>Отделение почты</span>
                <input
                  type="text"
                  v-model.trim="v$.formData.address.$model"
                  :class="{ invalid: v$.formData.address.$error }"
                  name="billing_address_1"
                />
                <div class="error-msg" v-if="v$.formData.address.required.$invalid && v$.formData.address.$error">
                  Поле не должно быть пустым
                </div>
              </div>
              <div class="c-input">
                <span>Населенный пункт</span>
                <input
                  type="text"
                  v-model.trim="v$.formData.city.$model"
                  :class="{ invalid: v$.formData.city.$error }"
                  name="billing_city"
                  maxlength="20"
                />
                <div class="error-msg" v-if="v$.formData.city.required.$invalid && v$.formData.city.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="v$.formData.city.minLength.$invalid">
                  Минимальная длина 3 символа
                </div>
              </div>
              <div class="c-input">
                <span>Телефон</span>
                <input
                  type="tel"
                  v-model="v$.formData.phone.$model"
                  :class="{ invalid: v$.formData.phone.$error }"
                  name="billing_phone"
                  placeholder="+380XXXXXXXXX"
                  inputmode="tel"
                  maxlength="13"
                />
                <div class="error-msg" v-if="v$.formData.phone.required.$invalid && v$.formData.phone.$error">
                  Поле не должно быть пустым
                </div>
                <div
                  class="error-msg"
                  v-if="v$.formData.phone.phoneFormat.$invalid && !v$.formData.phone.required.$invalid && v$.formData.phone.$error"
                >
                  Введите номер в формате +380XXXXXXXXX
                </div>
              </div>
              <div class="c-input">
                <span>Email</span>
                <input
                  type="email"
                  v-model.trim="v$.formData.email.$model"
                  :class="{ invalid: v$.formData.email.$error }"
                  name="billing_email"
                />
                <div class="error-msg" v-if="v$.formData.email.required.$invalid && v$.formData.email.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="v$.formData.email.email.$invalid">
                  Неверный формат почты
                </div>
              </div>
              <div class="c-input">
                <span>Примечание к заказу</span>
                <textarea
                  v-model.trim="formData.comments"
                  name="order_comments"
                  rows="4"
                  placeholder="Примечания к вашему заказу, например, особые пожелания отделу доставки."
                ></textarea>
              </div>

              <div id="payment" class="woocommerce-checkout-payment">
                <ul class="wc_payment_methods payment_methods methods">
                  <li class="wc_payment_method payment_method_bacs">
                    <input
                      id="payment_method_bacs"
                      type="radio"
                      class="input-radio"
                      name="payment_method"
                      value="bacs"
                      checked="checked"
                    />
                    <label for="payment_method_bacs">Прямой банковский перевод</label>
                    <div class="payment_box payment_method_bacs">
                      <p>
                        Оплату нужно направлять напрямую на наш банковский счет.
                        Используйте идентификатор заказа в качестве кода
                        платежа. Заказ будет отправлен после поступления средств
                        на наш счет.
                      </p>
                    </div>
                  </li>
                  <li class="wc_payment_method payment_method_cod">
                    <input
                      id="payment_method_cod"
                      type="radio"
                      class="input-radio"
                      name="payment_method"
                      value="cod"
                    />
                    <label for="payment_method_cod">Оплата при доставке</label>
                    <div class="payment_box payment_method_cod" style="display: none">
                      <p>Оплата наличными при доставке заказа.</p>
                    </div>
                  </li>
                </ul>
                <div class="form-row place-order">
                  <button
                    type="submit"
                    class="button alt"
                    :disabled="requestInProgress"
                  >
                    Подтвердить заказ
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="col-lg-6">
          <LayoutLCart
            :show-empty="true"
            heading-tag="h2"
          />

          <LayoutLSidebarCart
            v-model:coupon-code="couponCode"
            coupon-input-id="checkout_coupon_code"
            :summary-items="summaryItems"
            @submit-coupon="submitCoupon"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, helpers } from '@vuelidate/validators'

const localePath = useLocalePath()
const router = useRouter()
const { t } = useI18n()
const cartStore = useCartStore()
const { requestInProgress, waitRequest } = useWaitRequest()

const cartProducts = computed(() => cartStore.cartProducts)
const couponCode = ref('')

const formData = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  comments: '',
})

const rules = {
  formData: {
    firstName: { required, minLength: minLength(2) },
    lastName: { required, minLength: minLength(2) },
    email: { required, email },
    phone: {
      required,
      phoneFormat: helpers.regex(/^\+380\d{9}$/),
    },
    city: { required, minLength: minLength(3) },
    address: { required, minLength: minLength(1) },
  },
}

const v$ = useVuelidate(rules, { formData })

watch(() => formData.phone, (value) => {
  const digits = value.replace(/\D/g, '')
  const hasPlus = value.startsWith('+')
  let normalized = digits

  if (hasPlus) {
    normalized = `+${digits}`
  }

  if (normalized.length > 13) {
    normalized = normalized.slice(0, 13)
  }

  if (normalized !== value) {
    formData.phone = normalized
  }
})

const summaryItems = computed(() => [
  {
    label: 'Сумма заказа',
    value: `${cartStore.totalAmount} ${t('currency')}`,
    valueClass: 'c-price',
  },
  {
    label: 'Доставка',
    value: `0 ${t('currency')}`,
  },
  {
    label: 'Всего',
    value: `${cartStore.totalAmount} ${t('currency')}`,
  },
])

function submitCoupon() {}

async function submitForm() {
  const isValid = await v$.value.$validate()
  if (!isValid) return

  waitRequest(async () => {
    try {
      const result = await $fetch('/api/cart/create_order', {
        method: 'POST',
        body: {
          products: cartProducts.value,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          address: formData.address,
          comments: formData.comments,
        },
      })

      const url = new URL(result)
      const path = url.pathname + url.search
      const numbers = path.match(/order-received\/(\d+)\//)?.[1]

      router.push(localePath(`/order-received/${numbers}`))
    } catch (error) {
      console.error(error)
    }
  })
}
</script>

<style lang="scss">
  @import "~/assets/scss/page/checkout.scss";
  @import "~/assets/scss/layout/checkout.scss";
</style>
