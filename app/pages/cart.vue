<template>
  <main class="p-cart">
    <div class="u-container">
      <div class="p-cart__flex">
        <div v-if="cartProducts.length" class="l-cart">
          <h1 class="u-h3">Корзина</h1>

          <div v-for="(product, index) in cartProducts" :key="index" class="c-product-cart">
            <NuxtLink :to="stripDomain(product.permalink)" class="c-product-cart__img">
              <img :src="product.post_img_m">
            </NuxtLink>
            <div class="c-product-cart__info">
              <div class="c-product-cart__name">
                <NuxtLink
                  v-if="product.post_brand_url"
                  :to="stripDomain(product.post_brand_url)"
                  class="c-product-cart__name-brand"
                >
                  Бренд: {{ product.post_attr_brand }}
                </NuxtLink>
                <NuxtLink :to="stripDomain(product.permalink)" class="c-product-cart__name-title">
                  {{ product.name }}
                </NuxtLink>
                <div v-if="product.size_selected" class="is-size mb-3">Размер: {{ product.size_selected[0].name }}</div>
                <div class="is-quantity mb-3">
                  <div class="c-quantity">
                    <span>Количество: </span>
                    <div class="c-quantity__btn">
                      <button v-show="product.quantity > 1" @click="quantityMinus(product)" type="button" class="u-btn is-minus">-</button>
                      <b>{{ product.quantity }}</b>
                      <button @click="quantityPlus(product)" type="button" class="u-btn is-plus">+</button>
                    </div>
                  </div>
                </div>
                <div class="d-block d-sm-none align-items-center">
                  <div class="c-price">{{ product.price * product.quantity }}</div>
                  <div @click="removeFromCart(product)" class="c-remove">
                    <svg width="20px" height="20px"><use xlink:href="#icon-close"></use></svg>
                    <span>Удалить</span>
                  </div>
                </div>
              </div>
              <div class="d-none d-sm-block">
                <div class="c-price">{{ product.price * product.quantity }} {{ $t('currency') }}</div>
                <div @click="removeFromCart(product)" class="c-remove">
                  <svg width="20px" height="20px"><use xlink:href="#icon-close"></use></svg>
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
                <svg width="26px" height="14px"><use xlink:href="#big-arrow"></use></svg>
              </button>
            </div>
          </div>

          <div class="l-sidebar-cart__total actions">
            <h2 class="u-h3">Ваш заказ</h2>
            <ul class="l-sidebar-cart__list">
              <li class="l-sidebar-cart__item">
                <span>Сумма заказа</span>
                <span class="c-price">{{ cartStore.totalAmount }} {{ $t('currency') }}</span>
              </li>
              <li class="l-sidebar-cart__item">
                <span>Доставка</span>
                <span class="c-price">0 {{ $t('currency') }}</span>
              </li>
              <li class="l-sidebar-cart__item">
                <span>Всего</span>
                <span>{{ cartStore.totalAmount }} {{ $t('currency') }}</span>
              </li>
              <NuxtLink :to="localePath('/checkout-2')" class="u-btn is-black">Оформить заказ</NuxtLink>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup>
const localePath = useLocalePath()
const cartStore = useCartStore()
const { stripDomain } = useProductUtils()

const cartProducts = computed(() => cartStore.cartProducts)

function removeFromCart(product) {
  let allProducts = [...cartStore.cartProducts]
  const index = allProducts.findIndex(obj => obj.id === product.id)
  if (index !== -1) {
    allProducts.splice(index, 1)
  }
  cartStore.setProductToCart(allProducts)
  cartStore.setTotalAmount()
}

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
</script>

<style lang="scss">
  @import "~/assets/scss/page/cart.scss";
  @import "~/assets/scss/layout/cart.scss";
  @import "~/assets/scss/layout/sidebar-cart.scss";
  @import "~/assets/scss/components/product-cart.scss";
  @import "~/assets/scss/components/quantity.scss";
</style>