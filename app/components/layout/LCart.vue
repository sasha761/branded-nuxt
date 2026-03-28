<template>
  <div v-if="cartProducts.length" class="l-cart">
    <component :is="headingTag" v-if="title" class="u-h3">
      {{ title }}
    </component>

    <div
      v-for="(product, index) in cartProducts"
      :key="getProductKey(product, index)"
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

          <div
            v-if="getSelectedSizeName(product)"
            class="is-size mb-3"
          >
            {{ texts.sizeLabel }} {{ getSelectedSizeName(product) }}
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
                  type="button"
                  class="u-btn is-plus"
                  @click="quantityPlus(product)"
                >+</button>
              </div>
            </div>
          </div>

          <div class="d-block d-sm-none align-items-center">
            <div class="c-price">{{ getProductTotal(product) }} {{ $t('currency') }}</div>
            <div class="c-remove" @click="removeFromCart(product)">
              <svg width="20px" height="20px"><use xlink:href="#icon-close"></use></svg>
              <span>{{ texts.removeLabel }}</span>
            </div>
          </div>
        </div>

        <div class="d-none d-sm-block">
          <div class="c-price">{{ getProductTotal(product) }} {{ $t('currency') }}</div>
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
})

const cartStore = useCartStore()
const { locale } = useI18n()

const cartProducts = computed(() => cartStore.cartProducts)
const texts = computed(() => (
  locale.value === 'uk'
    ? {
        brandPrefix: 'Бренд: ',
        sizeLabel: 'Розмір: ',
        quantityLabel: 'Кількість: ',
        removeLabel: 'Видалити',
        emptyCart: 'Кошик порожній',
      }
    : {
        brandPrefix: 'Бренд: ',
        sizeLabel: 'Размер: ',
        quantityLabel: 'Количество: ',
        removeLabel: 'Удалить',
        emptyCart: 'Корзина пуста',
      }
))
const resolvedEmptyText = computed(() => props.emptyText || texts.value.emptyCart)

function getSelectedSizeId(product) {
  return product?.size_selected?.[0]?.id ?? null
}

function getSelectedSizeName(product) {
  return product?.size_selected?.[0]?.name ?? ''
}

function getProductKey(product, index) {
  const sizeId = getSelectedSizeId(product)
  return sizeId ? `${product.id}-${sizeId}` : `${product.id}-${index}`
}

function getProductTotal(product) {
  return (Number(product?.price) || 0) * (Number(product?.quantity) || 0)
}

function updateCartProducts(products) {
  cartStore.setProductToCart(products)
  cartStore.setTotalAmount()
}

function findProductIndex(products, product) {
  const targetSizeId = getSelectedSizeId(product)

  if (targetSizeId !== null) {
    return products.findIndex((item) => getSelectedSizeId(item) === targetSizeId)
  }

  return products.findIndex((item) => item.id === product.id)
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

  if (index === -1) {
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
