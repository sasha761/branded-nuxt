<template>
  <div v-if="cartProducts.length" class="l-cart">
    <component :is="headingTag" v-if="title" class="u-h3">
      {{ title }}
    </component>

    <div
      v-for="(product, index) in cartProducts"
      :key="getProductKey(product)"
      class="c-product-cart"
    >
      <NuxtLink
        :to="product.path"
        class="c-product-cart__img"
      >
        <img :src="product.post_img_m" :alt="product.name" />
      </NuxtLink>

      <div class="c-product-cart__info">
        <div class="c-product-cart__name">
          <NuxtLink
            v-if="product.post_brand_path"
            :to="product.post_brand_path"
            class="c-product-cart__name-brand"
          >
            {{ texts.brandPrefix }}
            {{ product.post_attr_brand }}
          </NuxtLink>

          <div
            v-else-if="product.post_attr_brand"
            class="c-product-cart__name-brand"
          >
            {{ texts.brandPrefix }}
            {{ product.post_attr_brand }}
          </div>

          <NuxtLink
            :to="product.path"
            class="c-product-cart__name-title"
          >
            {{ product.name }}
          </NuxtLink>

          <template v-if="getAttributes(product, index).length">
            <div
              v-for="attribute in getAttributes(product, index)"
              :key="attribute.label"
              class="is-size mb-3"
            >
              {{ attribute.label }}: {{ attribute.value }}
            </div>
          </template>

          <div
            v-else-if="getSelectedSizeName(product)"
            class="is-size mb-3"
          >
            {{ texts.sizeLabel }} {{ getSelectedSizeName(product) }}
          </div>

          <div v-if="itemError(index)" class="c-form-error mb-3">
            {{ $t('order_errors.' + itemError(index)) }}
          </div>

          <div class="is-quantity mb-3">
            <div class="c-quantity">
              <span>{{ texts.quantityLabel }}</span>
              <div class="c-quantity__btn">
                <button
                  v-show="product.quantity > 1"
                  type="button"
                  class="u-btn is-minus"
                  @click="quantityMinus(product)"
                >-</button>
                <b>{{ product.quantity }}</b>
                <button
                  v-show="product.quantity < MAX_QUANTITY"
                  type="button"
                  class="u-btn is-plus"
                  @click="quantityPlus(product)"
                >+</button>
              </div>
            </div>
          </div>

          <div class="d-block d-sm-none align-items-center">
            <div class="c-price">{{ getProductTotal(product, index) }} {{ $t('currency') }}</div>
            <div class="c-remove" @click="removeFromCart(product)">
              <svg width="20px" height="20px"><use xlink:href="#icon-close"></use></svg>
              <span>{{ texts.removeLabel }}</span>
            </div>
          </div>
        </div>

        <div class="d-none d-sm-block">
          <div class="c-price">{{ getProductTotal(product, index) }} {{ $t('currency') }}</div>
          <div class="c-remove" @click="removeFromCart(product)">
            <svg width="20px" height="20px"><use xlink:href="#icon-close"></use></svg>
            <span>{{ texts.removeLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="showEmpty" class="l-cart l-cart-empty">
    <h2>{{ resolvedEmptyText }}</h2>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  emptyText: {
    type: String,
    default: '',
  },
  showEmpty: {
    type: Boolean,
    default: false,
  },
  headingTag: {
    type: String,
    default: 'h1',
  },
  // Ответ /api/cart/quote: актуальные цены и ошибки позиций
  quote: {
    type: Object,
    default: null,
  },
})

const MAX_QUANTITY = 10
const cartStore = useCartStore()
const { t } = useI18n()

const cartProducts = computed(() => cartStore.cartProducts)
const texts = computed(() => ({
  brandPrefix: `${t('brand')}: `,
  sizeLabel: `${t('size')}: `,
  quantityLabel: `${t('quantity')}: `,
  removeLabel: t('remove'),
  emptyCart: t('cart_empty'),
}))
const resolvedEmptyText = computed(() => props.emptyText || texts.value.emptyCart)

function getSelectedSizeName(product) {
  return product?.size_selected?.[0]?.name ?? ''
}

function getProductKey(product) {
  return cartLineKey(product)
}

function quoteItem(index) {
  return props.quote?.items?.find(item => item.index === index) ?? null
}

// Размер, цвет…: из котировки на языке страницы, пока её нет — как сохранили при добавлении.
// Позиции, добавленные до выбора цвета, атрибутов не хранят — у них прежняя строка размера.
function getAttributes(product, index) {
  const saved = product?.attributes || []
  if (!saved.length) return []

  const names = new Set(saved.map(attribute => attribute.name))
  const quoted = (quoteItem(index)?.attributes || []).filter(attribute => names.has(attribute.name))

  return quoted.length ? quoted : saved
}

function itemError(index) {
  return quoteItem(index)?.error ?? null
}

// Сумма позиции из котировки WP; пока её нет — по цене, сохранённой в корзине
function getProductTotal(product, index) {
  const item = quoteItem(index)
  if (item && !item.error) return item.line_total
  return (Number(product?.price) || 0) * (Number(product?.quantity) || 0)
}

function updateCartProducts(products) {
  cartStore.setProductToCart(products)
  cartStore.setTotalAmount()
}

function findProductIndex(products, product) {
  const key = cartLineKey(product)
  return products.findIndex(item => cartLineKey(item) === key)
}

function quantityMinus(product) {
  const allProducts = [...cartStore.cartProducts]
  const index = findProductIndex(allProducts, product)

  if (index === -1 || allProducts[index].quantity <= 1) {
    return
  }

  allProducts[index] = {
    ...allProducts[index],
    quantity: allProducts[index].quantity - 1,
  }

  updateCartProducts(allProducts)
}

function quantityPlus(product) {
  const allProducts = [...cartStore.cartProducts]
  const index = findProductIndex(allProducts, product)

  // WP принимает до 10 штук одной позиции
  if (index === -1 || allProducts[index].quantity >= MAX_QUANTITY) {
    return
  }

  allProducts[index] = {
    ...allProducts[index],
    quantity: allProducts[index].quantity + 1,
  }

  updateCartProducts(allProducts)
}

function removeFromCart(product) {
  const allProducts = [...cartStore.cartProducts]
  const index = findProductIndex(allProducts, product)

  if (index === -1) {
    return
  }

  allProducts.splice(index, 1)
  updateCartProducts(allProducts)
}
</script>

<style lang="scss" scoped>
  @import "~/assets/scss/layout/cart.scss";
  @import "~/assets/scss/components/product-cart.scss";
  @import "~/assets/scss/components/quantity.scss";
</style>
