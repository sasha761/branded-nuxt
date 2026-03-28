<template>
  <main
    class="p-product"
    :data-id="product?.id"
    :data-price="product?.price"
    :data-categories="getProductCategory"
  >
    <UiCPageLoader v-if="pending"/>
    <div class="u-container">
      <UiCBreadcrumbs type="product" :url="String(route.params.productName)" :items="breadcrumbs" />

      <section class="l-product" v-if="product">
        <div class="row">
          <div class="col-lg-6 col-md-12 col-sm-12 u-col">
            <div class="l-product__img">
              <a
                v-if="product.post_img_xl"
                :href="product.post_img_xl"
                class="js-lightbox"
                @click.prevent="openLightbox(0)"
              >
                <img :src="product.post_img_xl" alt="" height="1440" width="1000">
              </a>
            </div>
          </div>
          <div class="col-lg-5 col-md-12 u-col">
            <div class="l-product__content">
              <NuxtLink
                v-if="product.post_brand_path"
                :to="product.post_brand_path"
                class="l-product__category"
              >
                {{ product.post_attr_brand }}
              </NuxtLink>

              <h1 class="l-product__name">{{ product.name }}</h1>
              <p class="c-price" v-html="product.price_html"></p>

              <form class="c-product-form" :data-product_id="product.id">
                <span v-if="product.size_attribute" class="c-product-form__size">Размер</span>

                <ClientOnly>
                  <vSelect
                    v-if="product.size_attribute"
                    v-model="selectedSize"
                    :options="product.size_attribute"
                    label="name"
                  />
                </ClientOnly>

                <div class="c-product-form__btn">
                  <UiCButton
                    v-if="product.is_stock != 'outofstock'"
                    class="u-btn is-medium is-black"
                    @button-click="addProductToCart(product)"
                    :value="product.id"
                  >
                    В корзину
                  </UiCButton>

                  <UiCButton
                    v-if="product.is_stock != 'outofstock'"
                    class="u-btn is-medium is-black-border"
                    @button-click="quickBuyModal"
                  >
                    Купить в 1 клик
                  </UiCButton>

                  <div v-if="product.is_stock == 'outofstock'" class="l-product__manage-stock u-h3 is-red">Out of stock</div>
                </div>
              </form>

              <div class="l-product__text">
                <h4 class="l-product__text-title">Описание:</h4>
                <div v-if="product.sku">
                  <span>Артикул: </span> <span>{{ product.sku }}</span>
                </div>
                <div v-html="product.description"></div>
              </div>

              <div class="l-product__info" v-if="product.product_info">
                <UiCAccordion :accordion-info="product.product_info" />
              </div>
            </div>
          </div>
        </div>
        <div class="row d-none d-lg-flex" v-if="hasProductImages">
          <div
            class="col-lg-6 u-col"
            v-for="(imageItem, index) in preparedProductImages"
            :key="imageItem.id"
          >
            <a
              :href="imageItem.url"
              class="js-lightbox"
              @click.prevent="openLightbox(index + 1)"
            >
              <img :src="imageItem.url" alt="" height="1440" width="1000">
            </a>
          </div>
        </div>
      </section>
    </div>
    <LayoutLRelated :products="relatedProducts"/>
    <LayoutLSubscribe />
  </main>
</template>

<script setup>
import vSelect from 'vue-select'

const route = useRoute()
const { locale } = useI18n()
// const { stripDomain } = useProductUtils()
const cartStore = useCartStore()
const { open } = usePopup()
// const { requestInProgress, waitRequest } = useWaitRequest()


const productSlug = computed(() => String(route.params.productName || ''))


const { data: productPageData, pending, error: fetchError } = await useAsyncData(
  `product:${productSlug.value}:${locale.value}`,
  async ( {signal} ) => {
    const [
      productResult, 
      seoResult,
      breadcrumbsResult
    ] = await Promise.all([
      $fetch('/api/product/get_single_product', {
        params: {
          url: productSlug.value,
          lang: locale.value,
        },
        signal,
      }),
      $fetch('/api/seo/get_seo', {
        method: 'POST',
        body: {
          url: productSlug.value,
          type: 'product',
          lang: locale.value,
        },
        signal,
      }),
      $fetch('/api/seo/get_breadcrumbs', {
        method: 'POST',
        body: {
          url: productSlug.value,
          type: 'product',
          lang: locale.value,
        },
        signal,
      }),
    ])

    return {
      product: productResult,
      seo: seoResult,
      breadcrumbs: breadcrumbsResult?.breadcrumbs || [],
    }
  },
  {
    default: () => ({
      product: null,
      seo: null,
      breadcrumbs: [],
    }),
  }
)

const product = computed(() => productPageData.value?.product ?? null)
const seoData = computed(() => productPageData.value?.seo ?? null)
const breadcrumbs = computed(() => productPageData.value?.breadcrumbs ?? [])

if (fetchError.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}


useSeo(seoData)

const selectedSize = ref(
  product.value?.size_attribute?.[0]
    ?? { availability: true, id: product.value?.id, name: 'one size' }
)
const relatedProducts = product.value?.related_products || []
const preparedProductImages = (product.value?.images || []).map((url, i) => ({ id: `img-${i}`, url }))
const hasProductImages = product.value?.images?.length > 0
const getProductCategory = product.value?.cats?.join(', ') || ''

function addProductToCart(prod) {
  let addedProduct = { ...prod }
  let allProducts = [...cartStore.cartProducts]
  addedProduct.quantity = 1

  if (addedProduct.size_attribute === undefined) {
    addedProduct.size_attribute = [{ availability: true, id: addedProduct.id, name: 'one size' }]
  }

  addedProduct.size_selected = selectedSize.value?.name
    ? addedProduct.size_attribute.filter(obj => obj.name === selectedSize.value.name)
    : [{ availability: true, id: addedProduct.id, name: 'one size' }]

  const index = allProducts.findIndex(obj => obj.size_selected[0].id === selectedSize.value.id)

  if (index !== -1) {
    allProducts[index].quantity += 1
  } else {
    allProducts.push(addedProduct)
  }

  cartStore.setProductToCart(allProducts)
  cartStore.setTotalAmount()
}

function openLightbox(index = 0) {
  const images = [
    product.value.post_img_xl,
    ...(product.value.images || []),
    product.value.video,
  ].filter(Boolean)

  if (!images.length) return

  open('PopupLightbox', { images, slideKey: index })
}

function quickBuyModal() {
  open('PopupQuickBuy', { product: product.value })
}
</script>

<style lang="scss">
  @import "~/assets/scss/page/product.scss";
  @import "~/assets/scss/components/product-form.scss";
  @import "~/assets/scss/layout/product.scss";
</style>