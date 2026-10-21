<template>
  <div class="c-modal c-mobile-menu is-more">
    <div class="c-modal__title">
      <h3 class="u-h3">{{ $t('menu') }}</h3>
      <svg @click="handleCloseClick" width="20px" height="20px">
        <use xlink:href="#icon-close"></use>
      </svg>
    </div>

    <ul>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="20px"><use xlink:href="#shipping-store"></use></svg>
        <NuxtLink :to="localePath('/')">{{ $t('main') }}</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="20px"><use xlink:href="#info"></use></svg>
        <NuxtLink :to="siteLink('about')">{{ $t('about') }}</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="25px"><use xlink:href="#open-box-checked"></use></svg>
        <NuxtLink :to="siteLink('delivery')">{{ $t('delivery') }}</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="25px"><use xlink:href="#open-box"></use></svg>
        <NuxtLink :to="siteLink('returns')">{{ $t('returns') }}</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="21px" height="20px" class="is-phone"><use xlink:href="#icon-phone"></use></svg>
        <a href="tel:+380663156536">{{ $t('call_us') }}</a>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="17px" height="20px"><use xlink:href="#coment"></use></svg>
        <NuxtLink :to="siteLink('reviews')">{{ $t('reviews') }}</NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object },
})

const localePath = useLocalePath()
const siteLink = useSiteLink()
const { close } = usePopup()

function handleCloseClick() {
  close(1)
}
</script>


<style lang="scss">
@import "~/assets/scss/components/mobile-menu.scss";
</style>
