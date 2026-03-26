<template>
  <section class="c-sticky-menu">
    <ul class="c-sticky-menu__row">
      <li>
        <NuxtLink :to="localePath('/')" class="c-sticky-menu__item">
          <svg width="20px" height="20px">
            <use xlink:href="#icon-home"></use>
          </svg>
          <span>{{ te('main') ? t('main') : 'Main' }}</span>
        </NuxtLink>
      </li>
      <li class="c-sticky-menu__item" @click="mobileMenuModal" data-modal="#mobile-menu">
        <svg width="24px" height="20px">
          <use xlink:href="#catalog"></use>
        </svg>
        <span>{{ te('catalog') ? t('catalog') : 'Catalog' }}</span>
      </li>
      <li>
        <NuxtLink :to="localePath('/cart')" class="c-sticky-menu__item">
          <ClientOnly>
            <template #default>
              <span
                v-if="cartStore.cartProducts.length"
                class="c-service__count"
              >
                {{ cartStore.cartProducts.length }}
              </span>
            </template>
            <template #fallback></template>
          </ClientOnly>

          <svg width="20px" height="20px">
            <use xlink:href="#bag"></use>
          </svg>
          <span>{{ te('cart') ? t('cart') : 'Cart' }}</span>
        </NuxtLink>
      </li>
      <li class="c-sticky-menu__item" @click="mobileSearchModal" data-modal="#mobile-search">
        <svg width="17px" height="20px" stroke="#333">
          <use xlink:href="#search"></use>
        </svg>
        <span>{{ te('search') ? t('search') : 'Search' }}</span>
      </li>
      <li class="c-sticky-menu__item" @click="mobileMenuMoreModal" data-modal="#mobile-menu-more">
        <svg width="30px" height="20px">
          <use xlink:href="#dots"></use>
        </svg>
        <span>{{ te('more') ? t('more') : 'More' }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
const props = defineProps({
  mobileMenu: {
    type: [Object, Array],
    default: () => ({}),
  },
})

const localePath = useLocalePath()
const cartStore = useCartStore()
const { open } = usePopup()

const { t, te } = useI18n()


function mobileSearchModal() {
  open('PopupSearch', { menu: props.mobileMenu })
}

function mobileMenuMoreModal() {
  open('PopupMobileMenuMore', { menu: '' })
}

function mobileMenuModal() {
  open('PopupMobileMenu', { menu: props.mobileMenu })
}
</script>


<style lang="scss">
@import "~/assets/scss/components/service.scss";
@import "~/assets/scss/components/sticky-menu.scss";
</style>