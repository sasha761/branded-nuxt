<template>
  <div
    class="c-product js-product-item"
    :data-id="product.id"
    :data-brand="product.post_attr_brand"
    :data-size="product.post_attr_size"
  >
    <NuxtLink
      :to="product.path"
      class="c-product__img"
      @click="emit('select', product)"
    >
      <picture :style="{ '--card-ratio': `${cardImage.width} / ${cardImage.height}`, '--card-mobile-ratio': `${cardImage.mobileWidth} / ${cardImage.mobileHeight}` }">
        <source
          v-if="cardImage.desktop"
          :srcset="loadImage ? cardImage.desktop : undefined"
          :data-srcset="!loadImage ? cardImage.desktop : undefined"
          :width="cardImage.width"
          :height="cardImage.height"
          media="(min-width: 426px)"
        />
        <source
          v-if="cardImage.mobile"
          :srcset="loadImage ? cardImage.mobile : undefined"
          :data-srcset="!loadImage ? cardImage.mobile : undefined"
          :width="cardImage.mobileWidth"
          :height="cardImage.mobileHeight"
          media="(max-width: 425px)"
        />
        <img
          :src="loadImage ? cardImage.src : undefined"
          :data-src="!loadImage ? cardImage.src : undefined"
          :alt="cardImage.alt"
          :title="product.name"
          :width="cardImage.width"
          :height="cardImage.height"
          :loading="eager ? 'eager' : 'lazy'"
          :fetchpriority="priority ? 'high' : undefined"
          decoding="async"
        />
        <span v-if="product.percent" class="c-product__sale">-{{ product.percent }}%</span>
        <span v-if="product.stockStatus === 'outofstock'" class="c-product__stock">{{ t('out_of_stock') }}</span>
      </picture>
    </NuxtLink>

    <div v-if="isBrand" class="c-product__brand">
      <svg width="61px" height="19px" class="c-product__arrow">
        <use xlink:href="#small-arrow"></use>
      </svg>
      <p>{{ product.post_attr_brand }}</p>
    </div>

    <div v-else class="c-product__text">
      <p class="c-product__text-title">{{ product.name }}</p>
      <p class="c-price" v-html="product.price_html"></p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  product: { type: Object, required: true },
  isBrand: { type: Boolean, default: false },
  // Первые карточки в видимой области грузятся сразу (LCP архива)
  eager: { type: Boolean, default: false },
  priority: { type: Boolean, default: false },
  loadImage: { type: Boolean, default: true },
})

const emit = defineEmits(['select'])
const { t } = useI18n()

// archive_xl (532×665) для экранов шире 425px, archive_md (420×504) для узких — как в теме WP
const cardImage = computed(() => {
  const image = props.product.image
  const desktop = image?.sizes?.archive_xl
  const mobile = image?.sizes?.archive_md

  return {
    desktop: desktop?.src || props.product.post_img_l || '',
    mobile: mobile?.src || props.product.post_img_m || '',
    src: desktop?.src || props.product.post_img_l || image?.src || '',
    alt: image?.alt || props.product.name,
    width: desktop?.width || 532,
    height: desktop?.height || 665,
    mobileWidth: mobile?.width || 420,
    mobileHeight: mobile?.height || 504,
  }
})
</script>

<style lang="scss">
  @import "~/assets/scss/components/product.scss";
</style>
