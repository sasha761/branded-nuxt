<template>
  <div class="c-modal c-mobile-menu is-more">
    <div class="c-modal__title">
      <h3 class="u-h3">Меню</h3>
      <svg @click="handleCloseClick" width="20px" height="20px">
        <use xlink:href="#icon-close"></use>
      </svg>
    </div>

    <ul>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="20px"><use xlink:href="#shipping-store"></use></svg>
        <NuxtLink :to="localePath('/')">Главная</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="20px"><use xlink:href="#info"></use></svg>
        <NuxtLink :to="localePath('/about-us')">О нас</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="25px"><use xlink:href="#open-box-checked"></use></svg>
        <NuxtLink :to="localePath('/dostavka-i-oplata')">Доставка и оплата</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="20px" height="25px"><use xlink:href="#open-box"></use></svg>
        <NuxtLink :to="localePath('/vozvrat-i-obmen')">Возврат и обмен</NuxtLink>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="21px" height="20px" class="is-phone"><use xlink:href="#icon-phone"></use></svg>
        <a href="tel:">Позвоните нам</a>
      </li>
      <li class="c-mobile-menu__link">
        <svg width="17px" height="20px"><use xlink:href="#coment"></use></svg>
        <NuxtLink :to="localePath('/reviews')">Отзывы</NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Object },
})

const localePath = useLocalePath()
const { close } = usePopup()

function handleCloseClick() {
  close(1)
}
</script>


<style lang="scss">
@import "~/assets/scss/components/mobile-menu.scss";
</style>