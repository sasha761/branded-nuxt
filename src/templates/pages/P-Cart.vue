<template>
  <main class="p-cart">
    <div class="u-container">
      <div class="p-cart__flex">
        <div v-if="cartProducts" class="l-cart">
          <h1 class="u-h3">Корзина</h1>
          
          <div v-for="(product, index) in cartProducts" :key="index" class="c-product-cart">
            <router-link
              :to="{ 
                name: 'product', 
                params: { 
                  lang: stripLang(product.permalink) || null,
                  productName: extractProductName(product.permalink), 
                  productData: product 
                }
              }" 
              class="c-product-cart__img"
            >
              <img :src="product.post_img_m">
            </router-link>
            <div class="c-product-cart__info">
              <div class="c-product-cart__name">
                <router-link
                  :to="{ 
                    name: 'brand', 
                    params: {
                      lang: stripLang(product.post_brand_url) || null,
                      brandName: extractProductName(product.post_brand_url), 
                    }
                  }" 
                  class="c-product-cart__name-brand"
                >
                  Бренд: {{product.post_attr_brand}}
                </router-link>
                <router-link
                  :to="{ 
                    name: 'product', 
                    params: { 
                      lang: stripLang(product.permalink) || null,
                      productName: extractProductName(product.permalink), 
                      productData: product 
                    }
                  }" 
                  class="c-product-cart__name-title"
                >
                  {{product.name}}
                </router-link>
                <!-- <pre>{{product}}</pre> -->
                <div v-if="product.size_selected" class="is-size mb-3">Размер: {{product.size_selected[0].name}}</div>
                <!-- {% if product.attr.color %}
                  <div class="is-color mb-3">{{ 'Color' | translateString('Cart - Color') }}: {{product.attr.color}}</div>
                {% endif %} -->
                <div class="is-quantity mb-3">
                  <div class="c-quantity">
                    <span>Количество: </span>  
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

                <div class="d-block d-sm-none align-items-center">
                  <div class="c-price">{{product.price * product.quantity}}</div>

                  <div @click="removeFromCart(product)" class="c-remove">
                    <svg width="20px" height="20px">
                      <use xlink:href="#icon-close"></use>
                    </svg>
                    <span>Удалить</span>
                  </div>
                </div>	
              </div>
              
              <div class="d-none d-sm-block">
                <div class="c-price">{{product.price * product.quantity}} {{strings.string.currency}}</div>
                
                <div @click="removeFromCart(product)" class="c-remove">
                  <svg width="20px" height="20px">
                    <use xlink:href="#icon-close"></use>
                  </svg>
                  <span>Удалить</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="l-cart l-cart-empty">
          <h2>Корзина пуста</h2>
        </div>

        <aside class="l-sidebar-cart actions">
          <div class="l-sidebar-cart__cupons">
            <h2 class="u-h3">Купоны</h2>

            <div class="c-form-cupons">
              <input type="text" name="coupon_code" id="coupon_code" value="" placeholder="Промо код">
              <button type="submit" name="apply_coupon" value="Apply coupon" class="u-btn-submit">
                <svg width="26px" height="14px" class="">
                  <use xlink:href="#big-arrow"></use>
                </svg>
              </button>
            </div>  
          </div>

          <div class="l-sidebar-cart__total actions">
            <h2 class="u-h3">Ваш заказ</h2>
            <ul class="l-sidebar-cart__list">
              <li class="l-sidebar-cart__item">
                <span>Сумма заказа</span>
                <span class="c-price">{{getTotalAmount}} {{strings.string.currency}}</span>
              </li>
              <li class="l-sidebar-cart__item">
                <span>Доставка</span>
                <span class="c-price">0 {{strings.string.currency}}</span>
              </li>

              <li class="l-sidebar-cart__item">
                <span>Всего</span>
                <span>{{getTotalAmount}} {{strings.string.currency}}</span>
              </li>
              
              <router-link :to="{name: 'checkout', params: { checkout: getCheckoutUrl } }" class="u-btn is-black">Оформить заказ</router-link>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>      

<script>
import { mapGetters, mapMutations } from 'vuex';
import { extractProductName, stripSlug, stripLang } from '@/assets/js/utils.js';
import stringConfig from '@/config/stringConfig.js'

export default {
  data() {
    return {
      strings: stringConfig
    }
  },

  computed: {
    ...mapGetters({
      cartProducts: 'cart/getCartProducts',
      getCheckoutUrl: 'cart/getCheckoutUrl',
      getTotalAmount: 'cart/getTotalAmount',
    }),
  },

  methods: {
    ...mapMutations({
      setProductToCart: 'cart/setProductToCart',
      setTotalAmount: 'cart/setTotalAmount'
    }),

    removeFromCart(product) {
      let allProducts = this.cartProducts;

      const index = allProducts.findIndex(obj => obj.id === product.id);

      if (index !== -1) {
        allProducts.splice(index, 1);
      } 

      this.setProductToCart(allProducts);
      this.setTotalAmount();
    },

    quantityMinus(product) {
      let addedProduct = { ...product };
      let allProducts = this.cartProducts;
      
      // const index = allProducts.findIndex(obj => obj.size_attribute[0].id === addedProduct.size_attribute[0].id);
      const index = allProducts.findIndex(obj => 
                      obj.size_selected?.length > 0 && 
                      addedProduct.size_selected?.length > 0 &&
                      obj.size_selected[0].id === addedProduct.size_selected[0].id
                    );


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


      const index = allProducts.findIndex(obj => 
                      obj.size_selected?.length > 0 && 
                      addedProduct.size_selected?.length > 0 &&
                      obj.size_selected[0].id === addedProduct.size_selected[0].id
                    );

      // console.log();              

      console.log(index);
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
  }
}
</script>
