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
              <li><NuxtLink :to="localePath('/dostavka-i-oplata')">{{ $t('delivery') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/vozvrat-i-obmen')">{{ $t('returns') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/garantiya')">{{ $t('warranty') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/reviews')">{{ $t('reviews') }}</NuxtLink></li>
              <li><a href="tel:+38(066)3156536">+38 (066) 315 65 36</a></li>
            </ul>
          </div>

          <UiCLang v-if="languages.length" :langs="languages" :currentLang="locale" @update:currentLang="updateLanguage" />

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
const { locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const cartStore = useCartStore()
const { open } = usePopup()
const { startLanguageSwitchLoader, stopLanguageSwitchLoader } = useLanguageSwitchLoader()

const activeDropdown = ref(false)
const menuKey = computed(() => `header-menu:${locale.value}`)

const { data: menuData } = useAsyncData(
  menuKey,
  async () => {
    const [headerMenu, mobileMenu, languagesResponse] = await Promise.all([
      $fetch('/api/menu/get_menu_header', { params: { lang: locale.value } }),
      $fetch('/api/menu/get_menu_mobile', { params: { lang: locale.value } }),
      $fetch('/api/menu/languages', { params: { lang: locale.value, url: route.fullPath } }),
    ])

    return {
      headerMenu: headerMenu || [],
      mobileMenu: mobileMenu || {},
      languages: languagesResponse?.languages ? Object.values(languagesResponse.languages) : [],
    }
  },
  {
    watch: [locale],
    default: () => ({
      headerMenu: [],
      mobileMenu: {},
      languages: [],
    }),
    getCachedData(key, nuxtApp) {
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
    },
  }
)

const headerMenu = computed(() => menuData.value?.headerMenu || [])
const mobileMenu = computed(() => menuData.value?.mobileMenu || {})
const languages = computed(() => menuData.value?.languages || [])

async function updateLanguage(newLang) {
  if (newLang === locale.value) return

  const targetPath = switchLocalePath(newLang)
  if (!targetPath || targetPath === route.fullPath) return

  startLanguageSwitchLoader()

  try {
    await navigateTo(targetPath)
  } catch (error) {
    stopLanguageSwitchLoader()
    throw error
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