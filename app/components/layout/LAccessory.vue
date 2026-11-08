<template>
  <section class="l-accessory d-none d-lg-block">
    <div class="u-container u-relative">
      <div class="l-accessory__text">
        <h2 class="u-h2">{{ $t('home.accessories_title') }}</h2>
        <p>{{ $t('home.accessories_text') }}</p>
        <NuxtLink :to="siteLink('accessories')" class="u-btn is-black">{{ $t('home.all_collection') }}</NuxtLink>
      </div>

      <div class="text-center">
        <div class="l-accessory__bg">
          <UiCImage
            :src="accessoryBackground"
            alt="accessory background"
            height="829"
            width="824"
            loading="lazy"
            decoding="async"
          />
          <NuxtLink :to="siteLink('accessories')" class="c-circle">
            <svg width="61px" height="19px" class="c-circle__arrow">
              <use xlink:href="#small-arrow"></use>
            </svg>
            <UiCImage
              :src="circleImage"
              alt="circle image"
              width="251"
              height="251"
              loading="lazy"
              decoding="async"
            />
          </NuxtLink>
        </div>
      </div>

      <NuxtLink
        v-for="(item, index) in data"
        :key="index"
        :to="item.path"
        class="l-accessory__block"
        :class="{ 'is-first': index === 0, 'is-second': index === 1 }"
      >
        <div class="l-accessory__block-text">
          <span>{{ item.title }}</span>
          <svg width="61px" height="19px" class="l-accessory__arrow">
            <use xlink:href="#small-arrow"></use>
          </svg>
        </div>
        <picture style="padding: 12px; background-color: white;">
          <UiCImage
            :src="item.img"
            :alt="item.title || $t('home.accessories_alt')"
            :height="item.image_dimensions?.height || 300"
            :width="item.image_dimensions?.width || (index === 1 ? 330 : 300)"
            :style="{ width: `${index === 1 ? 330 : 300}px` }"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import accessoryBackground from '~/assets/img/accessory1.jpg'
import circleImage from '~/assets/img/circle-img.png'

const props = defineProps({
  data: { type: Array },
})

const siteLink = useSiteLink()
</script>

<style lang="scss" scoped>
@import "~/assets/scss/layout/accessory.scss";
@import "~/assets/scss/components/circle.scss";
</style>
