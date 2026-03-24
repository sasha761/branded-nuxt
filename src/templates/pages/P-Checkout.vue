<template>
  <main class="p-checkout">
    <C-PageLoader v-if="requestInProgress"/>
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
                  v-model.trim="$v.formData.firstName.$model"
                  :class="{ invalid: $v.formData.firstName.$error }"
                  name="billing_first_name"
                  maxlength="20"
                />
                <div class="error-msg" v-if="!$v.formData.firstName.required && $v.formData.firstName.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="!$v.formData.firstName.minLength">
                  Name must have at least
                  {{ $v.formData.firstName.$params.minLength.min }} letters.
                </div>
              </div>
              <div class="c-input">
                <span>Фамилия</span>
                <input
                  type="text"
                  v-model.trim="$v.formData.lastName.$model"
                  :class="{ invalid: $v.formData.lastName.$error }"
                  name="billing_last_name"
                  maxlength="20"
                />
                <div class="error-msg" v-if="!$v.formData.lastName.required && $v.formData.lastName.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="!$v.formData.lastName.minLength">
                  Name must have at least
                  {{ $v.formData.lastName.$params.minLength.min }} letters.
                </div>
              </div>
              <div class="c-input">
                <span>Отделение почты</span>
                <input
                  type="text"
                  v-model.trim="$v.formData.post.$model"
                  :class="{ invalid: $v.formData.post.$error }"
                  name="billing_address_1"
                  maxlength="4"
                />
                <div class="error-msg" v-if="!$v.formData.post.required && $v.formData.post.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="!$v.formData.post.minLength">
                  Name must have at least
                  {{ $v.formData.post.$params.minLength.min }} letters.
                </div>
              </div>
              <div class="c-input">
                <span>Населенный пункт</span>
                <input
                  type="text"
                  v-model.trim="$v.formData.city.$model"
                  :class="{ invalid: $v.formData.city.$error }"
                  name="billing_city"
                  maxlength="20"
                />
                <div class="error-msg" v-if="!$v.formData.city.required && $v.formData.city.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="!$v.formData.city.minLength">
                  Name must have at least
                  {{ $v.formData.city.$params.minLength.min }} letters.
                </div>
              </div>
              <div class="c-input">
                <span>Телефон</span>
                <input
                  type="tel"
                  v-model.trim="$v.formData.phone.$model"
                  :class="{ invalid: $v.formData.phone.$error }"
                  name="billing_phone"
                  placeholder="+38(000)000-00-00"
                />
                <div class="error-msg" v-if="!$v.formData.phone.required && $v.formData.phone.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="!$v.formData.phone.minLength">
                  Name must have at least
                  {{ $v.formData.phone.$params.minLength.min }} letters.
                </div>
              </div>
              <div class="c-input">
                <span>Email</span>
                <input
                  type="email"
                  v-model.trim="$v.formData.email.$model"
                  :class="{ invalid: $v.formData.email.$error }"
                  name="billing_email"
                />
                <div class="error-msg" v-if="!$v.formData.email.required && $v.formData.email.$error">
                  Поле не должно быть пустым
                </div>
                <div class="error-msg" v-if="!$v.formData.email.email">
                  неверный формат почты
                </div>
              </div>
              <div class="c-input">
                <span>Примечание к заказу</span>
                <textarea
                  v-model.trim="$v.formData.comments"
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
                      data-order_button_text=""
                    />

                    <label for="payment_method_bacs"
                      >Прямой банковский перевод
                    </label>
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
                      data-order_button_text=""
                    />

                    <label for="payment_method_cod">Оплата при доставке </label>
                    <div
                      class="payment_box payment_method_cod"
                      style="display: none"
                    >
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
              <router-link
                :to="{
                  name: 'product',
                  params: {
                    productName: extractProductName(product.permalink),
                    productData: product,
                  },
                }"
                class="c-product-cart__img"
              >
                <img :src="product.post_img_m" />
              </router-link>
              <div class="c-product-cart__info">
                <div class="c-product-cart__name">
                  <router-link
                    :to="'/brand/' + product.post_link_brand"
                    class="c-product-cart__name-brand"
                  >
                    {{ product.post_attr_brand }}
                  </router-link>

                  <router-link
                    :to="{
                      name: 'product',
                      params: {
                        productName: extractProductName(product.permalink),
                        productData: product,
                      },
                    }"
                    class="c-product-cart__name-title"
                  >
                    {{ product.name }}
                  </router-link>

                  <div class="mb-3">
                    Размер: {{ product.size_selected[0].name }}
                  </div>
                  <div class="d-flex justify-content-between">
                    <div class="c-price">{{ product.quantity }} шт</div>
                    
                    <div class="c-total">
                      {{ product.price * product.quantity }} {{strings.string.currency}}
                    </div>
                  </div>
                  <div class="c-quantity">
                    <div class="c-quantity__btn">
                      <button 
                        v-show="product.quantity > 1" 
                        @click="quantityMinus(product)" 
                        type="button" 
                        class="u-btn is-minus">-</button>
                      <b>{{product.quantity}}</b>
                      <button 
                        @click="quantityPlus(product)" 
                        type="button" 
                        class="u-btn is-plus">+</button>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

          <div class="l-sidebar-cart">
            <form
              class="l-checkout__coupon l-sidebar-cart__cupons actions"
              method="post"
            >
              <h2 class="u-h3">Coupons</h2>
              <div class="c-form-cupons">
                <input
                  type="text"
                  name="coupon_code"
                  id="coupon_code"
                  value=""
                  placeholder="Promo code"
                />
                <button
                  type="submit"
                  name="apply_coupon"
                  value="Apply coupon"
                  class="u-btn-submit"
                >
                  <svg width="26px" height="14px" class="">
                    <use xlink:href="#big-arrow"></use>
                  </svg>
                </button>
              </div>
            </form>

            <div class="l-sidebar-cart__total actions">
              <h2 class="u-h3">Your order</h2>
              <ul class="l-sidebar-cart__list">
                <!-- {{ nonce }} -->
                <li class="l-sidebar-cart__item">
                  <span>Order amount</span>
                  <span class="c-price">{{ getTotalAmount }}</span>
                </li>
                <li class="l-sidebar-cart__item">
                  <span>Shipping</span>
                  <span>Free !</span>
                  <!-- <span class="c-price">{{shipping}}</span> -->
                </li>

                <!-- {% if coupons %}
									{% for item in coupons %}
										<li class="l-sidebar-cart__item is-red">
											<span>{{ 'Discount Coupon' | translateString('Cart - Discount Coupon') }}</span>
											<span>-{{item.amount}} {{currency}}</span>
										</li>
									{% endfor %}
								{% endif %} -->

                <li class="l-sidebar-cart__item">
                  <span>Total</span>
                  <span>{{ getTotalAmount }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import Api from "@/api/Axios";
import { mapGetters, mapMutations } from "vuex";
import waitRequest from '@/mixins/waitRequest';
import { extractProductName, stripSlug, stripLang } from '@/assets/js/utils.js';
import stringConfig from '@/config/stringConfig.js'
import CPageLoader from '@/templates/components/C-PageLoader.vue'

import {
  required,
  email,
  minLength,
  maxLength,
  helpers,
} from "vuelidate/lib/validators";

export default {
  data() {
    return {
      formData: {
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        city: "",
        post: "",
        comments: "",
      },
      strings: stringConfig
    };
  },

  mixins: [waitRequest],

  components: {
    CPageLoader,
  },

  computed: {
    ...mapGetters({
      cartProducts: "cart/getCartProducts",
      getCheckoutUrl: "cart/getCheckoutUrl",
      getTotalAmount: "cart/getTotalAmount",
    }),
  },

  validations: {
    formData: {
      firstName: { required, minLength: minLength(2) },
      lastName: { required, minLength: minLength(2) },
      email: { required, email },
      phone: {
        required,
        numeric: helpers.regex("numeric", /^[0-9]+$/),
        minLength: minLength(10),
        maxLength: maxLength(15),
      },
      city: { required, minLength: minLength(3) },
      post: { required, minLength: minLength(2) },
    },
  },

  methods: {
    ...mapMutations({
      setProductToCart: 'cart/setProductToCart',
      setTotalAmount: 'cart/setTotalAmount'
    }),

    submitForm() {
      this.$v.$touch()
      if (this.$v.$invalid) return;

      this.waitRequest(() => {
        Api.post("cart/create_order", {
          products: this.cartProducts,
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          phone: this.formData.phone,
          email: this.formData.email,
          city: this.formData.city,
          post: this.formData.post,
          comments: this.formData.comments,
        })
        .then((result) => {
          const url = new URL(result.data);
          const path = url.pathname + url.search;
          const numbers = path.match(/order-received\/(\d+)\//)[1];
          const orderKey = path.match(/key=([^&]+)/)[1];

          this.$router.push({ name: 'order-received', params: { numbers, 'order-key': orderKey } });
        })
        .catch((error) => {
          console.log(error);
        });
      });
    },

    quantityMinus(product) {
      let addedProduct = { ...product };
      let allProducts = this.cartProducts;
      
      const index = allProducts.findIndex(obj => obj.size_attribute[0].id === addedProduct.size_attribute[0].id);

      if (index !== -1) {
        allProducts[index].quantity -= 1;
      } else {
        allProducts.push(addedProduct);
      }

      // // Обновление состояния корзины
      this.setProductToCart(allProducts);
      this.setTotalAmount();
    },

    quantityPlus(product) {
      let addedProduct = { ...product };
      let allProducts = this.cartProducts;
      
      const index = allProducts.findIndex(obj => obj.size_attribute[0].id === addedProduct.size_attribute[0].id);

      if (index !== -1) {
        allProducts[index].quantity += 1;
      } else {
        allProducts.push(addedProduct);
      }

      // // Обновление состояния корзины
      this.setProductToCart(allProducts);
      this.setTotalAmount();
    },

    extractProductName,
    stripSlug,
    stripLang,
  },
};
</script>
