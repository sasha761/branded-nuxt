<template>
  <main
    class="p-product"
    :data-id="product?.id"
    :data-price="product?.price"
    :data-categories="productCategories"
  >
    <UiCPageLoader v-if="productStatus === 'pending'"/>
    <div class="u-container">
      <UiCBreadcrumbs :items="pageRoute?.breadcrumbs" :title="product?.name" />

      <section class="l-product" v-if="product">
        <div class="row">
          <div class="col-lg-6 col-md-12 col-sm-12 u-col">
            <!-- До 991px — слайдер Swiper со всеми фото, как в теме WP; с 992px — главное фото, остальные сеткой ниже -->
            <div class="l-product__img">
              <div ref="sliderEl" class="swiper l-product__slider">
                <div class="swiper-wrapper">
                  <div
                    v-for="(image, index) in productImages"
                    :key="image.id ?? index"
                    class="swiper-slide"
                    :class="{ 'l-product__slide-extra': index > 0 }"
                  >
                    <!-- Ссылка на оригинал, как в теме WP: её индексирует Google Images -->
                    <a
                      :href="image.original"
                      class="js-lightbox"
                      @click.prevent="openLightbox(index)"
                    >
                      <picture>
                        <source :srcset="image.desktop" media="(min-width: 426px)">
                        <source :srcset="image.mobile" media="(max-width: 425px)">
                        <img
                          :src="image.desktop"
                          :alt="image.alt"
                          :title="index === 0 ? product.name : undefined"
                          :width="image.width"
                          :height="image.height"
                          :fetchpriority="index === 0 ? 'high' : undefined"
                          :loading="index === 0 ? undefined : 'lazy'"
                          :decoding="index === 0 ? undefined : 'async'"
                        >
                      </picture>
                    </a>
                  </div>
                </div>
              </div>
              <div v-if="productImages.length > 1" ref="paginationEl" class="swiper-pagination l-product__pagination"></div>
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

              <form class="c-product-form" :data-product_id="product.id" @submit.prevent>
                <!-- Вариации по всем атрибутам: размер списком, цвет квадратиками, как на сайте WP -->
                <template v-if="hasVariations">
                  <div
                    v-for="attribute in visibleAttributes"
                    :key="attribute.name"
                    class="c-product-form__attribute"
                  >
                    <span class="c-product-form__size">
                      <span>
                        {{ attribute.label }}<template v-if="attribute.type === 'color' && selectedOption(attribute)">:
                          <b class="c-product-form__value">{{ selectedOption(attribute).name }}</b>
                        </template>
                      </span>
                    </span>

                    <div
                      v-if="attribute.type === 'color'"
                      class="c-product-form__colors"
                      role="radiogroup"
                      :aria-label="attribute.label"
                    >
                      <button
                        v-for="option in attribute.options"
                        :key="option.slug"
                        type="button"
                        role="radio"
                        class="c-product-form__color"
                        :class="{
                          'is-active': selected[attribute.name] === option.slug,
                          'is-unavailable': !isAvailable(attribute.name, option.slug),
                          'is-text': !option.color,
                        }"
                        :aria-checked="selected[attribute.name] === option.slug"
                        :aria-label="option.name"
                        :title="option.name"
                        :disabled="!isSelectable(attribute.name, option.slug)"
                        @click="select(attribute.name, option.slug)"
                      >
                        <span v-if="option.color" class="c-product-form__color-fill" :style="{ backgroundColor: option.color }"></span>
                        <template v-else>{{ option.name }}</template>
                      </button>
                    </div>

                    <ClientOnly v-else>
                      <vSelect
                        :model-value="selectedOption(attribute)"
                        :options="attribute.options"
                        label="name"
                        :clearable="false"
                        :searchable="false"
                        :selectable="option => isSelectable(attribute.name, option.slug)"
                        @update:model-value="option => option && select(attribute.name, option.slug)"
                      />
                    </ClientOnly>
                  </div>
                </template>

                <!-- Простой товар или WP без variation_attributes: прежний выбор размера -->
                <template v-else-if="product.size_attribute?.length">
                  <span class="c-product-form__size">{{ t('size') }}</span>

                  <ClientOnly>
                    <vSelect
                      v-model="selectedSize"
                      :options="product.size_attribute"
                      label="name"
                      :clearable="false"
                    />
                  </ClientOnly>
                </template>

                <div class="c-product-form__btn">
                  <template v-if="canBuy">
                    <UiCButton
                      class="u-btn is-medium is-black"
                      @button-click="addProductToCart"
                      :value="product.id"
                    >
                      {{ t('add_to_cart') }}
                    </UiCButton>

                    <UiCButton
                      class="u-btn is-medium is-black-border"
                      @button-click="quickBuyModal"
                    >
                      {{ t('buy_one_click') }}
                    </UiCButton>
                  </template>

                  <div v-else class="l-product__manage-stock u-h3 is-red">{{ t('out_of_stock') }}</div>
                </div>
              </form>

              <div class="l-product__text">
                <h4 class="l-product__text-title">{{ t('description') }}:</h4>
                <div v-if="product.specs?.sku">
                  <span>{{ t('sku') }}: </span> <span>{{ product.specs.sku }}</span>
                </div>
                <div v-html="product.description"></div>
              </div>

              <div class="l-product__info" v-if="accordionItems.length">
                <UiCAccordion :items="accordionItems" />
              </div>
            </div>
          </div>
        </div>
        <div class="row d-none d-lg-flex" v-if="galleryImages.length">
          <div
            class="col-lg-6 u-col"
            v-for="(imageItem, index) in galleryImages"
            :key="imageItem.id"
          >
            <a
              :href="imageItem.original"
              class="js-lightbox"
              @click.prevent="openLightbox(index + 1)"
            >
              <img
                :src="imageItem.src"
                :alt="imageItem.alt"
                :width="imageItem.width"
                :height="imageItem.height"
                loading="lazy"
                decoding="async"
              >
            </a>
          </div>
        </div>
      </section>
    </div>
    <LayoutLComments v-if="product" :comments="product.comments || []" :product-id="product.id" />
    <LayoutLRelated v-if="relatedProducts.length" :products="relatedProducts"/>
    <LayoutLSubscribe />
  </main>
</template>

<script setup>
import vSelect from 'vue-select'
import Swiper from 'swiper'
import { Autoplay, FreeMode, Pagination } from 'swiper/modules'

const route = useRoute()
const { locale, t } = useI18n()
const cartStore = useCartStore()
const analytics = useAnalytics()
const { open } = usePopup()

const path = useCurrentPath().value
const productSlug = String(route.params.productName || '')

const [routeRequest, productRequest] = await Promise.all([
  useRouteData(path),
  useAsyncData(`product:${path}`, (_nuxtApp, { signal }) => $fetch('/api/product/get_single_product', {
    params: { url: productSlug, lang: locale.value },
    signal,
  })),
])

await guardPageRoute(routeRequest.data.value, routeRequest.error.value, productRequest.error.value)

const pageRoute = routeRequest.data
const product = computed(() => productRequest.data.value ?? null)
const productStatus = productRequest.status

usePageSeo(pageRoute)

const inStock = computed(() => product.value?.specs?.in_stock ?? product.value?.is_stock !== 'outofstock')
const selectedSize = ref(
  product.value?.size_attribute?.find(size => size.availability) ?? product.value?.size_attribute?.[0] ?? null
)

const {
  hasVariations,
  visibleAttributes,
  selected,
  variation,
  selection,
  select,
  selectedOption,
  isAvailable,
  isSelectable,
} = useProductVariation(product)

// Выбор для корзины: вариация по всем атрибутам, иначе прежний размер
const cartSelection = computed(() => (hasVariations.value ? selection.value : selectedSize.value))
const canBuy = computed(() => inStock.value && (!hasVariations.value || Boolean(variation.value?.in_stock)))
const relatedProducts = computed(() => product.value?.related_products || [])
const productCategories = computed(() => product.value?.specs?.categories?.join(', ') || '')

// single_xl 840×1080 для экранов шире 425px, archive_xl 532×665 для узких — как в теме WP
function imageView(image, fallbackAlt) {
  const desktop = image?.sizes?.single_xl || image?.sizes?.large
  const mobile = image?.sizes?.archive_xl || desktop

  return {
    id: image?.id,
    original: image?.src,
    desktop: desktop?.src || image?.src,
    mobile: mobile?.src || image?.src,
    src: desktop?.src || image?.src,
    alt: image?.alt || fallbackAlt,
    width: desktop?.width || image?.width,
    height: desktop?.height || image?.height,
  }
}

const mainImage = computed(() => {
  const image = product.value?.image
  if (image) return imageView(image, product.value.name)

  // Старые поля, если у товара нет объекта картинки
  return product.value?.post_img_xl
    ? { original: product.value.post_img_xl, desktop: product.value.post_img_xl, mobile: product.value.post_img_xl, src: product.value.post_img_xl, alt: product.value.name, width: 1000, height: 1440 }
    : null
})

const galleryImages = computed(() => (product.value?.gallery || []).map(image => imageView(image, product.value.name)))
// Слайды мобильной галереи: главное фото + галерея (порядок как в lightbox)
const productImages = computed(() => [mainImage.value, ...galleryImages.value].filter(Boolean))

// Слайдер фото — только пока фото идут в одну колонку (до 991px), как initProductGallerySlider в теме WP
const SLIDER_MEDIA = '(max-width: 991px)'
const sliderEl = ref(null)
const paginationEl = ref(null)
let slider = null
let sliderMedia = null

function toggleSlider() {
  const enable = Boolean(sliderMedia?.matches && productImages.value.length > 1)

  if (enable && !slider && sliderEl.value) {
    slider = new Swiper(sliderEl.value, {
      modules: [Pagination, Autoplay, FreeMode],
      watchOverflow: true,
      spaceBetween: 7,
      autoplay: {
        delay: 2500,
        stopOnLastSlide: false,
        disableOnInteraction: true,
      },
      pagination: {
        el: paginationEl.value,
        clickable: true,
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
        },
        576: {
          slidesPerView: 'auto',
          freeMode: {
            enabled: true,
            sticky: true,
          },
        },
      },
    })
  } else if (!enable && slider) {
    // Снимает инлайн-стили Swiper: на десктопе снова главное фото и сетка галереи
    slider.destroy(true, true)
    slider = null
  }
}

onMounted(() => {
  sliderMedia = window.matchMedia(SLIDER_MEDIA)
  sliderMedia.addEventListener('change', toggleSlider)
  toggleSlider()
})

onBeforeUnmount(() => {
  sliderMedia?.removeEventListener('change', toggleSlider)
  slider?.destroy(true, true)
  slider = null
})

// LCP: главное фото начинает грузиться вместе с HTML
useHead(() => ({
  link: mainImage.value
    ? [
        { rel: 'preload', as: 'image', href: mainImage.value.desktop, media: '(min-width: 426px)', fetchpriority: 'high', key: 'lcp-desktop' },
        { rel: 'preload', as: 'image', href: mainImage.value.mobile, media: '(max-width: 425px)', fetchpriority: 'high', key: 'lcp-mobile' },
      ]
    : [],
}))

// Характеристики из specs с подписями на языке страницы, остальное — блоки ACF бренда (HTML)
const accordionItems = computed(() => {
  const info = product.value?.product_info || {}
  const specs = product.value?.specs
  const items = []

  if (specs) {
    const rows = [
      specs.brand && { label: t('brand'), value: specs.brand, path: specs.brand_path },
      specs.categories?.length && { label: t('category'), value: specs.categories.join(', ') },
      specs.sku && { label: t('sku'), value: specs.sku },
      { label: t('availability'), value: specs.in_stock ? t('inStock') : t('outOfStock') },
    ].filter(Boolean)

    items.push({ key: 'specification', title: t('specification'), rows })
  }

  for (const key of ['delivery_and_return', 'payment_method']) {
    if (info[key]) {
      items.push({ key, title: t(key), html: info[key] })
    }
  }

  return items
})

onMounted(() => {
  if (product.value) {
    analytics.viewItem(product.value)
  }
})

function addProductToCart() {
  cartStore.addProduct(product.value, cartSelection.value)
  analytics.addToCart(product.value)
}

function openLightbox(index = 0) {
  const images = [
    mainImage.value?.original,
    ...galleryImages.value.map(image => image.original),
    product.value.video,
  ].filter(item => typeof item === 'string' && item)

  if (!images.length) return

  open('PopupLightbox', { images, slideKey: index, alt: product.value.name })
}

function quickBuyModal() {
  open('PopupQuickBuy', { product: product.value, size: cartSelection.value })
}
</script>

<style lang="scss">
  @import "~/assets/scss/page/product.scss";
  @import "~/assets/scss/components/product-form.scss";
  @import "~/assets/scss/layout/product.scss";
</style>
