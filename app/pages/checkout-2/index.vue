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
                  maxlength="4"
                />
                <div class="error-msg" v-if="v$.formData.address.required.$invalid && v$.formData.address.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="v$.formData.address.minLength.$invalid">
                  Минимальная длина 2 символа
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
                  v-model.trim="v$.formData.phone.$model"
                  :class="{ invalid: v$.formData.phone.$error }"
                  name="billing_phone"
                  placeholder="+38(000)000-00-00"
                />
                <div class="error-msg" v-if="v$.formData.phone.required.$invalid && v$.formData.phone.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="v$.formData.phone.minLength.$invalid">
                  Минимальная длина 10 символов
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
          <div class="l-cart">
            <div
              v-for="(product, key) in cartProducts"
              :key="key"
              class="c-product-cart"
            >
              <NuxtLink
                :to="stripDomain(product.permalink)"
                class="c-product-cart__img"
              >
                <img :src="product.post_img_m" />
              </NuxtLink>
              <div class="c-product-cart__info">
                <div class="c-product-cart__name">
                  <NuxtLink
                    :to="stripDomain(product.post_brand_url)"
                    class="c-product-cart__name-brand"
                  >
                    {{ product.post_attr_brand }}
                  </NuxtLink>

                  <NuxtLink
                    :to="stripDomain(product.permalink)"
                    class="c-product-cart__name-title"
                  >
                    {{ product.name }}
                  </NuxtLink>

                  <div class="mb-3">
                    Размер: {{ product.size_selected[0].name }}
                  </div>
                  <div class="d-flex justify-content-between">
                    <div class="c-price">{{ product.quantity }} шт</div>
                    <div class="c-total">
                      {{ product.price * product.quantity }} {{ $t('currency') }}
                    </div>
                  </div>
                  <div class="c-quantity">
                    <div class="c-quantity__btn">
                      <button
                        v-show="product.quantity > 1"
                        @click="quantityMinus(product)"
                        type="button"
                        class="u-btn is-minus"
                      >-</button>
                      <b>{{ product.quantity }}</b>
                      <button
                        @click="quantityPlus(product)"
                        type="button"
                        class="u-btn is-plus"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="l-sidebar-cart">
            <form class="l-checkout__coupon l-sidebar-cart__cupons actions" method="post">
              <h2 class="u-h3">Купоны</h2>
              <div class="c-form-cupons">
                <input type="text" name="coupon_code" id="coupon_code" value="" placeholder="Промо код" />
                <button type="submit" name="apply_coupon" value="Apply coupon" class="u-btn-submit">
                  <svg width="26px" height="14px">
                    <use xlink:href="#big-arrow"></use>
                  </svg>
                </button>
              </div>
            </form>

            <div class="l-sidebar-cart__total actions">
              <h2 class="u-h3">Ваш заказ</h2>
              <ul class="l-sidebar-cart__list">
                <li class="l-sidebar-cart__item">
                  <span>Сумма заказа</span>
                  <span class="c-price">{{ cartStore.totalAmount }} {{ $t('currency') }}</span>
                </li>
                <li class="l-sidebar-cart__item">
                  <span>Доставка</span>
                  <span>0 {{ $t('currency') }}</span>
                </li>
                <li class="l-sidebar-cart__item">
                  <span>Всего</span>
                  <span>{{ cartStore.totalAmount }} {{ $t('currency') }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, maxLength, helpers } from '@vuelidate/validators'

const localePath = useLocalePath()
const router = useRouter()
const cartStore = useCartStore()
const { stripDomain } = useProductUtils()
const { requestInProgress, waitRequest } = useWaitRequest()

const cartProducts = computed(() => cartStore.cartProducts)

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
      numeric: helpers.regex(/^[0-9]+$/),
      minLength: minLength(10),
      maxLength: maxLength(15),
    },
    city: { required, minLength: minLength(3) },
    address: { required, minLength: minLength(2) },
  },
}

const v$ = useVuelidate(rules, { formData })

function quantityMinus(product) {
  let allProducts = [...cartStore.cartProducts]
  const index = allProducts.findIndex(obj =>
    obj.size_selected?.length > 0 &&
    product.size_selected?.length > 0 &&
    obj.size_selected[0].id === product.size_selected[0].id
  )
  if (index !== -1) {
    allProducts[index] = { ...allProducts[index], quantity: allProducts[index].quantity - 1 }
  }
  cartStore.setProductToCart(allProducts)
  cartStore.setTotalAmount()
}

function quantityPlus(product) {
  let allProducts = [...cartStore.cartProducts]
  const index = allProducts.findIndex(obj =>
    obj.size_selected?.length > 0 &&
    product.size_selected?.length > 0 &&
    obj.size_selected[0].id === product.size_selected[0].id
  )
  if (index !== -1) {
    allProducts[index] = { ...allProducts[index], quantity: allProducts[index].quantity + 1 }
  }
  cartStore.setProductToCart(allProducts)
  cartStore.setTotalAmount()
}

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
  @import "~/assets/scss/layout/cart.scss";
  @import "~/assets/scss/layout/sidebar-cart.scss";
  @import "~/assets/scss/layout/checkout.scss";
  @import "~/assets/scss/components/product-cart.scss";
  @import "~/assets/scss/components/quantity.scss";
</style>