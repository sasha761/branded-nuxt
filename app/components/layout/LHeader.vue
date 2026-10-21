<template>
  <header class="l-header">
    <div class="l-header__bottom u-relative">
      <div class="u-container">
        <div class="l-header__bottom-left">
          <UiCLogo />
          <UiCMenu :headerMenu="headerMenu" v-if="headerMenu.length"/>
        </div>
        <div class="l-header__bottom-right">
          <UiCSearchForm />
          <div class="c-service cart d-none d-sm-block">
            <ClientOnly>
              <template #default>
                <div>
                  <span class="c-service__count">{{ cartStore.cartProducts.length }}</span>
                  <svg width="20px" height="20px"><use xlink:href="#cart"></use></svg>
                </div>

                <div class="c-service__dropdown">
                  <LayoutLMiniCart
                    :cartButtons="true"
                    :cartTitle="true"
                    :cartProducts="cartStore.cartProducts"
                    :totalAmount="cartStore.totalAmount"
                  />
                </div>
              </template>

              <template #fallback>
                <div>
                  <span class="c-service__count">0</span>
                  <svg width="20px" height="20px"><use xlink:href="#cart"></use></svg>
                </div>
              </template>
            </ClientOnly>
          </div>
          <div class="c-dropdown js-dropdown" :class="{'is-active': activeDropdown}" @click="activeDropdown = !activeDropdown">
            <span class="c-dropdown__current">{{ $t('help') }}</span>
            <svg width="11px" height="7px" class="u-arrow"><use xlink:href="#arrow"></use></svg>
            <ul class="c-dropdown__list">
              <li><NuxtLink :to="siteLink('delivery')">{{ $t('delivery') }}</NuxtLink></li>
              <li><NuxtLink :to="siteLink('returns')">{{ $t('returns') }}</NuxtLink></li>
              <li><NuxtLink :to="siteLink('warranty')">{{ $t('warranty') }}</NuxtLink></li>
              <li><NuxtLink :to="siteLink('reviews')">{{ $t('reviews') }}</NuxtLink></li>
              <li><a href="tel:+380663156536">+38 (066) 315 65 36</a></li>
            </ul>
          </div>

          <!-- Пути переводов известны только после загрузки страницы, поэтому ссылки рисуются на клиенте;
               роботам переводы отдаёт hreflang в <head>. -->
          <ClientOnly>
            <UiCLang :langs="languageLinks" :currentLang="locale" @switch="onLanguageSwitch" />
            <template #fallback>
              <UiCLang :currentLang="locale" />
            </template>
          </ClientOnly>

          <div class="c-burger d-block d-sm-none" @click="mobileMenuModal">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    <UiCStickyMenu :mobile-menu="mobileMenu" />
  </header>
</template>

<script setup>
const route = useRoute()
const { locale, locales } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const siteLink = useSiteLink()
const cartStore = useCartStore()
const alternates = usePageAlternates()
const { open } = usePopup()
const { startLanguageSwitchLoader } = useLanguageSwitchLoader()

const activeDropdown = ref(false)

const { data: menus } = useMenus()

const headerMenu = computed(() => menus.value?.header || [])
const mobileMenu = computed(() => menus.value?.mobile || {})

// Страницы из WP: переводы из api/route (слаги в языках разные), без перевода — главная языка.
// Страницы фронта (корзина, поиск): меняется только префикс.
const languageLinks = computed(() => {
  const items = alternates.value[normalizePath(route.path)]

  return locales.value.map(({ code }) => {
    const path = items
      ? items.find(item => item.lang === code)?.path || localePath('/', code)
      : switchLocalePath(code) || localePath('/', code)

    return { code, path }
  })
})

function onLanguageSwitch(code) {
  if (code !== locale.value) {
    startLanguageSwitchLoader()
  }
}

function mobileMenuModal() {
  open('PopupMobileMenu', { menu: mobileMenu.value })
}
cartStore.setTotalAmount()
</script>

<style lang="scss">
@import "~/assets/scss/layout/header.scss";
@import "~/assets/scss/components/burger.scss";
@import "~/assets/scss/components/dropdown.scss";
@import "~/assets/scss/components/service.scss";
</style>
